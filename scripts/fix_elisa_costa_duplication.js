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
  console.log('1. Convirtiendo código duplicado UA-3ECC5331 a pase genérico de COSEM...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-3ECC5331&name=${encodeURIComponent('Extra Vendedor')}&email=elisa.costa@cosem.com.uy&totalSeats=2&status=Pendiente&companion=S%C3%AD&companionName=&agency=COSEM&channel=SALUD&referent=COSEM`);

  console.log('2. Asegurando pase oficial UA-1A61CF1F de Elisa Costa con 3 accesos...');
  await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-1A61CF1F&name=${encodeURIComponent('Elisa Costa')}&email=elisa.costa@cosem.com.uy&totalSeats=3&status=Confirmado&companion=S%C3%AD&companionName=${encodeURIComponent('2 Acompañantes')}&agency=COSEM&channel=SALUD&referent=COSEM`);

  console.log('\n3. Verificando cómo quedó Elisa Costa en adminList...');
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const elisas = (data.guests || []).filter(g => (g.name || '').toLowerCase().includes('elisa costa'));
  console.log('Registros de Elisa Costa ahora:');
  elisas.forEach(g => console.log(g.code + ' | ' + g.name + ' | ' + g.status + ' | Asientos: ' + g.totalSeats));
})();
