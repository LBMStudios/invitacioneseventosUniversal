const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url, retries = 3) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, retries));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => {
      if (retries > 0) {
        setTimeout(() => resolve(fetchUrl(url, retries - 1)), 1000);
      } else {
        reject(err);
      }
    });
  });
}

async function main() {
  console.log('1. Verificando y eliminando duplicado de Natalia Doglia...');
  await fetchUrl(`${WEBAPP_URL}?action=deleteGuest&code=UA-98620626`);

  console.log('\n2. Auditando estado final en vivo...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const confirmed = guests.filter(g => (g.status || '').toLowerCase().includes('confirmad'));

  let inRoomCount = 0;
  let inRoomSeats = 0;
  let pendingCount = 0;
  let pendingSeats = 0;

  confirmed.forEach(g => {
    const seats = Number(g.totalSeats) || 1;
    const stage = String(g.stage || g.openedAt || '').toLowerCase();
    const demoCheck = String(g.demoCheck || '').toLowerCase();

    const isEntered = stage.includes('ingresó') || stage.includes('ingreso') || demoCheck.includes('ingresó') || demoCheck.includes('ingreso');

    if (isEntered) {
      inRoomCount++;
      inRoomSeats += seats;
    } else {
      pendingCount++;
      pendingSeats += seats;
    }
  });

  let totalConfirmedSeats = 0;
  confirmed.forEach(g => totalConfirmedSeats += (Number(g.totalSeats) || 1));

  console.log('====================================================');
  console.log('🎬 BALANCE EN VIVO DE SALA (19:47 hs)');
  console.log('====================================================');
  console.log(`🍿 Butacas YA EN SALA: ${inRoomSeats} personas (${inRoomCount} grupos/pases)`);
  console.log(`⏳ Butacas POR LLEGAR: ${pendingSeats} personas (${pendingCount} pases)`);
  console.log(`🎟️ Total Confirmados: ${totalConfirmedSeats} butacas (${confirmed.length} pases)`);
  console.log('====================================================');
}

main();
