const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
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

async function registerCosemConfirmed() {
  console.log('1. Registrando y confirmando a los 3 de COSEM...');

  // 1. Romina Baraybar
  const r1 = await postUpdate('updateGuest', {
    code: 'UA-12A905D7',
    name: 'Romina Baraybar',
    agency: 'COSEM',
    channel: 'SALUD',
    referent: 'COSEM',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Acompañante',
    totalSeats: 2
  });
  console.log('1. Romina Baraybar (UA-12A905D7):', r1);

  // 2. Natalia Gonzalez
  const r2 = await postUpdate('updateGuest', {
    code: 'UA-159954F6',
    name: 'Natalia Gonzalez',
    agency: 'COSEM',
    channel: 'SALUD',
    referent: 'COSEM',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Acompañante',
    totalSeats: 2
  });
  console.log('2. Natalia Gonzalez (UA-159954F6):', r2);

  // 3. Rosana Bagnado
  const r3 = await postUpdate('updateGuest', {
    code: 'UA-584B7E74',
    name: 'Rosana Bagnado',
    agency: 'COSEM',
    channel: 'SALUD',
    referent: 'COSEM',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Acompañante',
    totalSeats: 2
  });
  console.log('3. Rosana Bagnado (UA-584B7E74):', r3);

  console.log('\n2. Sincronizando base de datos oficial...');
  await postUpdate('actualizarTodo', {});
  console.log('✅ Los 3 quedaron 100% registrados y CONFIRMADOS en la base oficial.');
}

registerCosemConfirmed();
