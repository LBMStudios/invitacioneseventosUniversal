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
    if (values.length >= 3) {
      rows.push({
        name: values[0] || '',
        agency: values[1] || '',
        email: values[2] || '',
        phone: values[3] || '',
        brevoId: values[4] || ''
      });
    }
  }
  return rows;
}

function normalizePhone(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';

  // Si viene con prefijo internacional de Uruguay 598
  if (digits.startsWith('598') && digits.length === 11) {
    digits = digits.slice(3); // e.g. 59899123456 -> 99123456
  }

  // Si tiene 8 dígitos y empieza con 9 (número celular uruguayo sin el 0)
  if (digits.length === 8 && digits.startsWith('9')) {
    digits = '0' + digits; // 99123456 -> 099123456
  }

  return digits;
}

async function runImport() {
  console.log('1. Leyendo archivo Brevo_Lista_Agencias_Organizada.csv...');
  const csvContent = fs.readFileSync('Brevo_Lista_Agencias_Organizada.csv', 'utf8');
  const brevoList = parseCSV(csvContent);
  console.log(`Total contactos en Brevo CSV: ${brevoList.length}`);

  console.log('\n2. Consultando lista oficial actual de Google Sheets...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const currentGuests = Array.isArray(res.guests) ? res.guests : (Array.isArray(res) ? res : []);
  console.log(`Total invitados actuales en base: ${currentGuests.length}`);

  const existingEmails = new Set();
  const existingNames = new Set();

  currentGuests.forEach(g => {
    if (g.email) existingEmails.add(String(g.email).toLowerCase().trim());
    if (g.name) existingNames.add(String(g.name).toLowerCase().trim());
  });

  const toAdd = [];
  const alreadyExist = [];

  brevoList.forEach(b => {
    const cleanEmail = (b.email || '').toLowerCase().trim();
    const cleanName = (b.name || '').toLowerCase().trim();
    const formattedPhone = normalizePhone(b.phone);

    if (cleanEmail && existingEmails.has(cleanEmail)) {
      alreadyExist.push(b);
    } else if (!cleanEmail && existingNames.has(cleanName)) {
      alreadyExist.push(b);
    } else {
      toAdd.push({
        name: b.name,
        email: b.email,
        phone: formattedPhone,
        agency: b.agency || 'AGENCIA',
        channel: 'AGENCIA',
        referent: 'AB',
        totalSeats: 2,
        status: 'Pendiente'
      });
      // Marcar para no duplicar si viene repetido en el propio CSV
      if (cleanEmail) existingEmails.add(cleanEmail);
      if (cleanName) existingNames.add(cleanName);
    }
  });

  console.log(`\n📊 ANÁLISIS DE IMPORTACIÓN:`);
  console.log(`• Ya existentes en la base: ${alreadyExist.length}`);
  console.log(`• Nuevos contactos a importar: ${toAdd.length}`);

  console.log('\n3. Importando en paralelo...');
  let completed = 0;

  // Función para procesar 1 contacto
  async function processOne(item, index) {
    try {
      const addRes = await postUpdate('addGuest', {
        name: item.name,
        email: item.email || ''
      });

      if (addRes.code) {
        await postUpdate('updateGuest', {
          code: addRes.code,
          name: item.name,
          email: item.email || '',
          phone: item.phone || '',
          agency: item.agency,
          channel: item.channel,
          referent: item.referent,
          totalSeats: item.totalSeats,
          status: item.status
        });
      }
      completed++;
      if (completed % 10 === 0 || completed === toAdd.length) {
        console.log(`Progreso: ${completed}/${toAdd.length} contactos importados (${Math.round((completed/toAdd.length)*100)}%)...`);
      }
    } catch (e) {
      console.error(`Error con ${item.name}:`, e.message);
    }
  }

  // Concurrent pool de 6 hilos
  const CONCURRENCY = 6;
  for (let i = 0; i < toAdd.length; i += CONCURRENCY) {
    const chunk = toAdd.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map((item, idx) => processOne(item, i + idx + 1)));
  }

  console.log('\n4. Ejecutando Sincronización Completa para generar links, códigos y actualizar caché...');
  await postUpdate('actualizarTodo', {});
  console.log('🎉 ¡IMPORTACIÓN COMPLETADA CON ÉXITO!');
}

runImport();
