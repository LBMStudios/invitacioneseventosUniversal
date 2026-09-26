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
  console.log('1. Buscando registros de CAMBADU...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const cambaduGuests = guests.filter(g => {
    const text = [g.name, g.email, g.agency, g.companionName, g.referent, g.channel].join(' ').toLowerCase();
    return text.includes('cambadu');
  });

  console.log('Registros de CAMBADU encontrados:', JSON.stringify(cambaduGuests, null, 2));

  const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  for (const g of cambaduGuests) {
    console.log(`Marcando ingreso para ${g.name} (${g.code})...`);
    await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=${encodeURIComponent(g.code)}`);
    const updateParams = new URLSearchParams({
      action: 'updateGuest',
      code: g.code,
      name: g.name,
      status: 'Confirmado',
      companion: g.companion || 'No',
      companionName: g.companionName || '',
      totalSeats: g.totalSeats || '2',
      stage: `Ingresó (${nowTimeString})`,
      channel: g.channel || 'CONVENIO',
      agency: g.agency || 'CAMBADU',
      referent: g.referent || 'UA'
    });
    await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  }

  console.log('\n2. Verificando estado final...');
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const finalClean = finalRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const finalData = JSON.parse(finalClean);

  const finalCambadu = (finalData.guests || []).filter(g => {
    const text = [g.name, g.email, g.agency, g.companionName, g.referent, g.channel].join(' ').toLowerCase();
    return text.includes('cambadu');
  });

  console.log('Fichas finales CAMBADU:', JSON.stringify(finalCambadu, null, 2));
}

main();
