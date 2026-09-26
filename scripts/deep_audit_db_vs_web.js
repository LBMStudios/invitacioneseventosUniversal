const https = require('https');
const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getJSON(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('1. Obteniendo estadísticas y lista en vivo desde Apps Script / Google Sheets...');
  const statsRes = await getJSON(WEBAPP_URL + '?action=getCapacityStats');
  const adminListRes = await getJSON(WEBAPP_URL + '?action=adminList');
  const liveGuests = adminListRes.guests || [];

  console.log('Estadísticas en vivo recibidas:', statsRes);
  console.log('Total registros en vivo:', liveGuests.length);

  // Cargar base local previa
  let localGuests = [];
  try {
    localGuests = JSON.parse(fs.readFileSync('Base_Invitados_Agencias_UA.json', 'utf8'));
  } catch(e) {}

  console.log('Total registros en Base Local previa:', localGuests.length);

  // Análisis de confirmados en vivo
  const confirmedLive = liveGuests.filter(g => (g.status || '').toLowerCase() === 'confirmado');
  const waitlistLive = liveGuests.filter(g => (g.status || '').toLowerCase() === 'lista de espera');
  const declinedLive = liveGuests.filter(g => (g.status || '').toLowerCase() === 'no asiste');
  const expiredLive = liveGuests.filter(g => (g.status || '').toLowerCase() === 'expirado');
  const pendingLive = liveGuests.filter(g => (g.status || '').toLowerCase() === 'pendiente');

  let totalLiveSeats = 0;
  confirmedLive.forEach(g => {
    totalLiveSeats += Number(g.totalSeats || 1);
  });

  console.log('\n=== AUDITORÍA DETALLADA EN VIVO ===');
  console.log('Confirmados (Titulares):', confirmedLive.length);
  console.log('Butacas Confirmadas en Sala:', totalLiveSeats);
  console.log('Butacas Disponibles:', 300 - totalLiveSeats);
  console.log('Lista de Espera:', waitlistLive.length);
  console.log('No asiste (Declinados):', declinedLive.length);
  console.log('Expirados (Sin responder):', expiredLive.length);
  console.log('Pendientes:', pendingLive.length);

  // Verificar si hay algún registro con acompañante cargado pero estado no confirmado
  const anomalyCompanions = liveGuests.filter(g => {
    const hasComp = g.companionName && g.companionName.trim().length > 0;
    const isConf = (g.status || '').toLowerCase() === 'confirmado';
    const isDecl = (g.status || '').toLowerCase() === 'no asiste';
    return hasComp && !isConf && !isDecl;
  });

  console.log('\n=== ANOMALÍAS DE ACOMPAÑANTES SIN CONFIRMAR ===');
  if (anomalyCompanions.length === 0) {
    console.log('✅ CERO anomalías: Todos los que tienen acompañante cargado están 100% Confirmados.');
  } else {
    console.log('⚠️ Detectados:', JSON.stringify(anomalyCompanions, null, 2));
  }

  // Verificar discrepancias entre base local y base en vivo
  console.log('\n=== DISCREPANCIAS LOCAL vs LIVE ===');
  const localMap = new Map(localGuests.map(g => [g.code, g]));
  const liveMap = new Map(liveGuests.map(g => [g.code, g]));

  const newlyAdded = [];
  const statusChanges = [];

  for (const lg of liveGuests) {
    const loc = localMap.get(lg.code);
    if (!loc) {
      newlyAdded.push(lg);
    } else {
      if ((loc.status || '') !== (lg.status || '') || Number(loc.totalSeats || 1) !== Number(lg.totalSeats || 1) || (loc.companionName || '') !== (lg.companionName || '')) {
        statusChanges.push({
          code: lg.code,
          name: lg.name,
          localStatus: loc.status,
          liveStatus: lg.status,
          localSeats: loc.totalSeats,
          liveSeats: lg.totalSeats,
          localComp: loc.companionName,
          liveComp: lg.companionName
        });
      }
    }
  }

  console.log('Nuevos registros en vivo no presentes en local:', newlyAdded.length);
  if (newlyAdded.length > 0) console.log(JSON.stringify(newlyAdded, null, 2));

  console.log('Cambios de estado / butacas entre local y vivo:', statusChanges.length);
  if (statusChanges.length > 0) console.log(JSON.stringify(statusChanges, null, 2));

  // Guardar archivo de auditoría completo
  fs.writeFileSync('audit_comparison_result.json', JSON.stringify({
    statsRes,
    totalLiveSeats,
    availableSeats: 300 - totalLiveSeats,
    confirmedCount: confirmedLive.length,
    waitlistCount: waitlistLive.length,
    declinedCount: declinedLive.length,
    expiredCount: expiredLive.length,
    pendingCount: pendingLive.length,
    anomalyCompanions,
    newlyAdded,
    statusChanges
  }, null, 2));
}

run().catch(console.error);
