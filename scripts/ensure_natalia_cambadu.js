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
  const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  console.log('1. Asegurando ingreso para Natalia Doglia...');
  const addRes = await fetchUrl(`${WEBAPP_URL}?action=addGuest&name=${encodeURIComponent('Natalia Doglia')}`);
  console.log('Add:', addRes);
  const parsed = JSON.parse(addRes);
  const nataliaCode = parsed.code;

  const updateNatalia = new URLSearchParams({
    action: 'updateGuest',
    code: nataliaCode,
    name: 'Natalia Doglia',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Acompañante',
    totalSeats: '2',
    stage: `Ingresó (${nowTimeString})`,
    channel: 'INVITADO ESPECIAL',
    agency: 'Puerta / Directo',
    referent: 'UA'
  });
  await fetchUrl(`${WEBAPP_URL}?${updateNatalia.toString()}`);
  await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=${encodeURIComponent(nataliaCode)}`);

  console.log('2. Asegurando ingreso para CAMBADU (UA-B9D60563)...');
  await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=UA-B9D60563`);

  console.log('Listo. Natalia Doglia (' + nataliaCode + ') y CAMBADU (UA-B9D60563) registrados e ingresados.');
}

main();
