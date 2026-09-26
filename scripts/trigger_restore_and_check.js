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
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log('1. Ejecutando restoreVIPConfirmed en Apps Script...');
  const res = await fetchUrl(WEBAPP_URL + '?action=restoreVIPConfirmed');
  console.log('Respuesta:', res);

  console.log('\n2. Consultando conteo en vivo de confirmados...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const guests = data.guests || [];

  const conf = guests.filter(g => (g.status || '').trim() === 'Confirmado');
  const seats = conf.reduce((s, g) => s + (Number(g.totalSeats) || 1), 0);
  const tit = conf.length;
  const acomp = seats - tit;

  console.log(`\n========================================`);
  console.log(`ASISTENTES EN SALA EN VIVO:`);
  console.log(`  • Butacas ocupadas: ${seats} / 300`);
  console.log(`  • Butacas disponibles: ${300 - seats}`);
  console.log(`  • Pases confirmados: ${tit} (${tit} tit. + ${acomp} acomp.)`);
  console.log(`========================================`);
}

main().catch(console.error);
