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

async function registerAndaGuests() {
  console.log('1. Registrando y confirmando María José Piuma (3 butacas)...');
  const r1 = await postUpdate('updateGuest', {
    code: 'UA-98620619',
    name: 'María José Piuma (CI 1.844.281-6)',
    agency: 'ANDA',
    channel: 'AGENCIA',
    referent: 'Ana Camiou',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Josefina Barceló (CI 6.456.647-4) | Micaela Radiccioni (CI 4.741.511-3)',
    totalSeats: 3
  });
  console.log('R1:', r1);

  console.log('2. Registrando y confirmando Rafael Monzón (3 butacas)...');
  const r2 = await postUpdate('updateGuest', {
    code: 'UA-98620620',
    name: 'Rafael Monzón (CI 3.656.918-9)',
    agency: 'ANDA',
    channel: 'AGENCIA',
    referent: 'Ana Camiou',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Renzo Monzón (CI 6.288.395-5) | Lautaro Monzón (CI 6.423.819-8)',
    totalSeats: 3
  });
  console.log('R2:', r2);

  console.log('Sincronizando...');
  await postUpdate('actualizarTodo', {});
  console.log('✅ Ambos invitados de ANDA quedaron registrados y confirmados con 3 butacas cada uno.');
}

registerAndaGuests();
