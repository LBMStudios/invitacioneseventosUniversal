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
  console.log('1. Buscando a María José Piuma...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const target = guests.find(g => (g.name || '').toLowerCase().includes('piuma') || (g.name || '').toLowerCase().includes('maria jose'));

  if (!target) {
    console.log('No se encontró a María José Piuma');
    return;
  }

  console.log('Invitada encontrada:', target);

  console.log(`\n2. Registrando ingreso a sala (markIngress) para código ${target.code}...`);
  const markRes = await fetchUrl(`${WEBAPP_URL}?action=markIngress&code=${encodeURIComponent(target.code)}`);
  console.log('Resultado markIngress:', markRes);

  console.log('\n3. Verificando estado en vivo de la acreditación...');
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=guestListCheckin');
  const finalData = JSON.parse(finalRaw);
  const piuma = (finalData.guests || []).find(g => g.code === target.code);
  console.log('Estado actual de María José Piuma:', piuma);

  const checkedIn = (finalData.guests || []).filter(g => g.checkedIn);
  let checkedInSeats = 0;
  checkedIn.forEach(g => checkedInSeats += (Number(g.seats) || 1));

  console.log(`\n📊 BALANCE EN SALA:`);
  console.log(`👥 Personas que ya ingresaron a sala: ${checkedInSeats} butacas (${checkedIn.length} pases acreditados)`);
}

main();
