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
  console.log('=== ACTUALIZANDO Y VINCULANDO TODOS LOS ASISTENTES DE CASMU ===\n');

  // 1. Nadia Nuñez con Agustín Maubrigades
  console.log('1. Actualizando acompañante de Nadia Nuñez (Agustín Maubrigades)...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-8F23F9C7&name=${encodeURIComponent('Nadia Nuñez')}&companion=S%C3%AD&companionName=${encodeURIComponent('Agustín Maubrigades')}&totalSeats=2&status=Confirmado&agency=CASMU`);

  // 2. Anahir Aguilar a CASMU
  console.log('2. Moviendo a Anahir Aguilar a CASMU...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-67244620&name=${encodeURIComponent('Anahir Aguilar')}&companion=S%C3%AD&companionName=${encodeURIComponent('Horacio Botta')}&totalSeats=2&status=Confirmado&agency=CASMU`);

  // 3. Karina Rossini a CASMU
  console.log('3. Moviendo a Karina Rossini a CASMU...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-0A597B97&name=${encodeURIComponent('Karina Rossini')}&companion=S%C3%AD&companionName=${encodeURIComponent('Martin Picasso')}&totalSeats=2&status=Confirmado&agency=CASMU`);

  // 4. Maximiliano Cobas con Juan Manuel Cobas
  console.log('4. Asignando pase a Maximiliano Cobas con Juan Manuel Cobas...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-EF243E65&name=${encodeURIComponent('Maximiliano Cobas')}&companion=S%C3%AD&companionName=${encodeURIComponent('Juan Manuel Cobas')}&totalSeats=2&status=Confirmado&agency=CASMU&channel=SALUD`);

  // 5. Stephanie Olivera con Acompañante
  console.log('5. Asignando pase a Stephanie Olivera...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-FF989B31&name=${encodeURIComponent('Stephanie Olivera')}&companion=S%C3%AD&companionName=${encodeURIComponent('Acompañante')}&totalSeats=2&status=Confirmado&agency=CASMU&channel=SALUD`);

  console.log('\n=== REVISION FINAL DE CASMU ===');
  const list = await getJSON(WEBAPP_URL + '?action=adminList');
  const casmuGuests = (list.guests || []).filter(g => (g.agency || '').toUpperCase().includes('CASMU'));
  casmuGuests.forEach((g, idx) => {
    console.log(`${idx + 1}. ${g.code} | ${g.name} | Acomp: ${g.companionName} | Estado: ${g.status} | Asientos: ${g.totalSeats}`);
  });
})();
