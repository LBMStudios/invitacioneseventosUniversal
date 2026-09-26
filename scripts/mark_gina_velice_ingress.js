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
  console.log('1. Buscando a Gina de Velice...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const target = guests.find(g => {
    const text = [g.name, g.email, g.agency, g.companionName].join(' ').toLowerCase();
    return text.includes('gina') || (text.includes('velice') && text.includes('gin'));
  });

  if (!target) {
    console.log('No se encontró a Gina de Velice directamente, buscando coincidencias de Velice:');
    const veliceGuests = guests.filter(g => (g.agency || '').toLowerCase().includes('velice') || (g.name || '').toLowerCase().includes('gina'));
    console.log(veliceGuests);
    return;
  }

  console.log('Invitada encontrada:', target);

  console.log(`\n2. Registrando ingreso a sala (markIngress) para código ${target.code}...`);
  const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  // Usar markIngress oficial + updateGuest para asegurar el timestamp en Google Sheets
  const markRes = await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=${encodeURIComponent(target.code)}`);
  console.log('Resultado markIngress:', markRes);

  const updateParams = new URLSearchParams({
    action: 'updateGuest',
    code: target.code,
    name: target.name,
    status: 'Confirmado',
    companion: target.companion || 'No',
    companionName: target.companionName || '',
    totalSeats: target.totalSeats || '1',
    stage: `Ingresó (${nowTimeString})`,
    channel: target.channel || 'AGENCIA',
    agency: target.agency || 'Velice',
    referent: target.referent || 'UA'
  });
  await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);

  console.log('\n3. Verificando estado en vivo...');
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const finalClean = finalRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const finalData = JSON.parse(finalClean);
  const gina = (finalData.guests || []).find(g => g.code === target.code);
  console.log('Ficha final de Gina:', gina);
}

main();
