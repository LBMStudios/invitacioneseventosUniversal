const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function auditConfirmed() {
  console.log('Consultando base de datos oficial...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = res.guests || [];

  console.log(`Total registros en base: ${guests.length}`);

  const byStatus = {};
  guests.forEach(g => {
    const s = g.status || 'Pendiente';
    byStatus[s] = (byStatus[s] || 0) + 1;
  });
  console.log('\n--- DESGLOSE POR ESTADO ---');
  console.log(byStatus);

  const confirmed = guests.filter(g => g.status === 'Confirmado');
  let totalSeats = 0;
  console.log(`\n--- LISTA DETALLADA DE CONFIRMADOS (${confirmed.length} titulares) ---`);
  confirmed.forEach((g, idx) => {
    const seats = Number(g.totalSeats) || 2;
    totalSeats += seats;
    console.log(`${idx + 1}. [${g.code}] ${g.name} | Butacas: ${seats} | Acomp: "${g.companionName || 'Sin acomp'}" | Agencia: ${g.agency || 'N/A'}`);
  });

  console.log('\n=============================================');
  console.log(`TOTAL TITULARES CONFIRMADOS: ${confirmed.length}`);
  console.log(`TOTAL BUTACAS OCUPADAS: ${totalSeats}`);
  console.log(`CAPACIDAD TOTAL SALA: 300`);
  console.log(`BUTACAS DISPONIBLES: ${300 - totalSeats}`);
  console.log(`PORCENTAJE DE OCUPACIÓN: ${((totalSeats / 300) * 100).toFixed(1)}%`);
  console.log('=============================================');
}

auditConfirmed();
