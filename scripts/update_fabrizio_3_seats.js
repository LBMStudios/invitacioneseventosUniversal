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
  console.log('1. Actualizando Fabrizio Maglione (UA-6DD558DE) a 3 cupos (él y 2 más)...');
  const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-6DD558DE&name=${encodeURIComponent('Fabrizio Maglione')}&totalSeats=3&channel=AGENCIA&agency=JP%20Santos&referent=Ana%20Laura%20Britos`);
  console.log('Resultado actualización:', res);

  console.log('\n2. Verificando endpoint de landing...');
  const g = await getJSON(WEBAPP_URL + '?action=guest&code=UA-6DD558DE');
  console.log('Datos live de Fabrizio Maglione:', g.guest);
})();
