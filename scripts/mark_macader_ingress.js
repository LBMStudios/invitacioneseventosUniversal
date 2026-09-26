const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url, retries = 3) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, retries));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => {
      if (retries > 0) {
        setTimeout(() => resolve(fetchUrl(url, retries - 1)), 1000);
      } else {
        reject(err);
      }
    });
  });
}

async function main() {
  console.log('1. Buscando a Karina Macader (SEMM)...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const target = guests.find(g => {
    const text = [g.name, g.email, g.agency, g.companionName].join(' ').toLowerCase();
    return text.includes('macader') || (text.includes('karina') && text.includes('semm'));
  });

  const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  let code = '';
  if (target) {
    console.log('Invitada encontrada:', target);
    code = target.code;
    const updateParams = new URLSearchParams({
      action: 'updateGuest',
      code: target.code,
      name: target.name,
      status: 'Confirmado',
      companion: target.companion || 'No',
      companionName: target.companionName || '',
      totalSeats: target.totalSeats || '2',
      stage: `Ingresó (${nowTimeString})`,
      channel: target.channel || 'SALUD',
      agency: target.agency || 'SEMM',
      referent: target.referent || 'AM/MT'
    });
    await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  } else {
    console.log('No figuraba registrada, creando pase de puerta...');
    const addRes = await fetchUrl(`${WEBAPP_URL}?action=addGuest&name=${encodeURIComponent('Karina Macader')}`);
    const parsed = JSON.parse(addRes);
    code = parsed.code;

    const updateParams = new URLSearchParams({
      action: 'updateGuest',
      code: code,
      name: 'Karina Macader',
      status: 'Confirmado',
      companion: 'Sí',
      companionName: 'Acompañante',
      totalSeats: '2',
      stage: `Ingresó (${nowTimeString})`,
      channel: 'SALUD',
      agency: 'SEMM',
      referent: 'UA'
    });
    await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  }

  await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=${encodeURIComponent(code)}`);

  console.log('\n2. Verificando estado final...');
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const finalClean = finalRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const finalData = JSON.parse(finalClean);
  const macader = (finalData.guests || []).find(g => g.code === code);
  console.log('Ficha final Karina Macader:', macader);
}

main();
