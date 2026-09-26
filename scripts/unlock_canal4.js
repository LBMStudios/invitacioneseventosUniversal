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

async function unlockCanal4() {
  console.log('1. Desbloqueando y confirmando pases de Canal 4...');

  const canal4Guests = [
    { code: 'UA-C40101A1', name: 'Mariano Mosca', email: 'mmosca@canal4.com.uy', seats: 2, companion: 'Acompañante' },
    { code: 'UA-C40202B2', name: 'W. Helou', email: 'whelou@canal4.com.uy', seats: 10, companion: 'Equipo Canal 4' },
    { code: 'UA-C40303C3', name: 'B. Perdomo', email: 'bperdomo@canal4.com.uy', seats: 2, companion: 'Acompañante' },
    { code: 'UA-C40404D4', name: 'J. Olivera', email: 'jolivera@canal4.com.uy', seats: 2, companion: 'Acompañante' }
  ];

  for (const g of canal4Guests) {
    const res = await postUpdate('updateGuest', {
      code: g.code,
      name: g.name,
      email: g.email,
      agency: 'Canal 4',
      channel: 'MEDIOS / PRENSA',
      referent: 'UA Medios',
      status: 'Confirmado',
      companion: 'Sí',
      companionName: g.companion,
      totalSeats: g.seats
    });
    console.log(`Confirmado ${g.name} (${g.code}):`, res);
  }

  console.log('\n2. Sincronizando base de datos...');
  await postUpdate('actualizarTodo', {});
  console.log('✅ Canal 4 desbloqueado y con Pases VIP activos.');
}

unlockCanal4();
