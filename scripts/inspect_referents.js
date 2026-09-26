const fs = require('fs');

const json = JSON.parse(fs.readFileSync('Base_Invitados_Agencias_UA.json', 'utf8'));
const referentCounts = {};
json.forEach(r => {
  const ref = r['Referente UA'] || r.referente || r.Referente || 'N/A';
  referentCounts[ref] = (referentCounts[ref] || 0) + 1;
});
console.log('Referentes UA counts:', referentCounts);

// Check if any specific roles or notes exist
const guests = json.filter(r => (r.Canal || '').includes('FUNCIONARIO') || (r.Email || '').includes('ua.com.uy'));
console.log('\nFuncionarios UA details:');
guests.forEach(g => {
  console.log(`- ${g['Nombre Completo']} | Email: ${g.Email} | Canal: ${g.Canal} | Referente: ${g['Referente UA']}`);
});
