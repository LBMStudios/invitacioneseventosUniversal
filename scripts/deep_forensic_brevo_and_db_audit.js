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

async function deepAudit() {
  console.log('🚀 INICIANDO AUDITORÍA FORENSE PROFUNDA (BREVO + BASE DE DATOS)...');
  console.log('-------------------------------------------------------------');

  // 1. Descargar TODO el historial de eventos de Brevo sin límite
  console.log('1. Descargando historial completo de Brevo...');
  const allEvents = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const res = await brevoGet(`/v3/smtp/statistics/events?limit=${limit}&offset=${offset}&sort=desc`);
    const events = res.events || [];
    if (events.length === 0) break;
    allEvents.push(...events);
    if (events.length < limit || allEvents.length >= 3000) break;
    offset += limit;
  }
  console.log(`   ✅ Total eventos transaccionales descargados: ${allEvents.length}`);

  // 2. Extraer TODOS los correos enviados de tipo Confirmación
  const confirmationEmailsMap = {};
  
  allEvents.forEach(e => {
    const sub = (e.subject || '').toLowerCase();
    const isConf = sub.includes('confirmaci') || sub.includes('asistencia');
    if (!isConf) return;

    const email = (e.email || '').toLowerCase().trim();
    if (!email) return;

    // Extraer código
    const match = e.subject.match(/\((UA-[A-Z0-9\-]+)\)/i) || e.subject.match(/(UA-[A-Z0-9\-]{8,12})/i);
    const code = match ? match[1].toUpperCase() : '';

    if (!confirmationEmailsMap[email]) {
      confirmationEmailsMap[email] = {
        email: email,
        code: code,
        subject: e.subject,
        date: e.date,
        messageId: e.messageId,
        allCodesFound: new Set()
      };
    }
    if (code) confirmationEmailsMap[email].allCodesFound.add(code);
  });

  const uniqueConfirmedBrevo = Object.values(confirmationEmailsMap);
  console.log(`   ✅ Total destinatarios únicos que recibieron correo de Confirmación: ${uniqueConfirmedBrevo.length}`);

  // 3. Descargar base completa actual
  console.log('\n2. Descargando base completa de Google Sheets...');
  const adminRes = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = adminRes.guests || [];
  console.log(`   ✅ Total filas en base de datos: ${guests.length}`);

  const byCode = {};
  const byEmail = {};
  const byName = {};

  guests.forEach(g => {
    if (g.code) byCode[g.code.toUpperCase()] = g;
    const em = (g.email || '').toLowerCase().trim();
    if (em) {
      if (!byEmail[em]) byEmail[em] = [];
      byEmail[em].push(g);
    }
    const nm = (g.name || '').toUpperCase().trim();
    if (nm) {
      if (!byName[nm]) byName[nm] = [];
      byName[nm].push(g);
    }
  });

  // 4. Analizar cada confirmación de Brevo contra la base
  console.log('\n3. Realizando cruce forense uno a uno...');
  
  const correct = [];
  const pendingInDb = [];
  const notFoundInDb = [];
  const ignoredTests = ['test@example.com', 'lucasbeathyate@gmail.com'];

  uniqueConfirmedBrevo.forEach(conf => {
    if (ignoredTests.includes(conf.email)) return;

    // Buscar match en la base
    let matched = null;

    // 1. Por código exacto
    if (conf.code && byCode[conf.code]) {
      matched = byCode[conf.code];
    }
    // 2. Por cualquiera de los códigos que aparecieron en sus emails
    if (!matched) {
      for (const c of conf.allCodesFound) {
        if (byCode[c]) {
          matched = byCode[c];
          break;
        }
      }
    }
    // 3. Por email
    if (!matched && conf.email && byEmail[conf.email]) {
      // Priorizar el confirmado si hay varios con mismo email
      matched = byEmail[conf.email].find(g => g.status === 'Confirmado') || byEmail[conf.email][0];
    }

    if (!matched) {
      notFoundInDb.push(conf);
    } else if (matched.status === 'Confirmado') {
      correct.push({
        guest: matched,
        brevo: conf
      });
    } else {
      pendingInDb.push({
        guest: matched,
        brevo: conf
      });
    }
  });

  console.log('=============================================================');
  console.log('📊 RESULTADOS DE LA AUDITORÍA');
  console.log('=============================================================');
  console.log(`✅ Confirmados perfectamente sincronizados: ${correct.length}`);
  console.log(`🚨 Confirmados en Brevo pero PENDIENTES en la base: ${pendingInDb.length}`);
  console.log(`❓ Correos en Brevo no ubicados en la base: ${notFoundInDb.length}`);
  console.log('=============================================================');

  if (pendingInDb.length > 0) {
    console.log('\n🚨 ATENCIÓN: Se encontraron registros que recibieron confirmación pero siguen PENDIENTES:');
    pendingInDb.forEach((p, i) => {
      console.log(`\n${i + 1}. [${p.guest.code}] ${p.guest.name} (${p.brevo.email})`);
      console.log(`   Agencia: ${p.guest.agency || '-'} | Cupos: ${p.guest.totalSeats}`);
      console.log(`   Código en Brevo: ${p.brevo.code} | Asunto: ${p.brevo.subject}`);
      console.log(`   Fecha de confirmación en Brevo: ${p.brevo.date}`);
    });
  } else {
    console.log('\n🎉 ¡NO HAY NINGÚN CASO PENDIENTE QUE HAYA RECIBIDO CONFIRMACIÓN!');
    console.log('Todos los invitados que recibieron su ticket por correo están debidamente marcados como CONFIRMADOS.');
  }

  if (notFoundInDb.length > 0) {
    console.log('\n❓ Correos en Brevo no encontrados en la base:');
    notFoundInDb.forEach((nf, i) => {
      console.log(`${i + 1}. Email: ${nf.email} | Código Brevo: ${nf.code} | Asunto: ${nf.subject}`);
    });
  }
}

deepAudit().catch(console.error);
