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

async function reassignPass() {
  console.log('1. Reasignando pase UA-2D660500 de Victoria Blanco a Ana Toniotti (Personal Travel)...');
  
  const params = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-2D660500',
    name: 'Ana Toniotti',
    email: '',
    phone: '',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Hija de Ana Toniotti',
    totalSeats: '2',
    channel: 'AGENCIA',
    agency: 'Personal Travel',
    referent: 'Ana Laura Britos',
    stage: '1er Envío'
  });

  const res = await fetchUrl(`${WEBAPP_URL}?${params.toString()}`);
  console.log('Respuesta actualización:', res);

  console.log('\n2. Verificando datos del pase reasignado...');
  const vRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const vData = JSON.parse(vRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const guest = (vData.guests || []).find(g => g.code === 'UA-2D660500');

  console.log(`\n========================================`);
  console.log(`PASE ACTUALIZADO:`);
  console.log(`  • Código: ${guest.code}`);
  console.log(`  • Titular: ${guest.name}`);
  console.log(`  • Acompañante: ${guest.companionName}`);
  console.log(`  • Butacas: ${guest.totalSeats}`);
  console.log(`  • Agencia: ${guest.agency}`);
  console.log(`  • Estado: ${guest.status}`);
  console.log(`  • Link Entrada VIP: https://ua-eventos-uy.web.app/coyote-vs-acme?i=${guest.code}`);
  console.log(`========================================`);
}

reassignPass().catch(console.error);
