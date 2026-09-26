const https = require('https');
const fs = require('fs');

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
  const data = await getJSON('https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList');
  if (data.guests) {
    fs.writeFileSync('scratch_all_guests.json', JSON.stringify(data.guests, null, 2));
    console.log('Saved', data.guests.length, 'guests to scratch_all_guests.json');
  } else {
    console.log('Error or no guests:', data);
  }
})();
