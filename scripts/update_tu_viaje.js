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
  console.log('1. Actualizando Cecilia Cabana (UA-D4AB1964)...');
  // Por defecto si va con 2 hijos (titular + 2 hijos = 3 personas, o si va con pareja = 4)
  // Le configuramos 3 o 4 según corresponda
  const resCecilia = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-D4AB1964&name=${encodeURIComponent('Cecilia Cabana')}&totalSeats=3&agency=Tu%20Viaje&referent=Ana%20Laura%20Britos`);
  console.log('Resultado Cecilia:', resCecilia);

  console.log('\n2. Actualizando Sebastian (UA-81B2E7FB)...');
  const resSebastian = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-81B2E7FB&name=${encodeURIComponent('Sebastian')}&totalSeats=3&agency=Tu%20Viaje&referent=Ana%20Laura%20Britos`);
  console.log('Resultado Sebastian:', resSebastian);

  console.log('\nVerificando datos live:');
  const g1 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-D4AB1964');
  console.log('Cecilia:', g1.guest);
  const g2 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-81B2E7FB');
  console.log('Sebastian:', g2.guest);
})();
