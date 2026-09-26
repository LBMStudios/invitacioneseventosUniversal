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
  console.log('1. Buscando a Orlandys, Kimberly e Infanti...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const targets = guests.filter(g => {
    const text = [g.name, g.email, g.agency, g.companionName].join(' ').toLowerCase();
    return text.includes('orland') || text.includes('kimber') || text.includes('infanti');
  });

  console.log('Registros encontrados:', JSON.stringify(targets, null, 2));

  const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  for (const t of targets) {
    console.log(`Marcando ingreso para ${t.name} (${t.code})...`);
    await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=${encodeURIComponent(t.code)}`);
    const updateParams = new URLSearchParams({
      action: 'updateGuest',
      code: t.code,
      name: t.name,
      status: 'Confirmado',
      companion: t.companion || 'No',
      companionName: t.companionName || '',
      totalSeats: t.totalSeats || '1',
      stage: `Ingresó (${nowTimeString})`,
      channel: t.channel || 'AGENCIA',
      agency: t.agency || 'Infanti',
      referent: t.referent || 'UA'
    });
    await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  }

  console.log('\n2. Verificando estado final...');
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const finalClean = finalRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const finalData = JSON.parse(finalClean);
  
  const finalTargets = (finalData.guests || []).filter(g => {
    const text = [g.name, g.email, g.agency, g.companionName].join(' ').toLowerCase();
    return text.includes('orland') || text.includes('kimber') || text.includes('infanti');
  });

  console.log('Fichas finales:', JSON.stringify(finalTargets, null, 2));
}

main();
