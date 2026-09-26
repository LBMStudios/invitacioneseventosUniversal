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

async function setCanal4Pending() {
  console.log('1. Poniendo a Canal 4 en estado Pendiente (con formulario abierto)...');

  const canal4 = [
    { code: 'UA-C40101A1', name: 'Mariano Mosca', email: 'mmosca@canal4.com.uy', seats: 2 },
    { code: 'UA-C40202B2', name: 'W. Helou', email: 'whelou@canal4.com.uy', seats: 10 },
    { code: 'UA-C40303C3', name: 'B. Perdomo', email: 'bperdomo@canal4.com.uy', seats: 2 },
    { code: 'UA-C40404D4', name: 'J. Olivera', email: 'jolivera@canal4.com.uy', seats: 2 }
  ];

  for (const g of canal4) {
    const res = await postUpdate('updateGuest', {
      code: g.code,
      name: g.name,
      email: g.email,
      agency: 'Canal 4',
      channel: 'MEDIOS / PRENSA',
      referent: 'UA Medios',
      status: 'Pendiente',
      companion: 'No',
      companionName: '',
      totalSeats: g.seats
    });
    console.log(`${g.name} (${g.code}):`, res);
  }

  console.log('2. Sincronizando...');
  await postUpdate('actualizarTodo', {});
  console.log('✅ Canal 4 tiene el formulario 100% abierto para responder.');
}

setCanal4Pending();
