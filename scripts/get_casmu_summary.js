const fs = require('fs');
const list = JSON.parse(fs.readFileSync('live_guests_dump.json', 'utf8'));

const casmu = list.filter(g => {
  const s = JSON.stringify(g).toUpperCase();
  return s.includes('CASMU');
});

const confirmed = casmu.filter(g => (g.status || '').toLowerCase().includes('confirmad'));
const pending = casmu.filter(g => (g.status || 'Pendiente').toLowerCase().includes('pendiente'));

let confSeats = 0;
confirmed.forEach(g => confSeats += (Number(g.totalSeats) || 2));

let pendSeats = 0;
pending.forEach(g => pendSeats += (Number(g.totalSeats) || 2));

console.log(`Total CASMU: ${casmu.length} pases (${confSeats + pendSeats} butacas)`);
console.log(`CONFIRMADOS: ${confirmed.length} titulares -> ${confSeats} butacas`);
confirmed.forEach((g, i) => {
  console.log(`  ${i+1}. ${g.name} x${g.totalSeats} ${g.companionName ? `(con ${g.companionName})` : ''}`);
});

console.log(`\nPENDIENTES: ${pending.length} titulares -> ${pendSeats} butacas`);
pending.forEach((g, i) => {
  console.log(`  ${i+1}. ${g.name} x${g.totalSeats} (${g.email || 'sin email'})`);
});
