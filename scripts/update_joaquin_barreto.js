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
  console.log('1. Actualizando Joaquín Barreto (UA-D672D07F) a 3 cupos...');
  const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-D672D07F&name=${encodeURIComponent('Joaquín Barreto')}&totalSeats=3&channel=SALUD&agency=AMSJ&referent=AM/MT`);
  console.log('Resultado actualización:', res);

  console.log('\n2. Verificando datos live...');
  const g = await getJSON(WEBAPP_URL + '?action=guest&code=UA-D672D07F');
  console.log('Joaquín Barreto live:', g.guest);
})();
