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
  console.log('1. Confirmando a Wlady Helou (2 lugares)...');
  const res1 = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-C40202B2&name=${encodeURIComponent('Wlady Helou')}&email=whelou@canal4.com.uy&status=Confirmado&companion=S%C3%AD&companionName=Acompa%C3%B1ante&totalSeats=2&agency=Canal%204&channel=MEDIOS%20/%20PRENSA`);
  console.log('Wlady Helou:', res1);

  console.log('\n2. Confirmando a Belén Perdomo (2 lugares)...');
  const res2 = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-C40303C3&name=${encodeURIComponent('Belén Perdomo')}&email=bperdomo@canal4.com.uy&status=Confirmado&companion=S%C3%AD&companionName=Acompa%C3%B1ante&totalSeats=2&agency=Canal%204&channel=MEDIOS%20/%20PRENSA`);
  console.log('Belén Perdomo:', res2);

  console.log('\n3. Limpiando códigos de equipo extra no utilizados de W. Helou...');
  const extraCodes = ['UA-C40505E5', 'UA-C40606F6', 'UA-C40707A7', 'UA-C40808B8'];
  for (const c of extraCodes) {
    await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(c)}&status=No%20asiste&companion=No&companionName=&totalSeats=0`);
  }

  console.log('\n4. Sincronizando caché y reportes...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');

  console.log('\n5. Verificando datos live...');
  const g1 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-C40202B2');
  console.log('Wlady Helou live:', JSON.stringify(g1.guest, null, 2));

  const g2 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-C40303C3');
  console.log('Belén Perdomo live:', JSON.stringify(g2.guest, null, 2));
}

run().catch(console.error);
