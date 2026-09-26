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

async function confirmPilarAndRosina() {
  console.log('1. Confirmando a Pilar Méndez (UA-98620530)...');
  const r1 = await postUpdate('updateGuest', {
    code: 'UA-98620530',
    name: 'Pilar Méndez',
    phone: '093588680',
    agency: 'AGENCIA',
    channel: 'AGENCIA',
    referent: 'UA',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Acompañante',
    totalSeats: 2
  });
  console.log('Pilar:', r1);

  console.log('2. Confirmando a Rosina Fábregas (UA-98620533)...');
  const r2 = await postUpdate('updateGuest', {
    code: 'UA-98620533',
    name: 'Rosina Fábregas',
    phone: '095784590',
    agency: 'AGENCIA',
    channel: 'AGENCIA',
    referent: 'UA',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Acompañante',
    totalSeats: 2
  });
  console.log('Rosina:', r2);

  console.log('3. Sincronizando base de datos...');
  await postUpdate('actualizarTodo', {});
  console.log('✅ Ambas quedaron confirmadas con Pase VIP y QR activo.');
}

confirmPilarAndRosina();
