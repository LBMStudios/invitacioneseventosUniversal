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

async function confirmShirleyAndValeria() {
  console.log('1. Confirmando a Shirley Cervantes (UA-7E81C09F)...');
  const r1 = await postUpdate('updateGuest', {
    code: 'UA-7E81C09F',
    name: 'Shirley Cervantes',
    email: 'cervantesshirley@gmail.com',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Hijo',
    totalSeats: 2
  });
  console.log('Shirley Cervantes:', r1);

  console.log('2. Confirmando a Valeria Amaral (UA-4F91B2C8)...');
  const r2 = await postUpdate('updateGuest', {
    code: 'UA-4F91B2C8',
    name: 'Valeria Amaral',
    email: 'valeria.amaral@gmail.com',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Hijo',
    totalSeats: 2
  });
  console.log('Valeria Amaral:', r2);

  console.log('3. Sincronizando base de datos...');
  const rSync = await postUpdate('actualizarTodo', {});
  console.log('Resultado sincronización:', rSync);

  console.log('\n4. Verificando estado final...');
  const g1 = await fetchUrl(WEBAPP_URL + '?action=guest&code=UA-7E81C09F');
  const g2 = await fetchUrl(WEBAPP_URL + '?action=guest&code=UA-4F91B2C8');
  console.log('Shirley Cervantes live:', JSON.stringify(g1.guest, null, 2));
  console.log('Valeria Amaral live:', JSON.stringify(g2.guest, null, 2));
}

confirmShirleyAndValeria().catch(console.error);
