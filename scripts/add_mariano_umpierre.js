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
  console.log('1. Buscando si Mariano Umpierre ya existe en la base...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const existing = guests.find(g => (g.name || '').toLowerCase().includes('umpierre') || (g.email || '').toLowerCase().includes('umpierre'));

  let code = '';
  if (existing) {
    console.log('Encontrado existente:', existing);
    code = existing.code;
  } else {
    console.log('Creando nuevo registro para Mariano Umpierre...');
    const addParams = new URLSearchParams({
      action: 'addGuest',
      name: 'Mariano Umpierre',
      email: ''
    });
    const addRaw = await fetchUrl(`${WEBAPP_URL}?${addParams.toString()}`);
    console.log('Respuesta addGuest:', addRaw);
    const addRes = JSON.parse(addRaw);
    code = addRes.code;
  }

  console.log(`\n2. Actualizando a CONFIRMADO con 2 butacas...`);
  const updateParams = new URLSearchParams({
    action: 'updateGuest',
    code: code,
    name: 'Mariano Umpierre',
    email: existing ? (existing.email || '') : '',
    phone: existing ? (existing.phone || '') : '',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Acompañante',
    totalSeats: '2',
    stage: 'Envío Manual',
    channel: 'INVITADO ESPECIAL',
    agency: 'Directo',
    referent: 'UA'
  });

  const updateRaw = await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  console.log('Respuesta updateGuest:', updateRaw);

  console.log('\n3. Verificando estado en vivo...');
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const finalClean = finalRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const finalData = JSON.parse(finalClean);
  const mariano = (finalData.guests || []).find(g => g.code === code);
  console.log('Mariano Umpierre en base:', mariano);

  const confirmed = (finalData.guests || []).filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => totalSeats += (Number(g.totalSeats) || 1));
  console.log(`\n📊 Balance Sala: ${confirmed.length} pases | ${totalSeats} butacas ocupadas | Libres: ${Math.max(300 - totalSeats, 0)}`);
}

main();
