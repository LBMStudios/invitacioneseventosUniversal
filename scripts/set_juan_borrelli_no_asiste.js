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

async function markJuanBorrelliNoAsiste() {
  console.log('1. Pasando a Juan Jose Borreli (UA-1615D3F1) a "No asiste"...');
  const params = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-1615D3F1',
    name: 'Juan Jose Borreli',
    email: 'juan.borrelli@semm.com.uy',
    status: 'No asiste',
    totalSeats: '0',
    companion: 'No',
    companionName: 'Virginia Zignago'
  });

  const res = await fetchUrl(`${WEBAPP_URL}?${params.toString()}`);
  console.log('Respuesta actualización:', res);

  console.log('\n2. Consultando conteo en vivo de confirmados...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const guests = (data.guests || []).filter(g => (g.status || '').trim() === 'Confirmado');

  const juan = (data.guests || []).find(g => g.code === 'UA-1615D3F1');
  console.log(`Estado de Juan Borrelli: ${juan ? juan.name + ' -> ' + juan.status : 'No encontrado'}`);

  const seats = guests.reduce((s, g) => s + (Number(g.totalSeats) || 1), 0);
  const tit = guests.length;
  const acomp = seats - tit;

  console.log(`\n========================================`);
  console.log(`ASISTENTES EN SALA EN VIVO:`);
  console.log(`  • Butacas ocupadas: ${seats} / 300`);
  console.log(`  • Butacas disponibles: ${300 - seats}`);
  console.log(`  • Pases confirmados: ${tit} (${tit} tit. + ${acomp} acomp.)`);
  console.log(`========================================`);
}

markJuanBorrelliNoAsiste().catch(console.error);
