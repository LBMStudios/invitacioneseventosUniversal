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
  console.log('1. Actualizando a Federico Alonso (UA-96126470) a 3 butacas con Andres Alonso y German Braida...');
  const res = await getJSON(WEBAPP_URL + '?action=updateGuest&code=UA-96126470&status=Confirmado&companion=S%C3%AD&companionName=Andres%20Alonso%20%7C%20German%20Braida&totalSeats=3&agency=Active%20Travel');
  console.log('Resultado update:', res);

  console.log('\n2. Sincronizando caché y reportes...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');

  console.log('\n3. Verificando datos live...');
  const g = await getJSON(WEBAPP_URL + '?action=guest&code=UA-96126470');
  console.log('Datos live:', JSON.stringify(g.guest, null, 2));
}

run().catch(console.error);
