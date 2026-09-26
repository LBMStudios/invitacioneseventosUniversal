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

  const cosem = guests.filter(g => {
    const txt = (g.name + ' ' + g.email + ' ' + g.agency + ' ' + g.referent).toLowerCase();
    return txt.includes('elisa') || txt.includes('costa') || txt.includes('cosem');
  });

  console.log('=== REGISTROS DE ELISA COSTA / COSEM ===');
  cosem.forEach(g => {
    console.log(`Código: ${g.code} | Nombre: ${g.name} | Email: ${g.email} | Estado: ${g.status} | Acomp: ${g.companion} (${g.companionName || 'sin nombre'}) | Lugares: ${g.totalSeats} | Resp: ${g.responseDate} | Link: ${g.link}`);
  });
})();
