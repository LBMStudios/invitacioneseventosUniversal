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
  console.log('1. Pasando a Shirley Cervantes (UA-7E81C09F) a "No asiste"...');
  const res1 = await getJSON(WEBAPP_URL + '?action=updateGuest&code=UA-7E81C09F&status=No%20asiste&companion=No&companionName=&totalSeats=0');
  console.log('Shirley Cervantes:', res1);

  console.log('2. Pasando a Valeria Amaral (UA-4F91B2C8) a "No asiste"...');
  const res2 = await getJSON(WEBAPP_URL + '?action=updateGuest&code=UA-4F91B2C8&status=No%20asiste&companion=No&companionName=&totalSeats=0');
  console.log('Valeria Amaral:', res2);

  console.log('\n3. Sincronizando reportes y caché...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');

  console.log('\n4. Verificando estado live...');
  const g1 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-7E81C09F');
  console.log('Shirley live:', g1.guest);

  const g2 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-4F91B2C8');
  console.log('Valeria live:', g2.guest);
}

run().catch(console.error);
