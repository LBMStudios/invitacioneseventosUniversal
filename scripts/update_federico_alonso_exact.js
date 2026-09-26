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
  console.log('1. Actualizando a Federico Alonso (UA-96126470) a No asiste...');
  const updateParams = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-96126470',
    name: 'Federico Alonso',
    email: 'federico.alonso@activetravel.com.uy',
    phone: '',
    status: 'No asiste',
    companion: 'No',
    companionName: '',
    totalSeats: '3',
    stage: '1er Envío',
    channel: '1er Envío',
    agency: 'Active Travel',
    referent: 'OCA'
  });

  const res = await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  console.log('Respuesta Apps Script:', res);

  console.log('\n2. Verificando estado en vivo...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);

  const confirmed = (data.guests || []).filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => totalSeats += (Number(g.totalSeats) || 1));

  console.log(`\n📊 BALANCE SALA TRAS LIBERACIÓN:`);
  console.log(`🎟️ Confirmados: ${confirmed.length} pases | ${totalSeats} butacas ocupadas`);
  console.log(`💺 Butacas Libres en Sala: ${Math.max(300 - totalSeats, 0)} disponibles`);
}

main();
