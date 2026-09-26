const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const clean = data.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
          resolve(JSON.parse(clean));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const res = await fetchJson(WEBAPP_URL + '?action=adminList&callback=cb');
  const guests = res.guests || [];

  const confirmed = guests.filter(g => (g.status || '').trim().toLowerCase().includes('confirmad'));
  const withoutEmail = confirmed.filter(g => !g.email || !g.email.includes('@'));

  console.log('--- Resumen sin email ---');
  withoutEmail.forEach(g => {
    console.log(`- ${g.name} (${g.company || 'Sin Empresa'}) | Butacas: ${g.totalSeats || 1}`);
  });
}

main();
