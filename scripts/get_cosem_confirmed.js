const fs = require('fs');
const list = JSON.parse(fs.readFileSync('live_guests_dump.json', 'utf8'));

const cosemConfirmed = list.filter(g => {
  const agency = (g.agency || '').toUpperCase();
  const channel = (g.channel || '').toUpperCase();
  const referent = (g.referent || '').toUpperCase();
  const email = (g.email || '').toLowerCase();
  const isCosem = agency.includes('COSEM') || channel.includes('COSEM') || referent.includes('COSEM') || email.includes('cosem');
  const isConfirmed = (g.status || '').toLowerCase().includes('confirmad');
  return isCosem && isConfirmed;
});

console.log('Total COSEM Confirmados:', cosemConfirmed.length);
cosemConfirmed.forEach((g, idx) => {
  console.log(`${idx + 1}. ${g.name} | Email: ${g.email} | Tel: ${g.phone || '-'} | Lugares: ${g.totalSeats} | Acompañante: "${g.companionName}" | Código: ${g.code} | Fecha: ${g.responseDate}`);
});
