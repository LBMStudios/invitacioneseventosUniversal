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

  let codeSandra = generateCode();
  while (existingCodes.has(codeSandra)) codeSandra = generateCode();
  existingCodes.add(codeSandra);

  let codeEliana = generateCode();
  while (existingCodes.has(codeEliana)) codeEliana = generateCode();
  existingCodes.add(codeEliana);

  console.log('1. Creando a Sandra Yuane (3 cupos)... Código:', codeSandra);
  const resSandra = await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(codeSandra)}&name=${encodeURIComponent('Sandra Yuane')}&totalSeats=3&channel=MANUAL&agency=Alejandro%20M%C3%A9ndez&referent=Alejandro%20M%C3%A9ndez&status=Pendiente&stage=Env%C3%ADo%20Manual`);
  console.log('Resultado Sandra:', resSandra);

  console.log('\n2. Creando a Eliana Pizzorno (2 cupos)... Código:', codeEliana);
  const resEliana = await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(codeEliana)}&name=${encodeURIComponent('Eliana Pizzorno')}&totalSeats=2&channel=MANUAL&agency=Alejandro%20M%C3%A9ndez&referent=Alejandro%20M%C3%A9ndez&status=Pendiente&stage=Env%C3%ADo%20Manual`);
  console.log('Resultado Eliana:', resEliana);

  console.log('\n=== ENLACES GENERADOS ===');
  console.log(`• Sandra Yuane (3 lugares): https://ua-eventos-uy.web.app/coyote-vs-acme?i=${codeSandra}`);
  console.log(`• Eliana Pizzorno (2 lugares): https://ua-eventos-uy.web.app/coyote-vs-acme?i=${codeEliana}`);
})();
