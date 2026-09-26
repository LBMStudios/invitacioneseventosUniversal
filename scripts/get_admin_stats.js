const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminStats';

function fetchUrl(url) {
  https.get(url, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return fetchUrl(res.headers.location);
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('STATS RESPONSE:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Error parsing response:', e.message);
      }
    });
  }).on('error', err => console.error('Request error:', err));
}

fetchUrl(WEBAPP_URL);
