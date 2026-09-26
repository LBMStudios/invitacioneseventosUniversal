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
  console.log('Enviando correo directo oficial de aclaración a Sofia (emisiones@ua.com.uy)...');
  // Usando el endpoint de envío con Gmail directo para garantizar 100% de entrega interna
  const res = await getJSON(WEBAPP_URL + '?action=sendDirectClarification&email=emisiones@ua.com.uy&code=UA-1D94AFD0&name=' + encodeURIComponent('Sofia Ramirez') + '&seats=2&companion=' + encodeURIComponent('THIAGO TINOCO'));
  console.log('Resultado envío directo:', res);
})();
