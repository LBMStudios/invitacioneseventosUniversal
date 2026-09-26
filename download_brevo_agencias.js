const https = require('https');
const fs = require('fs');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const LIST_ID = 11; // Lista "Agencias"

function fetchContactsPage(offset = 0, limit = 50) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      path: `/v3/contacts/lists/${LIST_ID}/contacts?limit=${limit}&offset=${offset}`,
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
          const data = JSON.parse(d);
          resolve(data.contacts || []);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('⏳ Descargando contactos de la lista "Agencias" (ID: 11) desde Brevo...');
  let allContacts = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    console.log(`→ Obteniendo contactos (offset: ${offset})...`);
    const contacts = await fetchContactsPage(offset, limit);
    if (!contacts || contacts.length === 0) break;
    allContacts.push(...contacts);
    if (contacts.length < limit) break;
    offset += limit;
  }

  console.log(`✅ Total de contactos obtenidos de Brevo: ${allContacts.length}`);

  // Recolectar todos los nombres de atributos dinámicamente
  const attrSet = new Set();
  allContacts.forEach(c => {
    if (c.attributes) {
      Object.keys(c.attributes).forEach(k => attrSet.add(k));
    }
  });
  const attributeKeys = Array.from(attrSet);

  const headers = ['Email', 'ID Brevo', 'Fecha Creación', 'Fecha Modificación', ...attributeKeys];

  function esc(v) {
    if (v === null || v === undefined) return '""';
    const s = String(v).replace(/"/g, '""');
    return '"' + s + '"';
  }

  const rows = allContacts.map(c => {
    const attrValues = attributeKeys.map(k => esc(c.attributes ? c.attributes[k] : ''));
    return [
      esc(c.email),
      esc(c.id),
      esc(c.createdAt || ''),
      esc(c.modifiedAt || ''),
      ...attrValues
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(h => esc(h)).join(','), ...rows].join('\r\n');
  const csvFile = 'Brevo_Lista_Agencias.csv';
  const jsonFile = 'Brevo_Lista_Agencias.json';

  fs.writeFileSync(csvFile, csvContent, 'utf8');
  fs.writeFileSync(jsonFile, JSON.stringify(allContacts, null, 2), 'utf8');

  console.log(`📄 Archivo CSV guardado: ${csvFile}`);
  console.log(`📄 Archivo JSON guardado: ${jsonFile}`);
}

main().catch(console.error);
