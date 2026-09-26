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

  let codeRoxana = generateCode();
  while (existingCodes.has(codeRoxana)) codeRoxana = generateCode();
  existingCodes.add(codeRoxana);

  let codeEquipo = generateCode();
  while (existingCodes.has(codeEquipo)) codeEquipo = generateCode();
  existingCodes.add(codeEquipo);

  console.log('1. Creando Pase para Roxana (Infonegocios)...', codeRoxana);
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(codeRoxana)}&name=${encodeURIComponent('Roxana')}&totalSeats=2&channel=MEDIOS%20/%20PRENSA&agency=Infonegocios&referent=UA&status=Pendiente&stage=Env%C3%ADo%20Manual`);

  console.log('2. Creando Pase para Infonegocios (Equipo)...', codeEquipo);
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(codeEquipo)}&name=${encodeURIComponent('Pase Infonegocios (Equipo)')}&totalSeats=2&channel=MEDIOS%20/%20PRENSA&agency=Infonegocios&referent=UA&status=Pendiente&stage=Env%C3%ADo%20Manual`);

  console.log('\n=== PASES INFONEGOCIOS CREADOS ===');
  console.log(`Roxana: https://ua-eventos-uy.web.app/coyote-vs-acme?i=${codeRoxana}`);
  console.log(`Infonegocios Equipo: https://ua-eventos-uy.web.app/coyote-vs-acme?i=${codeEquipo}`);
})();
