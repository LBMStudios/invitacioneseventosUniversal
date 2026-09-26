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
  console.log('🔍 1. Descargando eventos transaccionales de Brevo (SOLO LECTURA)...');

  const allEvents = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await brevoGet(`/v3/smtp/statistics/events?limit=${limit}&offset=${offset}&sort=desc&days=3`);
    const events = res.events || [];
    if (events.length === 0) break;
    allEvents.push(...events);
    console.log(`   Descargados ${allEvents.length} eventos...`);
    if (events.length < limit || allEvents.length >= 2500) break;
    offset += limit;
  }

  console.log(`\n✅ Total de eventos obtenidos: ${allEvents.length}`);

  // 2. Descargar base oficial de invitados confirmados
  console.log('\n🔍 2. Obteniendo lista de confirmados de Google Sheets...');
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = data.guests || [];
  const confirmed = guests.filter(g => (g.status || '').toLowerCase().includes('confirmad'));

  console.log(`Total confirmados en base: ${confirmed.length}`);

  // 3. Mapear eventos por correo
  // Analizar eventos:
  // - Mail Aclaración de Ayer: subject contiene "Aclaración importante"
  // - Mail Mañana de Ayer: subject contiene "Función Especial" o "mañana"
  // - Mail Hoy: subject contiene "¡Hoy es el gran día!"

  const eventsByEmail = new Map();

  allEvents.forEach(ev => {
    const email = (ev.email || '').toLowerCase().trim();
    if (!email) return;

    if (!eventsByEmail.has(email)) {
      eventsByEmail.set(email, {
        openedAclaracion: false,
        openedAclaracionTime: null,
        openedManana: false,
        openedMananaTime: null,
        openedHoy: false,
        openedHoyTime: null,
        deliveredHoy: false,
        allEvents: []
      });
    }

    const record = eventsByEmail.get(email);
    record.allEvents.push(ev);

    const subject = (ev.subject || '').toLowerCase();
    const tag = (ev.tag || '').toLowerCase();
    const eventType = ev.event; // 'opened', 'delivered', 'clicks', etc.

    // Aclaración
    if (subject.includes('aclaraci') || tag.includes('aclaracion')) {
      if (eventType === 'opened' || eventType === 'unique_opened' || eventType === 'first_opening') {
        record.openedAclaracion = true;
        record.openedAclaracionTime = ev.date;
      }
    }

    // Mail que decía "mañana" (ayer temprano)
    if (subject.includes('los esperamos ma') || tag.includes('recordatorio-manana')) {
      if (eventType === 'opened' || eventType === 'unique_opened' || eventType === 'first_opening') {
        record.openedManana = true;
        record.openedMananaTime = ev.date;
      }
    }

    // Mail de Hoy
    if (subject.includes('¡hoy es el gran día!') || subject.includes('hoy es el gran') || subject.includes('te esperamos esta noche')) {
      if (eventType === 'delivered') {
        record.deliveredHoy = true;
      }
      if (eventType === 'opened' || eventType === 'unique_opened' || eventType === 'first_opening') {
        record.openedHoy = true;
        record.openedHoyTime = ev.date;
      }
    }
  });

  // 4. Cruzar datos con los confirmados
  const grupoA_AclaracionYHoy = [];      // Abrieron Aclaración Y abrieron el de Hoy (100% enterados)
  const grupoB_AclaracionSinHoy = [];    // Abrieron Aclaración pero AÚN NO abrieron el de Hoy
  const grupoC_SoloHoy = [];             // No abrieron aclaración pero SÍ abrieron el de Hoy
  const grupoD_NingunoAbierto = [];      // No abrieron aclaración ni el de Hoy

  confirmed.forEach(g => {
    const email = (g.email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) return;

    const evData = eventsByEmail.get(email) || {
      openedAclaracion: false,
      openedManana: false,
      openedHoy: false,
      deliveredHoy: false
    };

    const item = {
      name: g.name,
      email: g.email,
      phone: g.phone || '—',
      agency: g.agency || g.channel || '—',
      seats: g.totalSeats || 2,
      companion: g.companionName || '—',
      openedAclaracion: evData.openedAclaracion,
      openedHoy: evData.openedHoy,
      openedManana: evData.openedManana
    };

    if (evData.openedAclaracion && evData.openedHoy) {
      grupoA_AclaracionYHoy.push(item);
    } else if (evData.openedAclaracion && !evData.openedHoy) {
      grupoB_AclaracionSinHoy.push(item);
    } else if (!evData.openedAclaracion && evData.openedHoy) {
      grupoC_SoloHoy.push(item);
    } else {
      grupoD_NingunoAbierto.push(item);
    }
  });

  console.log('\n================================================================');
  console.log('📊 RESULTADOS DEL CRUCE DE APERTURAS:');
  console.log('================================================================');
  console.log(`1. Abrieron Aclaración de ayer Y TAMBIÉN abrieron el mail de Hoy: ${grupoA_AclaracionYHoy.length} personas`);
  console.log(`2. ⚠️ Abrieron Aclaración de ayer pero AÚN NO abrieron el de Hoy: ${grupoB_AclaracionSinHoy.length} personas`);
  console.log(`3. No abrieron aclaración de ayer pero SÍ abrieron el de Hoy: ${grupoC_SoloHoy.length} personas`);
  console.log(`4. No abrieron ni aclaración ni el de Hoy todavía: ${grupoD_NingunoAbierto.length} personas`);
  console.log('================================================================');

  const report = {
    timestamp: new Date().toISOString(),
    resumen: {
      totalConfirmadosConEmail: confirmed.filter(g => g.email && g.email.includes('@')).length,
      abrieronAclaracionYHoy: grupoA_AclaracionYHoy.length,
      abrieronAclaracionSinHoy: grupoB_AclaracionSinHoy.length,
      abrieronSoloHoy: grupoC_SoloHoy.length,
      sinAbrirNinguno: grupoD_NingunoAbierto.length
    },
    grupoB_Detalle_RequierenAtencion: grupoB_AclaracionSinHoy,
    grupoA_Detalle: grupoA_AclaracionYHoy,
    grupoC_Detalle: grupoC_SoloHoy,
    grupoD_Detalle: grupoD_NingunoAbierto
  };

  fs.writeFileSync('cruce_aperturas_reporte.json', JSON.stringify(report, null, 2));
  console.log('Reporte guardado en cruce_aperturas_reporte.json');
}

main().finally(() => {
  BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
});
