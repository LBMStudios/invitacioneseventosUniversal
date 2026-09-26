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

async function getCanal4() {
  const res = await fetchUrl(WEBAPP_URL);
  const guests = res.guests || [];
  
  const canal4 = guests.filter(g => {
    const txt = [g.name, g.agency, g.channel, g.email, g.referent].join(' ').toLowerCase();
    return txt.includes('canal 4') || txt.includes('canal4') || txt.includes('monte carlo') || txt.includes('montecarlo') || txt.includes('canal_4');
  });

  console.log(`========================================`);
  console.log(`📺 REGISTROS DE CANAL 4: ${canal4.length}`);
  console.log(`========================================`);

  canal4.forEach((g, i) => {
    console.log(`${i + 1}. [${g.code}] ${g.name} | Estado: ${g.status} | Butacas: ${g.totalSeats} | Acomp: "${g.companionName || 'Sin acomp'}" | Agencia/Canal: ${g.agency || g.channel} | Email: ${g.email || 'N/A'}`);
  });
}

getCanal4();
