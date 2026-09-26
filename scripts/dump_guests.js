const fs = require('fs');
const path = require('path');

async function main() {
  const res = await fetch('https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList');
  const data = await res.json();
  const guests = data.guests || [];
  
  const outPath = path.join(__dirname, 'guests_dump.json');
  fs.writeFileSync(outPath, JSON.stringify(guests, null, 2));
  console.log(`Saved ${guests.length} guests to ${outPath}`);

  // Find all email anomalies
  const anomalies = [];
  guests.forEach((g, idx) => {
    const raw = (g.email || '').trim();
    if (!raw || raw.toUpperCase().includes('NO TENGO') || raw.toUpperCase().includes('SIN MAIL') || !raw.includes('@') || raw.includes(';') || raw.includes(' ')) {
      anomalies.push({
        num: idx + 1,
        code: g.code,
        name: g.name,
        email: raw,
        agency: g.agency || g.channel || 'N/A',
        stage: g.stage || 'N/A',
        mailStatus: g.mailStatus || ''
      });
    }
  });

  console.log('\n--- ANOMALÍAS ENCONTRADAS (' + anomalies.length + ') ---');
  console.log(JSON.stringify(anomalies, null, 2));
}

main().catch(console.error);
