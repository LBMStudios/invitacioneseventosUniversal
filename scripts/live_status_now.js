const https = require('https');
const fs = require('fs');

let BREVO_API_KEY = 'BREVO_API_KEY_BLOCKED_AND_DISABLED';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function brevoGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      path,
      method: 'GET',
      headers: {
        'api-key': BREVO_API_KEY,
        'accept': 'application/json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve({}); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

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

async function main() {
  console.log('🔄 1. Consultando estado en vivo de Google Sheets...');
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = data.guests || [];

  const confirmed = guests.filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => {
    totalSeats += (Number(g.totalSeats) || 1);
  });

  const confirmedWithEmail = confirmed.filter(g => g.email && g.email.includes('@'));
  const confirmedWithoutEmail = confirmed.filter(g => !g.email || !g.email.includes('@'));

  console.log(`✅ Confirmados: ${confirmed.length} pases | 🎟️ ${totalSeats} butacas ocupadas`);
  console.log(`📧 Con Email: ${confirmedWithEmail.length} | 📱 Sin Email / WhatsApp / VIP: ${confirmedWithoutEmail.length}`);

  console.log('\n🔄 2. Consultando aperturas actualizadas en Brevo (SOLO LECTURA)...');
  const allEvents = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await brevoGet(`/v3/smtp/statistics/events?limit=${limit}&offset=${offset}&sort=desc&days=2`);
    const events = res.events || [];
    if (events.length === 0) break;
    allEvents.push(...events);
    if (events.length < limit || allEvents.length >= 2500) break;
    offset += limit;
  }

  const opensToday = new Set();
  const opensAclaracion = new Set();

  allEvents.forEach(ev => {
    const email = (ev.email || '').toLowerCase().trim();
    if (!email) return;

    const subject = (ev.subject || '').toLowerCase();
    const eventType = ev.event;

    if (eventType === 'opened' || eventType === 'unique_opened' || eventType === 'first_opening') {
      if (subject.includes('hoy es el gran día') || subject.includes('hoy es el gran') || subject.includes('te esperamos esta noche')) {
        opensToday.add(email);
      }
      if (subject.includes('aclaraci')) {
        opensAclaracion.add(email);
      }
    }
  });

  console.log(`\n📬 Total de aperturas registradas para el mail de HOY: ${opensToday.size} personas`);
  console.log(`📬 Total de aperturas para el mail de Aclaración: ${opensAclaracion.size} personas`);

  // Cruce exacto con los confirmados
  let countAbrieronHoy = 0;
  let countAbrieronAclaracionYHoy = 0;
  let countAbrieronAclaracionSinHoy = 0;
  let countSoloAclaracion = [];

  confirmedWithEmail.forEach(g => {
    const email = (g.email || '').toLowerCase().trim();
    const abrioHoy = opensToday.has(email);
    const abrioAclaracion = opensAclaracion.has(email);

    if (abrioHoy) {
      countAbrieronHoy++;
      if (abrioAclaracion) countAbrieronAclaracionYHoy++;
    } else if (abrioAclaracion) {
      countAbrieronAclaracionSinHoy++;
      countSoloAclaracion.push({
        name: g.name,
        email: g.email,
        agency: g.agency || g.channel || '—',
        seats: g.totalSeats || 2
      });
    }
  });

  console.log('\n📊 ESTADO ACTUAL:');
  console.log(`- Abrieron el mail de HOY: ${countAbrieronHoy} de ${confirmedWithEmail.length} (${Math.round(countAbrieronHoy/confirmedWithEmail.length*100)}%)`);
  console.log(`- Abrieron Aclaración + HOY (100% OK): ${countAbrieronAclaracionYHoy}`);
  console.log(`- Abrieron Aclaración y TODAVÍA no abrieron el de hoy: ${countAbrieronAclaracionSinHoy}`);

  const output = {
    totalConfirmedPasses: confirmed.length,
    totalSeats: totalSeats,
    maxCapacity: 300,
    freeSeats: Math.max(300 - totalSeats, 0),
    confirmedWithEmail: confirmedWithEmail.length,
    confirmedWithoutEmail: confirmedWithoutEmail.length,
    countAbrieronHoy: countAbrieronHoy,
    pctAbrieronHoy: `${Math.round(countAbrieronHoy / confirmedWithEmail.length * 100)}%`,
    countAbrieronAclaracionSinHoy: countAbrieronAclaracionSinHoy,
    pendientesAclaracion: countSoloAclaracion
  };

  fs.writeFileSync('estado_actual_live.json', JSON.stringify(output, null, 2));
}

main().finally(() => {
  BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
});
