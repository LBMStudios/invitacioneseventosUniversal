const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

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

function brevoGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      path: path,
      method: 'GET',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  // 1. Obtener aperturas del 1er mail desde la base de datos
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = data.guests || [];

  const firstMailOpened = new Map();
  guests.forEach(g => {
    const ms = String(g.mailStatus || '');
    if (ms.includes('Abierto 20/08') && g.email && g.email.includes('@')) {
      const match = ms.match(/Abierto 20\/08 (\d{2}:\d{2})/i);
      firstMailOpened.set(g.email.toLowerCase().trim(), {
        name: g.name,
        agency: g.agency || g.channel || '-',
        code: g.code,
        time: match ? match[1] : ''
      });
    }
  });

  // 2. Obtener aperturas del 2do mail (Aclaración) desde Brevo API
  const brevoRes = await brevoGet('/v3/smtp/statistics/events?limit=500&event=opened&tags=aclaracion-fecha-evento');
  const secondMailOpened = new Map();
  (brevoRes.events || []).forEach(e => {
    if (e.email) {
      secondMailOpened.set(e.email.toLowerCase().trim(), e.date);
    }
  });

  console.log('=== CRUCE DE DATOS: 1ER MAIL vs FE DE ERRATAS ===');
  console.log('Total casillas que abrieron el 1er mail (10:00 hs):', firstMailOpened.size);
  console.log('Total casillas que abrieron la Aclaración (10:39 hs):', secondMailOpened.size);

  const both = [];
  const onlyFirst = [];
  const onlySecond = [];

  for (const [email, g] of firstMailOpened.entries()) {
    if (secondMailOpened.has(email)) {
      both.push({ email, ...g, aclaracionDate: secondMailOpened.get(email) });
    } else {
      onlyFirst.push({ email, ...g });
    }
  }

  for (const [email, date] of secondMailOpened.entries()) {
    if (!firstMailOpened.has(email)) {
      const guestFound = guests.find(g => (g.email || '').toLowerCase().trim() === email);
      onlySecond.push({
        email,
        name: guestFound ? guestFound.name : email,
        agency: guestFound ? (guestFound.agency || guestFound.channel || '-') : '-',
        code: guestFound ? guestFound.code : '-',
        aclaracionDate: date
      });
    }
  }

  console.log('\n--- 1. ABIERTO AMBOS (Vieron el 1ero y YA vieron la aclaración):', both.length);
  both.forEach((x, i) => {
    console.log(`${i+1}. ${x.name} (${x.agency}) <${x.email}> | 1er mail: ${x.time}hs -> Aclaración: ${x.aclaracionDate.slice(11, 16)}hs`);
  });

  console.log('\n--- 2. ABIERTO SOLO EL 1ER MAIL (Aún no abrieron la aclaración):', onlyFirst.length);
  onlyFirst.forEach((x, i) => {
    console.log(`${i+1}. ${x.name} (${x.agency}) <${x.email}> | 1er mail: ${x.time}hs`);
  });

  console.log('\n--- 3. ABIERTO DIRECTAMENTE LA ACLARACIÓN (No habían abierto el primero):', onlySecond.length);
  onlySecond.forEach((x, i) => {
    console.log(`${i+1}. ${x.name} (${x.agency}) <${x.email}> | Aclaración: ${x.aclaracionDate.slice(11, 16)}hs`);
  });
})();
