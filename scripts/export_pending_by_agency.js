const https = require('https');
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

(async () => {
  const list = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = list.guests || [];

  const pending = guests.filter(g => (g.status || 'Pendiente') === 'Pendiente');

  const byAgency = {};

  pending.forEach(g => {
    const ag = g.agency || g.channel || 'Otras';
    if (!byAgency[ag]) byAgency[ag] = [];
    byAgency[ag].push(g);
  });

  console.log('=== RESUMEN POR EMPRESA / AGENCIA ===');
  Object.keys(byAgency).sort().forEach(ag => {
    console.log(`- ${ag}: ${byAgency[ag].length} invitados`);
  });

  const fs = require('fs');
  fs.writeFileSync('./scripts/pending_by_agency.json', JSON.stringify(byAgency, null, 2));
})();
