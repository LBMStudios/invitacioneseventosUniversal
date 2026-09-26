const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
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
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          resolve({});
        }
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
  console.log('🔍 1. Descargando todos los logs transaccionales de Brevo...');
  
  const allEvents = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const res = await brevoGet(`/v3/smtp/statistics/events?limit=${limit}&offset=${offset}&sort=desc`);
    const events = res.events || [];
    if (events.length === 0) break;
    allEvents.push(...events);
    console.log(`   Descargados ${allEvents.length} eventos...`);
    if (events.length < limit || allEvents.length >= 1500) break;
    offset += limit;
  }

  console.log(`\n📊 Total de eventos transaccionales en Brevo: ${allEvents.length}`);

  // Filtrar todos los que son de confirmación de asistencia
  const confirmationEvents = allEvents.filter(e => 
    e.subject && (
      e.subject.toLowerCase().includes('confirmación de asistencia') || 
      e.subject.toLowerCase().includes('confirmacion de asistencia')
    )
  );

  console.log(`✉️ Total eventos de "Confirmación de Asistencia": ${confirmationEvents.length}`);

  // Agrupar por mensaje / email único
  const confirmationsByEmail = {};
  confirmationEvents.forEach(e => {
    const em = (e.email || '').toLowerCase().trim();
    if (!em) return;
    
    // Extraer código del subject
    const match = e.subject.match(/\((UA-[A-Z0-9]+)\)/i) || e.subject.match(/(UA-[A-Z0-9]{8})/i);
    const code = match ? match[1].toUpperCase() : '';

    if (!confirmationsByEmail[em]) {
      confirmationsByEmail[em] = {
        email: em,
        code: code,
        subject: e.subject,
        firstDate: e.date,
        lastDate: e.date,
        events: []
      };
    }
    confirmationsByEmail[em].events.push(e.event);
  });

  const uniqueConfirmedEmails = Object.values(confirmationsByEmail);
  console.log(`👥 Total de personas únicas que recibieron correo de confirmación: ${uniqueConfirmedEmails.length}\n`);

  console.log('📥 2. Descargando base actual de Google Sheets...');
  const adminRes = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = adminRes.guests || [];

  const guestByCode = {};
  const guestsByEmail = {};
  guests.forEach(g => {
    if (g.code) guestByCode[g.code] = g;
    const em = (g.email || '').toLowerCase().trim();
    if (em) {
      if (!guestsByEmail[em]) guestsByEmail[em] = [];
      guestsByEmail[em].push(g);
    }
  });

  console.log('\n🔎 3. Cruzando datos de Brevo vs. Base de Datos...');
  
  const okList = [];
  const pendingWithConfirmationEmail = [];
  const missingInDb = [];

  uniqueConfirmedEmails.forEach(conf => {
    let matchedGuest = null;
    
    if (conf.code && guestByCode[conf.code]) {
      matchedGuest = guestByCode[conf.code];
    } else if (conf.email && guestsByEmail[conf.email]) {
      matchedGuest = guestsByEmail[conf.email].find(g => g.status === 'Confirmado') || guestsByEmail[conf.email][0];
    }

    if (!matchedGuest) {
      missingInDb.push(conf);
    } else if (matchedGuest.status === 'Confirmado') {
      okList.push({
        name: matchedGuest.name,
        email: conf.email,
        code: matchedGuest.code,
        confCode: conf.code,
        seats: matchedGuest.totalSeats,
        companion: matchedGuest.companionName
      });
    } else {
      pendingWithConfirmationEmail.push({
        guest: matchedGuest,
        brevo: conf
      });
    }
  });

  console.log('======================================================');
  console.log(`✅ Confirmados correctos en Brevo y en la Base: ${okList.length}`);
  console.log(`⚠️ Personas con correo de confirmación en Brevo pero PENDIENTES en la Base: ${pendingWithConfirmationEmail.length}`);
  console.log(`❓ Personas con correo en Brevo no encontradas en la Base: ${missingInDb.length}`);
  console.log('======================================================\n');

  if (pendingWithConfirmationEmail.length > 0) {
    console.log('🚨 DETALLE DE PERSONAS QUE RECIBIERON CONFIRMACIÓN Y ESTÁN PENDIENTES:');
    pendingWithConfirmationEmail.forEach((item, idx) => {
      console.log(`${idx + 1}. [${item.guest.code}] ${item.guest.name} (${item.brevo.email})`);
      console.log(`   Código Brevo: ${item.brevo.code} | Asunto: ${item.brevo.subject}`);
      console.log(`   Estado actual en base: ${item.guest.status} | Fecha Brevo: ${item.brevo.firstDate}\n`);
    });
  } else {
    console.log('🎉 ¡EXCELENTE NOTICIA! Todas las personas que recibieron correo de confirmación en Brevo están marcadas como CONFIRMADAS en el sistema.');
  }

  if (missingInDb.length > 0) {
    console.log('\n⚠️ DETALLE DE CORREOS EN BREVO NO VINCULADOS EN LA BASE:');
    missingInDb.forEach((item, idx) => {
      console.log(`${idx + 1}. Email: ${item.email} | Código Brevo: ${item.code} | Asunto: ${item.subject}`);
    });
  }
}

main().catch(console.error);
