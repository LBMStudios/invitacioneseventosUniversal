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

async function main() {
  console.log('1. Actualizando estado de Joel Felder (UA-192EB1CE) a No asiste...');
  
  const params = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-192EB1CE',
    name: 'Joel Felder',
    email: '',
    phone: '',
    status: 'No asiste',
    companion: 'No',
    companionName: '',
    totalSeats: '4',
    stage: 'Envío Manual',
    channel: 'AGENCIA',
    agency: 'BUEMES',
    referent: 'AB'
  });

  const res = await fetchUrl(`${WEBAPP_URL}?${params.toString()}`);
  console.log('Respuesta Apps Script:', res);

  console.log('\n2. Verificando estado en vivo...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const joel = (data.guests || []).find(g => g.code === 'UA-192EB1CE');
  console.log('Joel Felder en base:', joel);

  const confirmed = (data.guests || []).filter(g => (g.status || '').trim().toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => totalSeats += (Number(g.totalSeats) || 1));
  console.log(`\n📊 Total confirmados actuales: ${confirmed.length} pases | ${totalSeats} butacas ocupadas.`);
}

main();
