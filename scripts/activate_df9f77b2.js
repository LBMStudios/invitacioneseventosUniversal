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
  console.log('1. Creando / Activando código UA-DF9F77B2 para Laura Caprio (SEMM)...');
  const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-DF9F77B2&name=${encodeURIComponent('Laura Caprio')}&email=${encodeURIComponent('laura.caprio@semm.com.uy')}&totalSeats=2&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent('')}&channel=SALUD&agency=SEMM&referent=AM/MT&stage=1er%20Env%C3%ADo`);
  console.log('Resultado actualización:', res);

  console.log('\n2. Verificando endpoint público de landing...');
  const g = await getJSON(WEBAPP_URL + '?action=guest&code=UA-DF9F77B2');
  console.log('Datos live de UA-DF9F77B2:', g);
})();
