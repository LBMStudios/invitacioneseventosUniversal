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

async function registerCambadu() {
  console.log('Registrando y confirmando Enrique Haladjian y Mónica Prentice (CAMBADU)...');

  const res = await postUpdate('updateGuest', {
    code: 'UA-B9D60563',
    name: 'Enrique Haladjian',
    agency: 'CAMBADU',
    channel: 'ALIANZAS ESTRATEGICAS',
    referent: 'CAMBADU',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Mónica Prentice',
    totalSeats: 2
  });
  console.log('Update result:', res);

  console.log('Sincronizando...');
  await postUpdate('actualizarTodo', {});
  console.log('✅ Enrique Haladjian y Mónica Prentice confirmados con QR activo.');
}

registerCambadu();
