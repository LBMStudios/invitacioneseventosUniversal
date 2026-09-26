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
  console.log('1. Consultando registro UA-98620475...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);

  const target = (data.guests || []).find(g => g.code === 'UA-98620475');
  console.log('Registro UA-98620475:', target);

  console.log('\n2. Actualizando UA-98620475 con Andrea y Mateo...');
  const updateParams = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-98620475',
    name: 'Andrea Silvana Menéndez Martínez',
    email: target ? (target.email || '') : '',
    phone: target ? (target.phone || '') : '',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Mateo Menéndez Martínez',
    totalSeats: '2',
    stage: target ? (target.stage || '1er Envío') : '1er Envío',
    channel: target ? (target.channel || 'AGENCIA') : 'AGENCIA',
    agency: target ? (target.agency || 'Jorge Martínez') : 'Jorge Martínez',
    referent: target ? (target.referent || 'UA') : 'UA'
  });

  const updateRes = await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  console.log('Respuesta actualización UA-98620475:', updateRes);

  console.log('\n3. Eliminando el código duplicado UA-98620621...');
  const delRes = await fetchUrl(`${WEBAPP_URL}?action=deleteGuest&code=UA-98620621`);
  console.log('Respuesta borrado UA-98620621:', delRes);
}

main();
