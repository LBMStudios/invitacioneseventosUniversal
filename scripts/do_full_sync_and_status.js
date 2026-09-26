const https = require('https');
const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fullSync() {
  console.log('1. Ejecutando actualizarTodo en Google Apps Script (sincronización y recálculo de reportes)...');
  const syncRes = await fetchUrl(WEBAPP_URL + '?action=actualizarTodo');
  console.log('Respuesta sync:', syncRes);

  console.log('\n2. Descargando base completa actualizada...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const allGuests = data.guests || [];

  fs.writeFileSync('guest_dump_live.json', JSON.stringify(data, null, 2), 'utf8');

  // Clasificación por estado
  const statusMap = {
    'Confirmado': [],
    'Expirado': [],
    'No asiste': [],
    'Lista de Espera': [],
    'Pendiente': []
  };

  allGuests.forEach(g => {
    const s = (g.status || 'Pendiente').trim();
    if (s.includes('Confirmad')) statusMap['Confirmado'].push(g);
    else if (s.includes('Expirad')) statusMap['Expirado'].push(g);
    else if (s.includes('No asiste')) statusMap['No asiste'].push(g);
    else if (s.includes('Espera')) statusMap['Lista de Espera'].push(g);
    else statusMap['Pendiente'].push(g);
  });

  const confirmedSeats = statusMap['Confirmado'].reduce((sum, g) => sum + (Number(g.totalSeats) || 1), 0);
  const tit = statusMap['Confirmado'].length;
  const acomp = confirmedSeats - tit;

  console.log(`\n======================================================`);
  console.log(`ESTADO GENERAL ACTUALIZADO DE LA BASE DE DATOS`);
  console.log(`======================================================`);
  console.log(`• Total Registros en Base: ${allGuests.length}`);
  console.log(`• ✅ Confirmados: ${tit} pases -> ${confirmedSeats} butacas (${tit} tit. + ${acomp} acomp.)`);
  console.log(`• ⏰ Expirados: ${statusMap['Expirado'].length} pases`);
  console.log(`• ❌ No asisten: ${statusMap['No asiste'].length} pases`);
  console.log(`• 📋 Lista de Espera: ${statusMap['Lista de Espera'].length} personas`);
  console.log(`• ⏳ Pendientes: ${statusMap['Pendiente'].length} personas`);
  console.log(`------------------------------------------------------`);
  console.log(`ASISTENCIA EN SALA:`);
  console.log(`• Capacidad Sala Movie: 300 Butacas (299 nominal)`);
  console.log(`• Asistentes Reales Confirmados: ${confirmedSeats} Butacas`);
  console.log(`• Lugares Disponibles / Libres: ${Math.max(0, 300 - confirmedSeats)}`);
  console.log(`======================================================`);
}

fullSync().catch(console.error);
