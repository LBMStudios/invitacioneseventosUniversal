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
  console.log('1. Actualizando ingreso a sala de María José Piuma (UA-98620619)...');
  const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  const updateParams = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-98620619',
    name: 'María José Piuma',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Josefina Barceló | Micaela Radiccioni',
    totalSeats: '3',
    stage: `Ingresó (${nowTimeString})`,
    channel: 'AGENCIA',
    agency: 'ANDA',
    referent: 'Ana Camiou'
  });

  const res = await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  console.log('Resultado actualización:', res);

  console.log('\n2. Verificando estado en vivo...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const piuma = (data.guests || []).find(g => g.code === 'UA-98620619');
  console.log('Ficha de María José Piuma:', piuma);
}

main();
