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

async function removeCIs() {
  console.log('1. Actualizando María José Piuma...');
  const r1 = await postUpdate('updateGuest', {
    code: 'UA-98620619',
    name: 'María José Piuma',
    companionName: 'Josefina Barceló | Micaela Radiccioni',
    agency: 'ANDA',
    channel: 'AGENCIA',
    referent: 'Ana Camiou',
    status: 'Confirmado',
    companion: 'Sí',
    totalSeats: 3
  });
  console.log('R1:', r1);

  console.log('2. Actualizando Rafael Monzón...');
  const r2 = await postUpdate('updateGuest', {
    code: 'UA-98620620',
    name: 'Rafael Monzón',
    companionName: 'Renzo Monzón | Lautaro Monzón',
    agency: 'ANDA',
    channel: 'AGENCIA',
    referent: 'Ana Camiou',
    status: 'Confirmado',
    companion: 'Sí',
    totalSeats: 3
  });
  console.log('R2:', r2);

  console.log('Sincronizando...');
  await postUpdate('actualizarTodo', {});
  console.log('✅ Nombres limpios sin cédula actualizados con éxito.');
}

removeCIs();
