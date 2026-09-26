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

async function main() {
  const raw = await fetchUrl(WEBAPP_URL + '?action=guestListCheckin');
  const data = JSON.parse(raw);
  fs.writeFileSync('scripts/bundled_checkin_guests.json', JSON.stringify(data.guests, null, 2));
  console.log(`Guardados ${data.guests.length} invitados para pre-carga instantánea.`);
}

main();
