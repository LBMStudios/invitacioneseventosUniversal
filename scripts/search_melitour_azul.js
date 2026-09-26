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

  console.log('=== BUSQUEDA DE INVITADOS MELITOUR Y AZUL VIAJES ===');
  
  const searchTerms = ['palermo', 'iafrate', 'galan', 'melitour', 'azul', 'laura rodriguez'];
  
  guests.forEach(g => {
    const txt = `${g.name} ${g.email} ${g.agency} ${g.referent}`.toLowerCase();
    if (searchTerms.some(term => txt.includes(term))) {
      console.log(`${g.code} | ${g.name} | ${g.email} | ${g.agency} | Ref: ${g.referent} | Lugares: ${g.totalSeats} | Estado: ${g.status} | Link: ${g.link}`);
    }
  });
})();
