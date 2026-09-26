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
  console.log('1. Buscando a Carmen de Melitour...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const matches = guests.filter(g => {
    const text = [g.name, g.email, g.companionName, g.agency].join(' ').toLowerCase();
    return text.includes('carmen') || text.includes('melit');
  });

  console.log('Registros encontrados:', JSON.stringify(matches, null, 2));

  const carmen = guests.find(g => (g.name || '').toLowerCase().includes('carmen') && (
    (g.agency || '').toLowerCase().includes('melit') || (g.email || '').toLowerCase().includes('melit')
  ));

  if (!carmen) {
    console.log('No se encontró coincidencia exacta para Carmen Melitour.');
    return;
  }

  console.log(`\n2. Actualizando a Carmen (${carmen.code}) a 'No asiste' (liberando ${carmen.totalSeats} butacas)...`);
  const updateParams = new URLSearchParams({
    action: 'updateGuest',
    code: carmen.code,
    name: carmen.name,
    email: carmen.email || '',
    phone: carmen.phone || '',
    status: 'No asiste',
    companion: 'No',
    companionName: '',
    totalSeats: carmen.totalSeats || '2',
    stage: carmen.stage || '1er Envío',
    channel: carmen.channel || 'AGENCIA',
    agency: carmen.agency || 'MELITOUR',
    referent: carmen.referent || 'UA'
  });

  const updateRes = await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  console.log('Resultado actualización:', updateRes);

  console.log('\n3. Verificando estado en vivo...');
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const finalClean = finalRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const finalData = JSON.parse(finalClean);

  const confirmed = (finalData.guests || []).filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => totalSeats += (Number(g.totalSeats) || 1));

  console.log(`\n📊 BALANCE SALA TRAS LIBERACIÓN:`);
  console.log(`🎟️ Confirmados: ${confirmed.length} pases | ${totalSeats} butacas ocupadas`);
  console.log(`💺 Butacas Libres en Sala: ${Math.max(300 - totalSeats, 0)} disponibles`);
}

main();
