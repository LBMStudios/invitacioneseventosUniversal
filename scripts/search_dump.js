const fs = require('fs');
const list = JSON.parse(fs.readFileSync('live_guests_dump.json', 'utf8'));

console.log('--- SEARCH RESULTS ---');
list.forEach((g, i) => {
  const s = JSON.stringify(g).toLowerCase();
  if (s.includes('barb') || s.includes('mayo') || s.includes('elia') || s.includes('delia') || s.includes('javier')) {
    console.log(`[${i+1}] Code: ${g.code} | Name: ${g.name} | Email: ${g.email} | Status: ${g.status} | Companion: ${g.companion} | CompanionName: "${g.companionName}" | Agency: ${g.agency}`);
  }
});
