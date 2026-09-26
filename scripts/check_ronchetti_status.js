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

async function main() {
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = data.guests || [];

  const targetGuests = guests.filter(g => 
    (g.email || '').toLowerCase().includes('ronchetti') ||
    (g.email || '').toLowerCase().includes('jorgemartinez') ||
    (g.name || '').toLowerCase().includes('ronchetti') ||
    (g.name || '').toLowerCase().includes('schipilov')
  );

  console.log('--- Invitados asociados en Base de Datos ---');
  targetGuests.forEach(g => {
    console.log(`- Código: ${g.code} | Nombre: ${g.name} | Email: ${g.email} | Estado: ${g.status} | Butacas: ${g.totalSeats} | Acomp: ${g.companionName} | Agencia: ${g.agency}`);
  });

  // Revisar reporte de despacho de hoy
  try {
    const todayReport = JSON.parse(fs.readFileSync('reporte_despacho_hoy_resultado.json', 'utf8'));
    console.log('\n--- Envíos de HOY (08:56 hs) ---');
    const sentToday = (todayReport.details || []).filter(d => 
      (d.email || '').toLowerCase().includes('ronchetti') ||
      (d.email || '').toLowerCase().includes('jorgemartinez')
    );
    console.log(JSON.stringify(sentToday, null, 2));
  } catch (e) {
    console.log('No se pudo leer reporte_despacho_hoy_resultado.json:', e.message);
  }

  // Revisar cruce de aperturas
  try {
    const cruceReport = JSON.parse(fs.readFileSync('cruce_aperturas_reporte.json', 'utf8'));
    console.log('\n--- Estado en Cruce de Aperturas ---');
    const allCruce = [
      ...(cruceReport.grupoA_Detalle || []),
      ...(cruceReport.grupoB_Detalle_RequierenAtencion || []),
      ...(cruceReport.grupoC_Detalle || []),
      ...(cruceReport.grupoD_Detalle || [])
    ];
    const matchCruce = allCruce.filter(c => 
      (c.email || '').toLowerCase().includes('ronchetti') ||
      (c.email || '').toLowerCase().includes('jorgemartinez')
    );
    console.log(JSON.stringify(matchCruce, null, 2));
  } catch (e) {}
}

main();
