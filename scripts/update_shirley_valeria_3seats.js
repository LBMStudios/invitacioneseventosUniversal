const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function postUpdate(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  return fetchUrl(fullUrl);
}

async function update3SeatsEach() {
  console.log('1. Actualizando Shirley Cervantes (UA-7E81C09F) a 3 pases (1 titular + 2 hijos)...');
  const r1 = await postUpdate('updateGuest', {
    code: 'UA-7E81C09F',
    name: 'Shirley Cervantes',
    email: 'cervantesshirley@gmail.com',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: '2 Hijos',
    totalSeats: 3
  });
  console.log('Shirley Cervantes:', r1);

  console.log('2. Actualizando Valeria Amaral (UA-4F91B2C8) a 3 pases (1 titular + 2 hijos)...');
  const r2 = await postUpdate('updateGuest', {
    code: 'UA-4F91B2C8',
    name: 'Valeria Amaral',
    email: 'valeria.amaral@gmail.com',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: '2 Hijos',
    totalSeats: 3
  });
  console.log('Valeria Amaral:', r2);

  console.log('3. Ejecutando sync y limpieza de cache (actualizarTodo)...');
  const rSync = await postUpdate('actualizarTodo', {});
  console.log('Resultado actualizarTodo:', rSync);

  console.log('4. Sincronizando Hoja3 (syncSheet)...');
  const rSheet = await postUpdate('syncSheet', {});
  console.log('Resultado syncSheet:', rSheet);

  console.log('\n5. Verificando estado final live...');
  const g1 = await fetchUrl(WEBAPP_URL + '?action=guest&code=UA-7E81C09F');
  const g2 = await fetchUrl(WEBAPP_URL + '?action=guest&code=UA-4F91B2C8');
  console.log('Shirley live:', JSON.stringify(g1.guest, null, 2));
  console.log('Valeria live:', JSON.stringify(g2.guest, null, 2));

  const stats = await fetchUrl(WEBAPP_URL + '?action=adminStats');
  console.log('Stats live:', JSON.stringify(stats, null, 2));
}

update3SeatsEach().catch(console.error);
