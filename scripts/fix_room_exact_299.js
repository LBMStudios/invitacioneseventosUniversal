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

async function fixDuplicate() {
  console.log('1. Desactivando pase duplicado de Juan Francisco Richelli (UA-AFE37A09 - ya incluido en pase Marianela Ibiñete)...');
  const params = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-AFE37A09',
    name: 'Juan Francisco Richelli (Duplicado Ibiñete)',
    status: 'No asiste',
    totalSeats: '0'
  });
  await fetchUrl(`${WEBAPP_URL}?${params.toString()}`);

  console.log('2. Desactivando pase duplicado de Extra Vendedor SEMM (UA-9CF6443E - Javier Delia / Bárbara Mayoral)...');
  const params2 = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-9CF6443E',
    name: 'Extra Vendedor (Duplicado Mayoral)',
    status: 'No asiste',
    totalSeats: '0'
  });
  await fetchUrl(`${WEBAPP_URL}?${params2.toString()}`);

  console.log('3. Consultando conteo en vivo de confirmados...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const guests = (data.guests || []).filter(g => (g.status || '').trim() === 'Confirmado');

  const seats = guests.reduce((s, g) => s + (Number(g.totalSeats) || 1), 0);
  const tit = guests.length;
  const acomp = seats - tit;

  console.log(`\n========================================`);
  console.log(`ASISTENTES EN SALA EN VIVO:`);
  console.log(`  • Butacas ocupadas: ${seats} / 300`);
  console.log(`  • Butacas disponibles: ${300 - seats}`);
  console.log(`  • Pases confirmados: ${tit} (${tit} tit. + ${acomp} acomp.)`);
  console.log(`========================================`);
}

fixDuplicate().catch(console.error);
