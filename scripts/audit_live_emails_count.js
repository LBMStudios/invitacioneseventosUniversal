const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const clean = data.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
          resolve(JSON.parse(clean));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching live guest data...');
  const res = await fetchJson(WEBAPP_URL + '?action=adminList&callback=cb');
  const guests = res.guests || [];

  const confirmed = guests.filter(g => (g.status || '').trim().toLowerCase().includes('confirmad'));
  
  let totalSeats = 0;
  const emailsMap = new Map();
  const withoutEmail = [];

  confirmed.forEach(g => {
    const seats = Number(g.totalSeats) || 1;
    totalSeats += seats;

    const email = (g.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      withoutEmail.push(g);
    } else {
      if (!emailsMap.has(email)) {
        emailsMap.set(email, []);
      }
      emailsMap.get(email).push(g);
    }
  });

  console.log('=== AUDITORIA EXACTA DE CONFIRMADOS EN VIVO ===');
  console.log(`Total registros confirmados: ${confirmed.length}`);
  console.log(`Total butacas / personas ocupadas: ${totalSeats}`);
  console.log(`Total direcciones de email únicas: ${emailsMap.size}`);
  console.log(`Registros confirmados sin email: ${withoutEmail.length}`);

  let multiPasesCount = 0;
  emailsMap.forEach((pases, email) => {
    if (pases.length > 1) {
      multiPasesCount++;
    }
  });
  console.log(`Emails que tienen más de 1 pase asignado (agrupados): ${multiPasesCount}`);
}

main();
