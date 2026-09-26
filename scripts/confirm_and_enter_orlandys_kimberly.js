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
  const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  console.log('1. Confirmando e ingresando a Orlandys Suárez (UA-98620610)...');
  const updateOrlandys = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-98620610',
    name: 'Orlandys Suárez',
    email: 'osuarez@jorgemartinez.com.uy',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Acompañante',
    totalSeats: '2',
    stage: `Ingresó (${nowTimeString})`,
    channel: 'AGENCIA',
    agency: 'Jorge Martínez',
    referent: 'UA'
  });
  await fetchUrl(`${WEBAPP_URL}?${updateOrlandys.toString()}`);
  await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=UA-98620610`);

  console.log('\n2. Creando/Asegurando e ingresando a Kimberly Infanti...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const existingKimberly = (data.guests || []).find(g => (g.name || '').toLowerCase().includes('kimber'));

  let kimCode = '';
  if (existingKimberly) {
    kimCode = existingKimberly.code;
  } else {
    const addKim = await fetchUrl(`${WEBAPP_URL}?action=addGuest&name=${encodeURIComponent('Kimberly Infanti')}`);
    const addRes = JSON.parse(addKim);
    kimCode = addRes.code;
  }

  const updateKim = new URLSearchParams({
    action: 'updateGuest',
    code: kimCode,
    name: 'Kimberly Infanti',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Acompañante',
    totalSeats: '2',
    stage: `Ingresó (${nowTimeString})`,
    channel: 'INVITADO ESPECIAL',
    agency: 'Infanti',
    referent: 'UA'
  });
  await fetchUrl(`${WEBAPP_URL}?${updateKim.toString()}`);
  await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=${kimCode}`);

  console.log(`\n3. Verificando estado en vivo...`);
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const finalClean = finalRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const finalData = JSON.parse(finalClean);
  
  const oFinal = (finalData.guests || []).find(g => g.code === 'UA-98620610');
  const kFinal = (finalData.guests || []).find(g => g.code === kimCode);

  console.log('Orlandys Suárez:', oFinal);
  console.log('Kimberly Infanti:', kFinal);
}

main();
