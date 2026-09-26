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

  let code = generateCode();
  while (existingCodes.has(code)) code = generateCode();

  console.log('1. Creando a Belén Arbiza (DCOM - 2 cupos)... Código:', code);
  const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(code)}&name=${encodeURIComponent('Belén Arbiza')}&email=${encodeURIComponent('cobranzas@dcom.uy')}&totalSeats=2&channel=AGENCIA&agency=DCOM%20Travel&referent=Ana%20Laura%20Britos&status=Pendiente&stage=Env%C3%ADo%20Manual`);
  console.log('Resultado:', res);

  console.log('\n2. Verificando datos live...');
  const g = await getJSON(WEBAPP_URL + `?action=guest&code=${encodeURIComponent(code)}`);
  console.log('Datos live:', g.guest);

  console.log('\n=== ENLACE GENERADO ===');
  console.log(`🎬 Belén Arbiza (2 accesos: titular + 1 acompañante)`);
  console.log(`👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=${code}`);
})();
