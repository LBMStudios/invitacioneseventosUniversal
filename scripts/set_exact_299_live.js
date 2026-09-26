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

// Lista de pases a marcar como No Asiste / Expirado para que queden exactamente 299 butacas confirmadas
const TO_EXCLUDE = [
  { code: 'UA-1615D3F1', reason: 'Juan Borrelli (declined)' },
  { code: 'UA-98620610', reason: 'Orlandys (duplicate)' },
  { code: 'UA-AFE37A09', reason: 'Juan Francisco Richelli (included in Marianela Ibiñete)' },
  { code: 'UA-9CF6443E', reason: 'Extra Vendedor (included in Bárbara Mayoral)' },
  { code: 'UA-C40303C3', reason: 'B. Perdomo extra canal4' }
];

async function exact299() {
  for (const item of TO_EXCLUDE) {
    console.log(`Desactivando ${item.code} (${item.reason})...`);
    const params = new URLSearchParams({
      action: 'updateGuest',
      code: item.code,
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

exact299().catch(console.error);
