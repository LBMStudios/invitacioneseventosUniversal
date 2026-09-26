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

  let codeJorge = 'UA-EC9608A7';
  if (existingCodes.has(codeJorge)) {
    // Ya existe o generamos uno
  } else {
    codeJorge = generateCode();
  }

  console.log('1. Creando / Asegurando Pase Titular para Jorge Martínez (2 cupos)... Código:', codeJorge);
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(codeJorge)}&name=${encodeURIComponent('Jorge Martínez')}&totalSeats=2&channel=AGENCIA&agency=Jorge%20Mart%C3%ADnez&referent=Ana%20Laura%20Britos&status=Pendiente&stage=Env%C3%ADo%20Manual`);

  console.log('2. Verificando Joel Felder (UA-192EB1CE - 3 cupos)...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-192EB1CE&name=${encodeURIComponent('Joel Felder')}&totalSeats=3&channel=AGENCIA&agency=Buemes&referent=Ana%20Laura%20Britos&status=Pendiente&stage=Env%C3%ADo%20Manual`);

  console.log('\n=== RESULTADOS LISTOS ===');
  console.log(`🎬 Jorge Martínez (2 accesos: titular + 1 acompañante)`);
  console.log(`👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=${codeJorge}\n`);

  console.log(`🎬 Joel Felder (3 accesos: titular + 2 acompañantes - Buemes)`);
  console.log(`👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=UA-192EB1CE\n`);
})();
