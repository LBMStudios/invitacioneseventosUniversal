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
  console.log('1. Consultando estado de Laura Rodriguez (UA-DBAB436B)...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const laura = (data.guests || []).find(g => g.code === 'UA-DBAB436B');
  console.log('Estado actual de Laura:', laura);

  console.log('\n2. Forzando actualización a CONFIRMADO...');
  const params = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-DBAB436B',
    name: laura ? laura.name : 'Laura Rodriguez',
    email: laura ? (laura.email || '') : '',
    phone: laura ? (laura.phone || '') : '',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: '1 Acompañante',
    totalSeats: '2',
    stage: laura ? (laura.stage || '1er Envío') : '1er Envío',
    channel: laura ? (laura.channel || 'AGENCIA') : 'AGENCIA',
    agency: laura ? (laura.agency || 'Azul Viajes') : 'Azul Viajes',
    referent: laura ? (laura.referent || 'Ana Laura Britos') : 'Ana Laura Britos'
  });

  const updateRes = await fetchUrl(`${WEBAPP_URL}?${params.toString()}`);
  console.log('Respuesta actualización:', updateRes);

  console.log('\n3. Verificando endpoint de invitación pública...');
  const guestCheck = await fetchUrl(`${WEBAPP_URL}?action=getGuest&code=UA-DBAB436B&callback=cb`);
  console.log('getGuest response:', guestCheck);
}

main();
