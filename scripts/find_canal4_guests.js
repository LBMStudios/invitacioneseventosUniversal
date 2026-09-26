const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getJSON(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = data.guests || [];

  const canal4Guests = guests.filter(g => {
    const text = [
      g.name, g.agency, g.channel, g.referent, g.email
    ].join(' ').toLowerCase();
    return text.includes('canal 4') || text.includes('canal4') || text.includes('canal') ||
           text.includes('olivera') || text.includes('vladis') || text.includes('wladis') || text.includes('perdomo');
  });

  console.log(`=== INVITADOS DE CANAL 4 / RELACIONADOS (${canal4Guests.length}) ===\n`);
  canal4Guests.forEach((g, i) => {
    console.log(`${i+1}. [${g.code}] ${g.name}`);
    console.log(`   - Estado: ${g.status || 'Pendiente'}`);
    console.log(`   - Butacas: ${g.totalSeats || 2}`);
    console.log(`   - Acompañante: ${g.companionName || '—'}`);
    console.log(`   - Canal/Agencia: ${g.channel || '—'} / ${g.agency || '—'}`);
    console.log(`   - Referente: ${g.referent || '—'}`);
    console.log(`   - Email: ${g.email || '—'}`);
    console.log(`   - Link: ${g.link}\n`);
  });
}

main();
