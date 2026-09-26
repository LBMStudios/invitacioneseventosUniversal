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
  const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  console.log('1. Confirmando e ingresando a Mariano Mosca de Canal 4 (4 butacas)...');
  const updateMosca = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-C40101A1',
    name: 'Mariano Mosca',
    email: 'mmosca@canal4.com.uy',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Verónica Preverell | Luana Mosca | Santino Mosca',
    totalSeats: '4',
    stage: `Ingresó (${nowTimeString})`,
    channel: 'PRENSA',
    agency: 'Canal 4',
    referent: 'UA'
  });
  await fetchUrl(`${WEBAPP_URL}?${updateMosca.toString()}`);
  await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=UA-C40101A1`);

  console.log('\n2. Auditando estado general de la sala en tiempo real...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const confirmed = guests.filter(g => (g.status || '').toLowerCase().includes('confirmad'));

  let inRoomCount = 0;
  let inRoomSeats = 0;
  let pendingCount = 0;
  let pendingSeats = 0;

  const inRoomList = [];

  confirmed.forEach(g => {
    const seats = Number(g.totalSeats) || 1;
    const stage = String(g.stage || g.openedAt || '').toLowerCase();
    const demoCheck = String(g.demoCheck || '').toLowerCase();

    const isEntered = stage.includes('ingresó') || stage.includes('ingreso') || demoCheck.includes('ingresó') || demoCheck.includes('ingreso');

    if (isEntered) {
      inRoomCount++;
      inRoomSeats += seats;
      inRoomList.push({ name: g.name, seats, agency: g.agency, comp: g.companionName });
    } else {
      pendingCount++;
      pendingSeats += seats;
    }
  });

  let totalConfirmedSeats = 0;
  confirmed.forEach(g => totalConfirmedSeats += (Number(g.totalSeats) || 1));

  console.log('====================================================');
  console.log('🎬 ESTADO EN SALA EN TIEMPO REAL (19:46 hs)');
  console.log('====================================================');
  console.log(`🍿 Butacas YA EN SALA: ${inRoomSeats} personas (${inRoomCount} grupos/pases)`);
  console.log(`⏳ Butacas POR LLEGAR: ${pendingSeats} personas (${pendingCount} pases)`);
  console.log(`🎟️ Total Confirmados: ${totalConfirmedSeats} butacas (${confirmed.length} pases)`);
  console.log(`💺 Butacas Libres en Sala: ${Math.max(300 - totalConfirmedSeats, 0)} disponibles`);
  console.log('====================================================');
  console.log('\nÚltimos ingresos registrados:');
  inRoomList.slice(-10).forEach(g => {
    console.log(` - ${g.name} (${g.seats} personas) [${g.agency || 'Directo'}] ${g.comp ? `+ ${g.comp}` : ''}`);
  });
}

main();
