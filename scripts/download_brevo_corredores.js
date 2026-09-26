const https = require('https');
const fs = require('fs');
const path = require('path');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const LIST_ID = 6; // "Corredores de Seguro"

function brevoGet(apiPath) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      port: 443,
      path: apiPath,
      method: 'GET',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  console.log(`=== DESCARGANDO CONTACTOS DE BREVO: LISTA ${LIST_ID} (Corredores de Seguro) ===\n`);
  
  let allContacts = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    console.log(`Obteniendo contactos (offset: ${offset}, limit: ${limit})...`);
    const res = await brevoGet(`/v3/contacts/lists/${LIST_ID}/contacts?limit=${limit}&offset=${offset}&sort=desc`);
    const contacts = res.contacts || [];
    
    if (contacts.length === 0) break;
    allContacts.push(...contacts);
    offset += limit;
    if (contacts.length < limit) break;
  }

  console.log(`\nTotal contactos descargados: ${allContacts.length}`);

  // Normalizar y formatear datos
  const cleanedContacts = allContacts.map(c => {
    const attrs = c.attributes || {};
    return {
      email: c.email || '',
      nombre: attrs.NOMBRE || attrs.FIRSTNAME || attrs.NAME || '',
      apellido: attrs.APELLIDO || attrs.LASTNAME || attrs.SURNAME || '',
      empresa: attrs.EMPRESA || attrs.COMPANY || attrs.AGENCIA || 'Corredor de Seguros',
      telefono: attrs.TELEFONO || attrs.PHONE || attrs.SMS || attrs.WHATSAPP || '',
      cargo: attrs.CARGO || '',
      createdAt: c.createdAt || '',
      rawAttributes: attrs
    };
  });

  // Guardar JSON
  const jsonPath = path.join(__dirname, '../Corredores_de_Seguro_Brevo.json');
  fs.writeFileSync(jsonPath, JSON.stringify(cleanedContacts, null, 2), 'utf8');
  console.log(`✅ Archivo JSON guardado en: Corredores_de_Seguro_Brevo.json`);

  // Guardar CSV
  const csvHeaders = ['Email', 'Nombre', 'Apellido', 'Empresa/Agencia', 'Telefono', 'Cargo', 'Fecha Creacion'];
  const csvRows = cleanedContacts.map(c => [
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.nombre || '').replace(/"/g, '""')}"`,
    `"${(c.apellido || '').replace(/"/g, '""')}"`,
    `"${(c.empresa || '').replace(/"/g, '""')}"`,
    `"${(c.telefono || '').replace(/"/g, '""')}"`,
    `"${(c.cargo || '').replace(/"/g, '""')}"`,
    `"${(c.createdAt || '').replace(/"/g, '""')}"`
  ].join(','));

  const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows].join('\n');
  const csvPath = path.join(__dirname, '../Corredores_de_Seguro_Brevo.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`✅ Archivo CSV guardado en: Corredores_de_Seguro_Brevo.csv`);

  console.log('\n--- MUESTRA DE PRIMEROS 10 CONTACTOS ---');
  cleanedContacts.slice(0, 10).forEach((c, idx) => {
    console.log(`${idx + 1}. ${c.nombre} ${c.apellido} | ${c.email} | ${c.empresa} | Tel: ${c.telefono}`);
  });
})();
