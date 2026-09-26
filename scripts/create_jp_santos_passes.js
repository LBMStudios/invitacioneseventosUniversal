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

  let codeFabrizio = generateCode();
  while (existingCodes.has(codeFabrizio)) codeFabrizio = generateCode();
  existingCodes.add(codeFabrizio);

  let codeGabrielExtra = generateCode();
  while (existingCodes.has(codeGabrielExtra)) codeGabrielExtra = generateCode();
  existingCodes.add(codeGabrielExtra);

  console.log('1. Creando a Fabrizio Maglione (JP Santos - 2 cupos)... Código:', codeFabrizio);
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(codeFabrizio)}&name=${encodeURIComponent('Fabrizio Maglione')}&totalSeats=2&channel=AGENCIA&agency=JP%20Santos&referent=Ana%20Laura%20Britos&status=Pendiente&stage=Env%C3%ADo%20Manual`);

  console.log('2. Creando Pase 2 de Gabriel Lopez (JP Santos - 2 cupos)... Código:', codeGabrielExtra);
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(codeGabrielExtra)}&name=${encodeURIComponent('Gabriel Lopez (Pase 2)')}&totalSeats=2&channel=AGENCIA&agency=JP%20Santos&referent=Ana%20Laura%20Britos&status=Pendiente&stage=Env%C3%ADo%20Manual`);

  console.log('\n=== RESULTADOS LISTOS PARA ENVIAR ===');
  console.log(`🎬 Fabrizio Maglione (2 accesos: titular + 1 acompañante)`);
  console.log(`👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=${codeFabrizio}\n`);

  console.log(`🎬 Gabriel Lopez - Pase 1 (2 accesos)`);
  console.log(`👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=UA-98620451\n`);

  console.log(`🎬 Gabriel Lopez - Pase 2 (2 accesos)`);
  console.log(`👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=${codeGabrielExtra}\n`);
})();
