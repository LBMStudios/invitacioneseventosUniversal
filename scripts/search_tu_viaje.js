const fs = require('fs');
const base = JSON.parse(fs.readFileSync('./Base_Invitados_Agencias_UA.json', 'utf8'));

const matches = base.filter(g => {
  const txt = (g.name + ' ' + g.email + ' ' + g.agency + ' ' + g.referent).toLowerCase();
  return txt.includes('cabana') || txt.includes('tu viaje') || txt.includes('sebastian');
});

console.log('Resultados Tu Viaje:');
matches.forEach(g => {
  console.log(`${g.code} | ${g.name} | ${g.email} | ${g.agency} | Ref: ${g.referent} | Lugares: ${g.totalSeats} | Estado: ${g.status} | Link: ${g.link}`);
});
