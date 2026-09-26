const fs = require('fs');
const xlsx = require('xlsx');

console.log('--- ALL COSEM CONTACTS IN DATABASE ---');
const list = JSON.parse(fs.readFileSync('live_guests_dump.json', 'utf8'));
list.forEach((g, idx) => {
  const str = JSON.stringify(g).toLowerCase();
  if (str.includes('cosem')) {
    console.log(`[${idx+1}] Code: ${g.code} | Name: ${g.name} | Email: ${g.email} | Status: ${g.status} | MailStatus: ${g.mailStatus} | ResponseDate: ${g.responseDate} | Companion: "${g.companionName}"`);
  }
});
