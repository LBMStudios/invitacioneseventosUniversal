const fs = require('fs');
const base = JSON.parse(fs.readFileSync('./Base_Invitados_Agencias_UA.json', 'utf8'));

console.log('=== TODOS LOS REGISTROS DE CASMU EN LA BASE ===');
base.filter(g => (g.agency || '').toUpperCase().includes('CASMU') || (g.email || '').includes('casmu') || (g.referent || '').toUpperCase().includes('CASMU')).forEach(g => {
  console.log(`${g.code} | ${g.name} | ${g.email} | Estado: ${g.status} | Acomp: ${g.companion} (${g.companionName || 'sin nombre'}) | Asientos: ${g.totalSeats}`);
});

console.log('\n=== BUSCANDO NOMBRES DE LA LISTA DE NADIA ===');
['cobas', 'olivera', 'aguilar', 'rossini', 'maubrigades'].forEach(term => {
  const matches = base.filter(g => (g.name || '').toLowerCase().includes(term) || (g.companionName || '').toLowerCase().includes(term));
  console.log(`Coincidencias con '${term}':`);
  matches.forEach(m => console.log(`   • ${m.code} | ${m.name} | ${m.email} | ${m.agency} | Estado: ${m.status} | Acomp: ${m.companionName}`));
});
