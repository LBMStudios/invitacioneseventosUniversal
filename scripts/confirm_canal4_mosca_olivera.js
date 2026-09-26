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
  console.log('1. Confirmando a Mariano Mosca (4 lugares: Verónica Preverell, Luana Mosca, Santino Mosca)...');
  const res1 = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-C40101A1&name=${encodeURIComponent('Mariano Mosca')}&email=mmosca@canal4.com.uy&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent('Verónica Preverell | Luana Mosca | Santino Mosca')}&totalSeats=4&agency=Canal%204&channel=MEDIOS%20/%20PRENSA`);
  console.log('Mariano Mosca:', res1);

  console.log('\n2. Confirmando a Javier Olivera (5 lugares: Inés Calabuig, Santino Olivera, Micaela Olivera, Bautista Olivera)...');
  const res2 = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-C40404D4&name=${encodeURIComponent('Javier Olivera')}&email=jolivera@canal4.com.uy&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent('Inés Calabuig | Santino Olivera | Micaela Olivera | Bautista Olivera')}&totalSeats=5&agency=Canal%204&channel=MEDIOS%20/%20PRENSA`);
  console.log('Javier Olivera:', res2);

  console.log('\n3. Sincronizando caché y reportes...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');

  console.log('\n4. Verificando datos live...');
  const g1 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-C40101A1');
  console.log('Mariano Mosca live:', JSON.stringify(g1.guest, null, 2));

  const g2 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-C40404D4');
  console.log('Javier Olivera live:', JSON.stringify(g2.guest, null, 2));
}

run().catch(console.error);
