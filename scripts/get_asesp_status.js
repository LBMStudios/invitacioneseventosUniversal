const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function getAsesp() {
  const res = await fetchUrl(WEBAPP_URL);
  const guests = res.guests || [];
  const asesp = guests.filter(g => {
    const ag = (g.agency || '').toUpperCase();
    const em = (g.email || '').toLowerCase();
    return ag.includes('ESPAÑOLA') || ag.includes('ASESP') || em.includes('asesp');
  });

  const confirmed = asesp.filter(g => g.status === 'Confirmado');
  const notConfirmed = asesp.filter(g => g.status !== 'Confirmado');

  console.log('==================================================');
  console.log(`🏥 ASOCIACIÓN ESPAÑOLA (ASESp) - TOTAL REGISTROS: ${asesp.length}`);
  console.log('==================================================');

  console.log(`\n🟢 CONFIRMADOS (${confirmed.length} pases · ${confirmed.reduce((s, g) => s + (Number(g.totalSeats) || 2), 0)} butacas):`);
  confirmed.forEach((g, i) => {
    const seats = Number(g.totalSeats) || 2;
    console.log(`${i + 1}. ${g.name} (${g.code})`);
    console.log(`   • Butacas: ${seats}`);
    console.log(`   • Acompañante: "${g.companionName || 'Sin acompañante registrado'}"`);
    console.log(`   • Email: ${g.email || 'Sin email'}`);
    console.log(`   • Link: ${g.link}`);
  });

  console.log(`\n🚫 NO CONFIRMADOS / EXPIRADOS (${notConfirmed.length} pases):`);
  notConfirmed.forEach((g, i) => {
    console.log(`${i + 1}. ${g.name} (${g.code}) | Estado: ${g.status} | Email: ${g.email || 'Sin email'}`);
  });
}

getAsesp();
