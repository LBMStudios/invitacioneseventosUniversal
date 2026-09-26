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
  console.log('1. Actualizando UA-98620475 (Mónica Reyes) a 4 butacas (Titular + 3 Acompañantes)...');
  const updateParams = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-98620475',
    name: 'Monica Reyes',
    email: 'mreyes@jorgemartinez.com.uy',
    phone: '',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Tomas Vaillant | 2 Acompañantes',
    totalSeats: '4',
    stage: '1er Envío',
    channel: 'AGENCIA',
    agency: 'Jorge Martínez',
    referent: 'UA'
  });

  const updateRes = await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  console.log('Respuesta Apps Script:', updateRes);

  console.log('\n2. Verificando estado en vivo...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const monica = (data.guests || []).find(g => g.code === 'UA-98620475');
  console.log('Mónica Reyes en base:', monica);

  const confirmed = (data.guests || []).filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => totalSeats += (Number(g.totalSeats) || 1));
  console.log(`\n📊 BALANCE SALA:`);
  console.log(`🎟️ Pases Confirmados: ${confirmed.length}`);
  console.log(`👥 Butacas Ocupadas: ${totalSeats} / 300`);
  console.log(`💺 Butacas Libres en Sala: ${Math.max(300 - totalSeats, 0)} disponibles`);
}

main();
