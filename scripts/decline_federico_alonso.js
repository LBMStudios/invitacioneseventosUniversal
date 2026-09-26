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
  console.log('1. Buscando a Federico Alonso de Active Travel...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const target = guests.find(g => (g.name || '').toLowerCase().includes('federico alonso') || (g.email || '').toLowerCase().includes('federico.alonso'));

  if (!target) {
    console.log('No se encontró a Federico Alonso');
    return;
  }

  console.log('Encontrado:', target);

  console.log(`\n2. Actualizando a 'No asiste' (liberando sus ${target.totalSeats} butacas)...`);
  const updateParams = new URLSearchParams({
    action: 'updateGuest',
    code: target.code,
    name: target.name,
    email: target.email || '',
    phone: target.phone || '',
    status: 'No asiste',
    companion: 'No',
    companionName: '',
    totalSeats: target.totalSeats || '3',
    stage: target.stage || '1er Envío',
    channel: target.channel || 'AGENCIA',
    agency: target.agency || 'Active Travel',
    referent: target.referent || 'UA'
  });

  const resUpdate = await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  console.log('Resultado actualización:', resUpdate);

  console.log('\n3. Verificando nuevo balance en vivo...');
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const finalClean = finalRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const finalData = JSON.parse(finalClean);

  const confirmed = (finalData.guests || []).filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => totalSeats += (Number(g.totalSeats) || 1));

  console.log(`\n📊 BALANCE SALA:`);
  console.log(`🎟️ Confirmados: ${confirmed.length} pases | ${totalSeats} butacas ocupadas`);
  console.log(`💺 Butacas Libres en Sala: ${Math.max(300 - totalSeats, 0)} disponibles`);
}

main();
