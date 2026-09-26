const fs = require('fs');
const list = JSON.parse(fs.readFileSync('live_guests_dump.json', 'utf8'));

const confirmed = list.filter(g => (g.status || '').toLowerCase().includes('confirmad'));
console.log('Confirmed guests count:', confirmed.length);
let totalSeats = 0;
confirmed.forEach(g => {
  const seats = Number(g.totalSeats) || 2;
  totalSeats += seats;
  if (seats !== 2) {
    console.log(`• ${g.name} (${g.code}) -> ${seats} lugares | Acompañante: "${g.companionName}"`);
  }
});
console.log('Total butacas confirmadas:', totalSeats);
console.log('Porcentaje de ocupación sobre 300:', (totalSeats / 300 * 100).toFixed(1) + '%');
