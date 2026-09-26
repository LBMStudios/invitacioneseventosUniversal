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
  console.log('1. Actualizando estado de Ignacio Vidal a Confirmado...');
  await getJSON(WEBAPP_URL + '?action=updateGuest&code=UA-0FB47E1B&status=Confirmado&companion=S%C3%AD&companionName=Mariana%20Aguirre&totalSeats=2');

  console.log('2. Actualizando estado de Tiffany Herrera a Confirmado...');
  await getJSON(WEBAPP_URL + '?action=updateGuest&code=UA-96126527&status=Confirmado&companion=S%C3%AD&companionName=Kevin%20Nallem&totalSeats=2');

  console.log('3. Sincronizando reportes y caché...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');
  console.log('Listo.');
}

run().catch(console.error);
