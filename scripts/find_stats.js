const fs = require('fs');

const code = fs.readFileSync('apps-script/Código.gs', 'utf8');
const lines = code.split('\n');

console.log('--- BUSCANDO ADMINGETSTATS EN CÓDIGO.GS ---');
lines.forEach((l, i) => {
  if (l.includes('adminGetStats') || l.includes('confirmedSeats')) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 140)}`);
  }
});
