const https = require('https');
const crypto = require('crypto');

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

function generateCode() {
  return 'UA-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

(async () => {
  const list = await getJSON(WEBAPP_URL + '?action=adminList');
  const existingCodes = new Set((list.guests || []).map(g => g.code));

  let code1 = generateCode();
  while (existingCodes.has(code1)) code1 = generateCode();
  existingCodes.add(code1);

  let code2 = generateCode();
  while (existingCodes.has(code2)) code2 = generateCode();
  existingCodes.add(code2);

  console.log('1. Creando Pase 1 CAMBADU...', code1);
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(code1)}&name=${encodeURIComponent('Pase CAMBADU (Titular)')}&totalSeats=2&channel=ALIANZAS%20ESTRATEGICAS&agency=CAMBADU&referent=UA&status=Pendiente&stage=Env%C3%ADo%20Manual`);

  console.log('2. Creando Pase 2 CAMBADU...', code2);
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(code2)}&name=${encodeURIComponent('Pase CAMBADU (Equipo)')}&totalSeats=2&channel=ALIANZAS%20ESTRATEGICAS&agency=CAMBADU&referent=UA&status=Pendiente&stage=Env%C3%ADo%20Manual`);

  console.log('\n=== PASES CAMBADU CREADOS ===');
  console.log(`Pase 1: https://ua-eventos-uy.web.app/coyote-vs-acme?i=${code1}`);
  console.log(`Pase 2: https://ua-eventos-uy.web.app/coyote-vs-acme?i=${code2}`);
})();
