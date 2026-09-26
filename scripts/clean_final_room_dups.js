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

const CLEANUP = [
  'UA-E2D839E8-C', // Duplicado de CAMBADU (ya está UA-B9D60563 con Mónica Prentice)
  'UA-12B86D7F-MJ', // Duplicado manual Maria Jose
  'UA-C9E7B342', // Duplicado Belén Arbiza (ya está UA-3771D38F con Victoria Martinez)
  'UA-7BA7B4C8' // Duplicado Carmen Galan (ya está UA-98620601 con Belén Pranka)
];

async function cleanDups() {
  for (const code of CLEANUP) {
    console.log(`Anulando duplicado ${code}...`);
    const params = new URLSearchParams({
      action: 'updateGuest',
      code: code,
      status: 'No asiste',
      totalSeats: '0'
    });
    await fetchUrl(`${WEBAPP_URL}?${params.toString()}`);
  }

  console.log('\nConsultando conteo final...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const conf = (data.guests || []).filter(g => (g.status || '').trim() === 'Confirmado');

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

cleanDups().catch(console.error);
