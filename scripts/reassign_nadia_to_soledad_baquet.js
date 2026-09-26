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

async function run() {
  console.log('1. Reasignando pase UA-57B46107 a Soledad Baquet y Martín Baquet (Asoc. Española)...');
  const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-57B46107&name=${encodeURIComponent('Soledad Baquet')}&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent('Martín Baquet')}&totalSeats=2&agency=ASOC%20ESPA%C3%91OLA&channel=SALUD&referent=Angela%20Hoffmann`);
  console.log('Update result:', res);

  console.log('\n2. Sincronizando caché y reportes...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');

  console.log('\n3. Verificando estado live...');
  const g = await getJSON(WEBAPP_URL + '?action=guest&code=UA-57B46107');
  console.log('Live Guest:', JSON.stringify(g.guest, null, 2));
}

run().catch(console.error);
