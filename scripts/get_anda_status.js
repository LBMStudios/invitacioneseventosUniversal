const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
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

async function getAnda() {
  const res = await fetchUrl(WEBAPP_URL);
  const guests = res.guests || [];
  const anda = guests.filter(g => {
    const ag = (g.agency || '').toUpperCase();
    const em = (g.email || '').toLowerCase();
    return ag.includes('ANDA') || em.includes('anda.com.uy');
  });

  const confirmed = anda.filter(g => g.status === 'Confirmado');
  const other = anda.filter(g => g.status !== 'Confirmado');

  console.log(`Total ANDA en base: ${anda.length}`);
  console.log(`\n🟢 CONFIRMADOS DE ANDA (${confirmed.length} pases · ${confirmed.reduce((s, g) => s + (Number(g.totalSeats) || 2), 0)} butacas):`);
  confirmed.forEach((g, i) => {
    console.log(`${i + 1}. ${g.name} (${g.code}) - ${g.totalSeats} butacas - Acompañante: "${g.companionName || 'Sin acomp'}" - Email: ${g.email || 'N/A'}`);
  });

  console.log(`\n⚪ OTROS / EXPIRADOS DE ANDA (${other.length}):`);
  other.forEach((g, i) => {
    console.log(`${i + 1}. ${g.name} (${g.code}) - Estado: ${g.status} - Email: ${g.email || 'N/A'}`);
  });
}

getAnda();
