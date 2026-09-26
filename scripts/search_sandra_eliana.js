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

  console.log('--- BUSCANDO SANDRA / YUANE / PIZZORNO / MENDEZ ---');
  guests.forEach(g => {
    const txt = `${g.name} ${g.email} ${g.agency} ${g.referent}`.toLowerCase();
    if (txt.includes('yuane') || txt.includes('pizzorno') || txt.includes('sandra') || txt.includes('eliana') || txt.includes('mendez')) {
      console.log(`${g.code} | ${g.name} | ${g.email} | ${g.agency} | Ref: ${g.referent} | Asientos: ${g.totalSeats} | Estado: ${g.status}`);
    }
  });
})();
