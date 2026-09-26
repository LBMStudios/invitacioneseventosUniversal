const fs = require('fs');
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

function postUpdate(action, params) {
  return new Promise((resolve, reject) => {
    const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
    https.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
    const values = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      values.push((match[1] !== undefined ? match[1] : match[2] || '').trim());
    }
    const name = values[0] || '';
    const agency = values[1] || '';
    const email = values[2] || '';
    const phone = values[3] || '';

    if (phone && phone.replace(/\D/g, '').length >= 8) {
      rows.push({ name, agency, email, phone });
    }
  }
  return rows;
}

function normalizePhone(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('598') && digits.length === 11) digits = digits.slice(3);
  if (digits.length === 8 && digits.startsWith('9')) digits = '0' + digits;
  return digits;
}

async function syncAllPhones() {
  console.log('1. Leyendo teléfonos del CSV de Brevo...');
  const csvContent = fs.readFileSync('Brevo_Lista_Agencias_Organizada.csv', 'utf8');
  const brevoPhones = parseCSV(csvContent);
  console.log(`Encontrados ${brevoPhones.length} teléfonos en Brevo.`);

  console.log('\n2. Consultando invitados en Google Sheets...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = res.guests || [];

  let updated = 0;
  for (const b of brevoPhones) {
    const cleanBEmail = (b.email || '').toLowerCase().trim();
    const cleanBName = (b.name || '').toLowerCase().trim();
    const normalizedPhone = normalizePhone(b.phone);

    // Buscar en la base
    const match = guests.find(g => {
      const gEmail = (g.email || '').toLowerCase().trim();
      const gName = (g.name || '').toLowerCase().trim();
      if (cleanBEmail && gEmail && cleanBEmail === gEmail) return true;
      if (cleanBName && gName && cleanBName === gName) return true;
      return false;
    });

    if (match) {
      const currentPhone = String(match.phone || '').trim();
      if (!currentPhone || currentPhone !== normalizedPhone) {
        console.log(`Actualizando [${match.code}] ${match.name} -> Tel: ${normalizedPhone}`);
        await postUpdate('updateGuest', {
          code: match.code,
          phone: normalizedPhone
        });
        updated++;
      }
    }
  }

  console.log(`\n✅ ${updated} teléfonos sincronizados en Google Sheets!`);
  await postUpdate('actualizarTodo', {});
  console.log('🔄 Sincronización y links de WhatsApp regenerados.');
}

syncAllPhones();
