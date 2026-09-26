const https = require('https');
const fs = require('fs');

const scriptUrl = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList';

function fetchUrl(url) {
  https.get(url, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return fetchUrl(res.headers.location);
    }
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const list = json.guests || [];
        console.log('Total guests in live sheet:', list.length);
        fs.writeFileSync('live_guests_dump.json', JSON.stringify(list, null, 2));

        const matches = list.filter(g => {
          const s = JSON.stringify(g).toLowerCase();
          return s.includes('mayoral') || s.includes('barbara') || s.includes('bárbara') || s.includes('delia') || s.includes('d\'elia') || s.includes('d´elia');
        });
        console.log('Matches:', JSON.stringify(matches, null, 2));
      } catch (e) {
        console.log('Error:', e.message);
      }
    });
  });
}

fetchUrl(scriptUrl);
