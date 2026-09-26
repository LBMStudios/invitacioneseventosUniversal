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

async function run() {
  const list = await getJSON(WEBAPP_URL + '?action=adminList');
  const existingCodes = new Set((list.guests || []).map(g => g.code));

  let code = generateCode();
  while (existingCodes.has(code)) code = generateCode();

  console.log('1. Registrando a Nadia Esteves (2 cupos)... Código:', code);
  const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(code)}&name=${encodeURIComponent('Nadia Esteves')}&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent('Acompañante')}&totalSeats=2&channel=AGENCIA&agency=MANUAL&referent=UA&stage=Env%C3%ADo%20Manual`);
  console.log('Resultado actualización:', res);

  console.log('\n2. Sincronizando base de datos y reportes...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');

  console.log('\n3. Verificando datos live...');
  const g = await getJSON(WEBAPP_URL + `?action=guest&code=${encodeURIComponent(code)}`);
  console.log('Datos live:', g.guest);

  console.log('\n=== PASE GENERADO ===');
  console.log(`🎬 Titular: Nadia Esteves`);
  console.log(`🎟️ Total Lugares: 2`);
  console.log(`🔑 Código: ${code}`);
  console.log(`👉 Link de Invitación / QR: https://ua-eventos-uy.web.app/coyote-vs-acme?i=${code}`);
}

run().catch(console.error);
