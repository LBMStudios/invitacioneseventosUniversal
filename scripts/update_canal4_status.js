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

async function updateGuest(paramsObj) {
  const params = new URLSearchParams({
    action: 'updateGuest',
    ...paramsObj
  });
  const res = await fetchUrl(`${WEBAPP_URL}?${params.toString()}`);
  console.log(`Update ${paramsObj.code} (${paramsObj.name}) -> ${paramsObj.status}:`, res);
}

async function main() {
  console.log('🔄 Actualizando invitados de Canal 4...');

  // 1. Mariano Mosca -> No asiste
  await updateGuest({
    code: 'UA-C40101A1',
    name: 'Mariano Mosca',
    email: 'mmosca@canal4.com.uy',
    phone: '',
    status: 'No asiste',
    companion: 'No',
    companionName: '',
    totalSeats: '4',
    stage: 'Envío Manual',
    channel: 'MEDIOS / PRENSA',
    agency: 'Canal 4',
    referent: 'Ana Camiou'
  });

  // 2. Javier Olivera -> Lista de Espera
  await updateGuest({
    code: 'UA-C40404D4',
    name: 'J. Olivera',
    email: 'jolivera@canal4.com.uy',
    phone: '',
    status: 'Lista de Espera',
    companion: 'Sí',
    companionName: 'Inés Calabuig | Santino Olivera | Micaela Olivera | Bautista Olivera',
    totalSeats: '5',
    stage: 'Envío Manual',
    channel: 'MEDIOS / PRENSA',
    agency: 'Canal 4',
    referent: 'Ana Camiou'
  });

  // 3. W. Helou / Vladis -> Lista de Espera
  await updateGuest({
    code: 'UA-C40202B2',
    name: 'W. Helou',
    email: 'whelou@canal4.com.uy',
    phone: '',
    status: 'Lista de Espera',
    companion: 'Sí',
    companionName: '',
    totalSeats: '2',
    stage: 'Envío Manual',
    channel: 'MEDIOS / PRENSA',
    agency: 'Canal 4',
    referent: 'Ana Camiou'
  });

  // 4. Belén Perdomo -> Lista de Espera
  await updateGuest({
    code: 'UA-C40303C3',
    name: 'B. Perdomo',
    email: 'bperdomo@canal4.com.uy',
    phone: '',
    status: 'Lista de Espera',
    companion: 'Sí',
    companionName: '',
    totalSeats: '2',
    stage: 'Envío Manual',
    channel: 'MEDIOS / PRENSA',
    agency: 'Canal 4',
    referent: 'Ana Camiou'
  });

  console.log('\n✅ Verificando nuevo estado general...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);

  const confirmed = (data.guests || []).filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => totalSeats += (Number(g.totalSeats) || 1));

  const waitlist = (data.guests || []).filter(g => (g.status || '').toLowerCase().includes('espera'));
  let waitlistSeats = 0;
  waitlist.forEach(g => waitlistSeats += (Number(g.totalSeats) || 1));

  console.log(`\n📊 NUEVO BALANCE:`);
  console.log(`🎟️ Confirmados: ${confirmed.length} pases | ${totalSeats} butacas ocupadas`);
  console.log(`📋 En Lista de Espera: ${waitlist.length} pases | ${waitlistSeats} butacas`);
  console.log(`💺 Butacas Libres en Sala: ${Math.max(300 - totalSeats, 0)} disponibles`);
}

main();
