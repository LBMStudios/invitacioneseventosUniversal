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

  console.log('1. Creando pase exclusivo e independiente para Ibrahim Al Mohammad... Código:', code);
  const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(code)}&name=${encodeURIComponent('Ibrahim Al Mohammad')}&email=${encodeURIComponent('ibramohamad87@gmail.com')}&phone=${encodeURIComponent('092444234')}&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent('Sanaa al')}&totalSeats=2&agency=ASOC%20ESPA%C3%91OLA&channel=SALUD&stage=1er%20Env%C3%ADo`);
  console.log('Resultado update:', res);

  console.log('\n2. Sincronizando reportes y caché...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');

  console.log('\n3. Verificando estado live...');
  const g = await getJSON(WEBAPP_URL + `?action=guest&code=${encodeURIComponent(code)}`);
  console.log('Live Guest:', JSON.stringify(g.guest, null, 2));

  console.log('\n=== PASE GENERADO PARA IBRAHIM ===');
  console.log(`🎬 Titular: Ibrahim Al Mohammad`);
  console.log(`👥 Acompañante: Sanaa al`);
  console.log(`🎟️ Lugares: 2 personas`);
  console.log(`🔑 Código: ${code}`);
  console.log(`👉 Link / QR: https://ua-eventos-uy.web.app/coyote-vs-acme?i=${code}`);
}

run().catch(console.error);
