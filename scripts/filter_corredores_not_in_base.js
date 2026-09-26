const fs = require('fs');
const path = require('path');

const brevoContacts = JSON.parse(fs.readFileSync('./Corredores_de_Seguro_Brevo.json', 'utf8'));
const base = JSON.parse(fs.readFileSync('./Base_Invitados_Agencias_UA.json', 'utf8'));

const existingEmails = new Set(base.map(g => (g.email || '').toLowerCase().trim()).filter(Boolean));

const notInBase = brevoContacts.filter(c => {
  const em = (c.email || '').toLowerCase().trim();
  return !existingEmails.has(em);
});

console.log(`Total NO presentes en la base: ${notInBase.length}`);

// Guardar JSON
fs.writeFileSync('./Corredores_NO_en_Base.json', JSON.stringify(notInBase, null, 2), 'utf8');

// Guardar CSV
const csvHeaders = ['#', 'Email', 'Nombre', 'Apellido', 'Empresa'];
const csvRows = notInBase.map((c, idx) => [
  idx + 1,
  `"${(c.email || '').replace(/"/g, '""')}"`,
  `"${(c.nombre || '').replace(/"/g, '""')}"`,
  `"${(c.apellido || '').replace(/"/g, '""')}"`,
  `"${(c.empresa || '').replace(/"/g, '""')}"`
].join(','));

const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows].join('\n');
fs.writeFileSync('./Corredores_NO_en_Base.csv', csvContent, 'utf8');

console.log('Archivos generados: Corredores_NO_en_Base.json y Corredores_NO_en_Base.csv');
