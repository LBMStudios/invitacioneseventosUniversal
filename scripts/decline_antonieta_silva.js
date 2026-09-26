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

async function declineAntonietaSilva() {
  console.log('1. Buscando registro de Antonieta / Thoilme Silva (asilva@ua.com.uy)...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const allGuests = data.guests || [];

  const target = allGuests.find(g => {
    const e = (g.email || '').toLowerCase().trim();
    const n = (g.name || '').toLowerCase().trim();
    return e === 'asilva@ua.com.uy' || n.includes('thoilme') || n.includes('antonieta silva');
  });

  if (!target) {
    console.log('No se encontró a Antonieta Silva.');
    return;
  }

  console.log(`Encontrado: ${target.name} [${target.code}] | Estado actual: ${target.status} | Butacas: ${target.totalSeats}`);

  console.log('\n2. Pasando a "No asiste" y liberando 3 butacas...');
  const params = new URLSearchParams({
    action: 'updateGuest',
    code: target.code,
    name: target.name,
    email: target.email,
    status: 'No asiste',
    totalSeats: '0',
    companion: 'No',
    companionName: target.companionName || ''
  });

  const res = await fetchUrl(`${WEBAPP_URL}?${params.toString()}`);
  console.log('Respuesta actualización:', res);

  console.log('\n3. Consultando conteo en vivo de confirmados...');
  const vRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const vData = JSON.parse(vRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const conf = (vData.guests || []).filter(g => (g.status || '').trim() === 'Confirmado');

  const seats = conf.reduce((s, g) => s + (Number(g.totalSeats) || 1), 0);
  const tit = conf.length;
  const acomp = seats - tit;

  console.log(`\n========================================`);
  console.log(`ASISTENTES EN SALA EN VIVO:`);
  console.log(`  • Butacas ocupadas: ${seats} / 300`);
  console.log(`  • Butacas disponibles: ${300 - seats}`);
  console.log(`  • Pases confirmados: ${tit} (${tit} tit. + ${acomp} acomp.)`);
  console.log(`========================================`);
}

declineAntonietaSilva().catch(console.error);
