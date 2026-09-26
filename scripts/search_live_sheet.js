const fs = require('fs');
const https = require('https');

const scriptUrl = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=getGuests';

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
        const list = json.guests || (Array.isArray(json) ? json : []);
        console.log('Total guests in live sheet:', list.length);
        
        let found = 0;
        list.forEach(g => {
          const s = JSON.stringify(g);
          if (/mayoral|barbara|bárbara|delia|d'elia|d´elia|javier/i.test(s)) {
            console.log('FOUND IN LIVE SHEET:', g);
            found++;
          }
        });
        if (found === 0) {
          console.log('No exact matches found. Checking loose matches...');
          list.forEach(g => {
            const name = (g.name || g.nombre || '').toLowerCase();
            const email = (g.email || '').toLowerCase();
            const comp = (g.companionName || g.acompaniante || '').toLowerCase();
            if (name.includes('barb') || name.includes('mayo') || email.includes('mayo') || comp.includes('delia') || comp.includes('javier')) {
              console.log('LOOSE MATCH:', g);
            }
          });
        }
      } catch (e) {
        console.log('Error parsing response:', e.message);
      }
    });
  }).on('error', err => console.error('Request error:', err));
}

fetchUrl(scriptUrl);
