const https = require('https');
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

(async () => {
  console.log('1. Asignando código único a Florencia Flores (UA-F104E515)...');
  // Crear / Mover a Florencia Flores a su propio código exclusivo con sus datos de confirmación
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-F104E515&name=${encodeURIComponent('Florencia Flores')}&email=${encodeURIComponent('flores.pereira15@gmail.com')}&phone=${encodeURIComponent('+59893508234')}&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent('Gonzalo Alfaro')}&totalSeats=2&channel=MANUAL&agency=MANUAL&stage=1er%20Env%C3%ADo`);

  console.log('2. Restaurando UA-1A61CF1F para Elisa Costa con 3 Entradas Confirmadas...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-1A61CF1F&name=${encodeURIComponent('Elisa Costa')}&email=${encodeURIComponent('elisa.costa@cosem.com.uy')}&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent('2 Acompañantes')}&totalSeats=3&channel=SALUD&agency=COSEM&referent=COSEM&stage=1er%20Env%C3%ADo`);

  console.log('3. Actualizando también UA-3ECC5331 para Elisa Costa con 3 Entradas...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-3ECC5331&name=${encodeURIComponent('Elisa Costa')}&email=${encodeURIComponent('elisa.costa@cosem.com.uy')}&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent('2 Acompañantes')}&totalSeats=3&channel=SALUD&agency=COSEM&referent=COSEM&stage=1er%20Env%C3%ADo`);

  console.log('\n=== VERIFICACIÓN FINAL ===');
  const g1 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-1A61CF1F');
  console.log('Pase original UA-1A61CF1F:', g1.guest);

  const g2 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-3ECC5331');
  console.log('Pase UA-3ECC5331:', g2.guest);

  const g3 = await getJSON(WEBAPP_URL + '?action=guest&code=UA-F104E515');
  console.log('Pase Florencia Flores UA-F104E515:', g3.guest);
})();
