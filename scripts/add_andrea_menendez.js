const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log('1. Creando registro para Andrea Silvana Menéndez Martínez...');
  const addParams = new URLSearchParams({
    action: 'addGuest',
    name: 'Andrea Silvana Menéndez Martínez',
    email: ''
  });

  const addRaw = await fetchUrl(`${WEBAPP_URL}?${addParams.toString()}`);
  console.log('Respuesta addGuest:', addRaw);
  const addRes = JSON.parse(addRaw);

  const code = addRes.code;
  console.log(`Código generado: ${code}`);

  console.log('\n2. Actualizando datos a CONFIRMADO (2 butacas con Mateo Menéndez Martínez)...');
  const updateParams = new URLSearchParams({
    action: 'updateGuest',
    code: code,
    name: 'Andrea Silvana Menéndez Martínez',
    email: '',
    phone: '',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Mateo Menéndez Martínez',
    totalSeats: '2',
    stage: 'Envío Manual',
    channel: 'INVITADO ESPECIAL',
    agency: 'Directo',
    referent: 'UA'
  });

  const updateRaw = await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  console.log('Respuesta updateGuest:', updateRaw);

  console.log('\n3. Verificando estado en vivo...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const andrea = (data.guests || []).find(g => g.code === code);
  console.log('Andrea en base:', andrea);

  const confirmed = (data.guests || []).filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => totalSeats += (Number(g.totalSeats) || 1));
  console.log(`\n📊 Total Confirmados Actuales: ${confirmed.length} pases | ${totalSeats} butacas ocupadas`);
  console.log(`💺 Butacas Libres en Sala: ${Math.max(300 - totalSeats, 0)}`);
}

main();
