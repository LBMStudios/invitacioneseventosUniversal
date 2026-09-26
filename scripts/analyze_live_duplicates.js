const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function analyzeLive() {
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const allGuests = data.guests || [];
  const confirmed = allGuests.filter(g => (g.status || '').trim().toLowerCase().includes('confirmad'));

  console.log(`Total confirmados: ${confirmed.length}`);

  // Chequeamos códigos repetidos entre confirmados
  const codeCount = {};
  confirmed.forEach(g => {
    codeCount[g.code] = (codeCount[g.code] || 0) + 1;
  });
  const dupCodes = Object.entries(codeCount).filter(([k, v]) => v > 1);
  console.log('Códigos duplicados entre confirmados:', dupCodes);

  // Chequeamos nombres repetidos entre confirmados
  const nameCount = {};
  confirmed.forEach(g => {
    const n = (g.name || '').trim().toLowerCase();
    nameCount[n] = (nameCount[n] || 0) + 1;
  });
  const dupNames = Object.entries(nameCount).filter(([k, v]) => v > 1);
  console.log('Nombres duplicados entre confirmados:', dupNames);

  // Chequeamos emails compartidos entre confirmados
  const emailMap = {};
  confirmed.forEach(g => {
    const e = (g.email || '').trim().toLowerCase();
    if (e && e.includes('@') && e !== 'no tengo') {
      if (!emailMap[e]) emailMap[e] = [];
      emailMap[e].push({ code: g.code, name: g.name, seats: g.totalSeats, agency: g.agency, comp: g.companionName });
    }
  });
  const sharedEmails = Object.entries(emailMap).filter(([k, v]) => v.length > 1);
  console.log('\nEmails compartidos entre confirmados:');
  sharedEmails.forEach(([e, list]) => {
    console.log(`- ${e}:`);
    list.forEach(item => console.log(`   [${item.code}] ${item.name} (${item.seats} butacas, Agencia: ${item.agency}, Acomp: ${item.comp})`));
  });
}

analyzeLive().catch(console.error);
