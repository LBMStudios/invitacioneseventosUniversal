const https = require('https');

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
        
        let matches = [];
        list.forEach(g => {
          const s = JSON.stringify(g).toLowerCase();
          if (s.includes('mayoral') || s.includes('barbara') || s.includes('bárbara') || s.includes('delia') || s.includes('d\'elia') || s.includes('d´elia') || s.includes('javier')) {
            matches.push(g);
          }
        });
        console.log('MATCHES FOUND:', JSON.stringify(matches, null, 2));
      } catch (e) {
        console.log('Error parsing response:', e.message);
      }
    });
  }).on('error', err => console.error('Request error:', err));
}

fetchUrl(scriptUrl);
