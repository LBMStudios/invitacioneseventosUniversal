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
  console.log('1. Buscando a Gina (Velice) y Guadalupe Placeres...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const gina = guests.find(g => {
    const text = [g.name, g.email, g.agency, g.companionName].join(' ').toLowerCase();
    return text.includes('gina') || (text.includes('velice') && (text.includes('gin') || text.includes('viajes')));
  });

  const guadalupe = guests.find(g => {
    const text = [g.name, g.email, g.agency, g.companionName].join(' ').toLowerCase();
    return text.includes('placeres') || text.includes('guadalupe');
  });

  console.log('Gina:', gina);
  console.log('Guadalupe:', guadalupe);

  const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  if (gina) {
    console.log(`\nMarcando ingreso para Gina (${gina.code})...`);
    await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=${encodeURIComponent(gina.code)}`);
    const updateGina = new URLSearchParams({
      action: 'updateGuest',
      code: gina.code,
      name: gina.name,
      status: 'Confirmado',
      companion: gina.companion || 'No',
      companionName: gina.companionName || '',
      totalSeats: gina.totalSeats || '1',
      stage: `Ingresó (${nowTimeString})`,
      channel: gina.channel || 'AGENCIA',
      agency: gina.agency || 'Velice',
      referent: gina.referent || 'UA'
    });
    await fetchUrl(`${WEBAPP_URL}?${updateGina.toString()}`);
  }

  if (guadalupe) {
    console.log(`\nMarcando ingreso para Guadalupe (${guadalupe.code})...`);
    await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=${encodeURIComponent(guadalupe.code)}`);
    const updateGuadalupe = new URLSearchParams({
      action: 'updateGuest',
      code: guadalupe.code,
      name: guadalupe.name,
      status: 'Confirmado',
      companion: guadalupe.companion || 'No',
      companionName: guadalupe.companionName || '',
      totalSeats: guadalupe.totalSeats || '2',
      stage: `Ingresó (${nowTimeString})`,
      channel: guadalupe.channel || 'AGENCIA',
      agency: guadalupe.agency || 'Directo',
      referent: guadalupe.referent || 'UA'
    });
    await fetchUrl(`${WEBAPP_URL}?${updateGuadalupe.toString()}`);
  }

  console.log('\n2. Verificando estado en vivo...');
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const finalClean = finalRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const finalData = JSON.parse(finalClean);
  
  const ginaFinal = (finalData.guests || []).find(g => g.code === (gina ? gina.code : ''));
  const guadalupeFinal = (finalData.guests || []).find(g => g.code === (guadalupe ? guadalupe.code : ''));

  console.log('Gina Final:', ginaFinal);
  console.log('Guadalupe Final:', guadalupeFinal);
}

main();
