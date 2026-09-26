const fs = require('fs');

const html = fs.readFileSync('apps-script/Admin.html', 'utf8');
const lines = html.split('\n');

console.log('--- BUSCANDO LÓGICA DE ASIENTOS Y ESTADÍSTICAS EN ADMIN.HTML ---');
lines.forEach((l, i) => {
  if (l.includes('s-seats') || l.includes('openCinemaSeatModal') || l.includes('confirmed') || l.includes('seats')) {
    if (l.includes('function') || l.includes('setElHtml') || l.includes('innerHTML') || l.includes('openCinemaSeatModal')) {
      console.log(`Line ${i+1}: ${l.trim().slice(0, 140)}`);
    }
  }
});
