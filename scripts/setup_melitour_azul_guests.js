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
  console.log('1. Actualizando Alejandra -> Alejandra Palermo (UA-98620600)...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-98620600&name=${encodeURIComponent('Alejandra Palermo')}&totalSeats=2&agency=Melitour&referent=Ana%20Laura%20Britos`);

  console.log('2. Actualizando Carmen -> Carmen Galan (UA-98620601)...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-98620601&name=${encodeURIComponent('Carmen Galan')}&totalSeats=2&agency=Melitour&referent=Ana%20Laura%20Britos`);

  console.log('3. Creando Laura Rodriguez (Azul Viajes)...');
  const list = await getJSON(WEBAPP_URL + '?action=adminList');
  const existingCodes = new Set((list.guests || []).map(g => g.code));

  let codeLaura = generateCode();
  while (existingCodes.has(codeLaura)) codeLaura = generateCode();

  await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(codeLaura)}&name=${encodeURIComponent('Laura Rodriguez')}&totalSeats=2&channel=AGENCIA&agency=Azul%20Viajes&referent=Ana%20Laura%20Britos&status=Pendiente&stage=Env%C3%ADo%20Manual`);

  console.log('\n=== RESULTADOS FINALES LISTOS PARA ENVIAR A ANA LAURA BRITOS ===');
  console.log('Melitour:');
  console.log(`🎬 Alejandra Palermo (2 accesos: titular + 1 acompañante)`);
  console.log(`👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=UA-98620600\n`);

  console.log(`🎬 Gianfranco Iafrate (2 accesos: titular + 1 acompañante)`);
  console.log(`👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=UA-98620599\n`);

  console.log(`🎬 Carmen Galan (2 accesos: titular + 1 acompañante)`);
  console.log(`👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=UA-98620601\n`);

  console.log('Azul Viajes:');
  console.log(`🎬 Laura Rodriguez (2 accesos: titular + 1 acompañante)`);
  console.log(`👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=${codeLaura}\n`);
})();
