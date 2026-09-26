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
  console.log('1. Acomodando a Mónica Reyes en UA-98620475 con 3 butacas...');
  const paramsMonica = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-98620475',
    name: 'Monica Reyes',
    email: 'mreyes@jorgemartinez.com.uy',
    phone: '',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Tomas Vaillant | Acompañante',
    totalSeats: '3',
    stage: '1er Envío',
    channel: 'AGENCIA',
    agency: 'Jorge Martínez',
    referent: 'UA'
  });
  const resMonica = await fetchUrl(`${WEBAPP_URL}?${paramsMonica.toString()}`);
  console.log('Resultado Mónica Reyes (3 butacas):', resMonica);

  console.log('\n2. Creando/Asegurando pase individual para Andrea Silvana Menéndez Martínez y Mateo (2 butacas)...');
  const addParams = new URLSearchParams({
    action: 'addGuest',
    name: 'Andrea Silvana Menéndez Martínez',
    email: ''
  });
  const addRaw = await fetchUrl(`${WEBAPP_URL}?${addParams.toString()}`);
  console.log('Respuesta addGuest Andrea:', addRaw);
  const addRes = JSON.parse(addRaw);
  const codeAndrea = addRes.code;

  const updateAndrea = new URLSearchParams({
    action: 'updateGuest',
    code: codeAndrea,
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
  const resAndrea = await fetchUrl(`${WEBAPP_URL}?${updateAndrea.toString()}`);
  console.log(`Resultado Andrea (${codeAndrea}):`, resAndrea);

  console.log('\n3. Verificando estado en vivo...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);

  const monicaCheck = (data.guests || []).find(g => g.code === 'UA-98620475');
  const andreaCheck = (data.guests || []).find(g => g.code === codeAndrea);

  console.log('Mónica Reyes:', monicaCheck);
  console.log('Andrea Menéndez:', andreaCheck);

  const confirmed = (data.guests || []).filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => totalSeats += (Number(g.totalSeats) || 1));
  console.log(`\n📊 Balance Sala: ${confirmed.length} pases | ${totalSeats} butacas ocupadas | Libres: ${Math.max(300 - totalSeats, 0)}`);
}

main();
