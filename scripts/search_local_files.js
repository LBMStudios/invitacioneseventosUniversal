const fs = require('fs');
const path = require('path');

const queryNames = [
  'Caro Thomas',
  'Flor Costanzo',
  'Lucha Coitiño',
  'Vale Olivera',
  'Camila walch',
  'Heliana Molina',
  'Anaclara Arrieta',
  'Victoria de Souza',
  'Helena Haller',
  'guadalupe placeres',
  'laura da silva',
  'Belén gallo',
  'carli Varela',
  'Amparo Schelotto',
  'Sofi Giammarchi',
  'Mateo Parafita',
  'Mathias Batto',
  'Karina Vargas',
  'Ayelén Álvarez',
  'Rodrigo Ferrari',
  'Jorge Brun'
];

function normalize(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

function searchFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n================ Searching in ${filePath} ================`);
  for (const q of queryNames) {
    const tokens = normalize(q).split(/\s+/);
    // search lines
    const lines = content.split('\n');
    const matchedLines = [];
    lines.forEach((l, idx) => {
      const lNorm = normalize(l);
      if (tokens.every(t => lNorm.includes(t))) {
        matchedLines.push({ line: idx + 1, text: l.trim() });
      }
    });
    if (matchedLines.length > 0) {
      console.log(`Matched "${q}":`, matchedLines);
    }
  }
}

const files = [
  'Brevo_Lista_Agencias.csv',
  'Brevo_Lista_Agencias_Organizada.csv',
  'Brevo_Lista_Agencias.json',
  'Base_Invitados_Agencias_UA.csv',
  'Base_Invitados_Agencias_UA.json',
  'analisis_faltantes_roles.json',
  'faltantes_brevo.json'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    searchFile(f);
  }
}
