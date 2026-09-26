const fs = require('fs');
const list = JSON.parse(fs.readFileSync('live_guests_dump.json', 'utf8'));

const semmConfirmed = list.filter(g => {
  const agency = (g.agency || '').toUpperCase();
  const channel = (g.channel || '').toUpperCase();
  const referent = (g.referent || '').toUpperCase();
  const email = (g.email || '').toLowerCase();
  const isSemm = agency.includes('SEMM') || channel.includes('SEMM') || referent.includes('SEMM') || email.includes('semm');
  const isConfirmed = (g.status || '').toLowerCase().includes('confirmad');
  return isSemm && isConfirmed;
});

console.log('Total SEMM / SEMM CALL Confirmados:', semmConfirmed.length);
let totalSeats = 0;
semmConfirmed.forEach((g, idx) => {
  const seats = Number(g.totalSeats) || 2;
  totalSeats += seats;
  console.log(`${idx + 1}. [${g.agency || 'SEMM'}] ${g.name} | Email: ${g.email} | Tel: ${g.phone || '-'} | Lugares: ${seats} | Acompañante: "${g.companionName}" | Código: ${g.code} | Fecha: ${g.responseDate}`);
});
console.log('Total Butacas SEMM / SEMM CALL:', totalSeats);
