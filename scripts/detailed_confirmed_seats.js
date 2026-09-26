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

async function check() {
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const guests = (data.guests || []).filter(g => (g.status || '').trim() === 'Confirmado');

  console.log(`Total confirmados: ${guests.length}`);
  let totalSeats = 0;
  guests.forEach((g, i) => {
    const s = Number(g.totalSeats) || 1;
    totalSeats += s;
    console.log(`${i + 1}. [${g.code}] ${g.name} — ${s} butacas (${g.companion === 'Sí' ? g.companionName : 'Sin acomp'}) — ${g.agency || g.channel || ''}`);
  });
  console.log(`\nTOTAL BUTACAS: ${totalSeats}`);
}

check().catch(console.error);
