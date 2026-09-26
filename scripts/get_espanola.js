const fs = require('fs');
const list = JSON.parse(fs.readFileSync('live_guests_dump.json', 'utf8'));

const espanola = list.filter(g => {
  const s = JSON.stringify(g).toUpperCase();
  return s.includes('ESPAÑOLA') || s.includes('ESPANOLA') || s.includes('ASOCIACION ESPAÑOLA') || s.includes('ASOCIACIÓN ESPAÑOLA');
});

const confirmed = espanola.filter(g => (g.status || '').toLowerCase().includes('confirmad'));
const pending = espanola.filter(g => (g.status || 'Pendiente').toLowerCase().includes('pendiente'));

console.log('--- CONFIRMADOS ESPAÑOLA ---');
confirmed.forEach((g, idx) => {
  console.log(`${idx+1}. ${g.name} | Acompañante: "${g.companionName || 'Sin acompañante'}" | Butacas: ${g.totalSeats}`);
});

console.log('\n--- PENDIENTES ESPAÑOLA ---');
pending.forEach((g, idx) => {
  console.log(`${idx+1}. ${g.name} | ${g.email || 'Sin email'} | Butacas: ${g.totalSeats}`);
});
