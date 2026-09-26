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
  console.log('1. Actualizando Yhonson Choca (UA-CAE070ED) a 2 asientos (con Faustino Choca)...');
  const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-CAE070ED&name=${encodeURIComponent('Yhonson Choca')}&email=contable@ua.com.uy&companion=S%C3%AD&companionName=${encodeURIComponent('Faustino Choca')}&totalSeats=2&status=Confirmado&agency=SURVIEW&channel=FUNCIONARIO%20SURVIEW&referent=FUNCIONARIO`);
  console.log('Resultado:', res);

  console.log('\n2. Verificando datos live...');
  const g = await getJSON(WEBAPP_URL + '?action=guest&code=UA-CAE070ED');
  console.log('Datos live de Yhonson Choca:', g.guest);
})();
