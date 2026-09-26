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
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function cleanEmail(raw) {
  if (!raw) return '';
  const matches = String(raw).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return '';
  return [...new Set(matches.map(e => e.trim().toLowerCase()))].join(',');
}

async function preview() {
  console.log('📋 Consultando lista oficial de Google Sheets...\n');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = Array.isArray(res.guests) ? res.guests : [];

  const pending = guests.filter(g => {
    const ms = (g.mailStatus || '').trim();
    const email = cleanEmail(g.email);
    const hasValidEmail = email && email.includes('@') && email.toUpperCase().indexOf('NO TENGO') < 0;
    const notSent = ms.indexOf('Enviado') < 0 && ms.indexOf('enviad') < 0 && ms.indexOf('Abierto') < 0;
    return hasValidEmail && notSent;
  });

  const emailCount = {};
  pending.forEach(g => {
    const email = cleanEmail(g.email);
    emailCount[email] = (emailCount[email] || 0) + 1;
  });

  const byAgency = {};
  pending.forEach(g => {
    const agency = g.agency || 'Sin Agencia';
    if (!byAgency[agency]) byAgency[agency] = [];
    byAgency[agency].push(g);
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📬 VISTA PREVIA DE DESTINATARIOS PENDIENTES DE ENVÍO`);
  console.log(`• Total personas pendientes con email: ${pending.length}`);
  console.log(`• Direcciones de email únicas: ${Object.keys(emailCount).length}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  let index = 1;
  for (const agency of Object.keys(byAgency).sort()) {
    console.log(`🏢 ${agency.toUpperCase()} (${byAgency[agency].length}):`);
    byAgency[agency].forEach(g => {
      const email = cleanEmail(g.email);
      const dup = emailCount[email] > 1 ? ` ⚠️ (Comparte casilla con ${emailCount[email]} personas)` : '';
      console.log(`   ${index}. [${g.code}] ${g.name} → ${email}${dup}`);
      index++;
    });
    console.log('');
  }
}

preview();
