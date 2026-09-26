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
  console.log('1. Cambiando estado a Pendiente para Fabrizio Maglione (UA-6DD558DE) manteniendo 3 cupos...');
  const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-6DD558DE&name=${encodeURIComponent('Fabrizio Maglione')}&email=${encodeURIComponent('fmaglione@jpsantos.com.uy')}&phone=${encodeURIComponent('094280281')}&status=Pendiente&companion=S%C3%AD&companionName=${encodeURIComponent('Lorenzo Maglione')}&totalSeats=3&channel=AGENCIA&agency=JP%20Santos&referent=Ana%20Laura%20Britos&stage=Env%C3%ADo%20Manual`);
  console.log('Resultado:', res);

  console.log('\n2. Verificando datos live en landing...');
  const g = await getJSON(WEBAPP_URL + '?action=guest&code=UA-6DD558DE');
  console.log('Datos live:', g.guest);
})();
