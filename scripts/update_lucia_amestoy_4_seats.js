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
  const companionName = 'Juan Pablo Morales | Karina | Diego';
  console.log('1. Actualizando a Lucia Amestoy (UA-49D8E751) a 4 cupos con:', companionName);

  const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-49D8E751&name=${encodeURIComponent('Lucia Amestoy')}&email=${encodeURIComponent('lucia.amestoy@amestoyuruguay.com')}&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent(companionName)}&totalSeats=4&channel=AGENCIA&agency=Amestoy%20Viajes&referent=Ana%20Laura%20Britos`);
  console.log('Resultado actualización:', res);

  console.log('\n2. Verificando datos live...');
  const g = await getJSON(WEBAPP_URL + '?action=guest&code=UA-49D8E751');
  console.log('Datos live de Lucia Amestoy:', g.guest);
})();
