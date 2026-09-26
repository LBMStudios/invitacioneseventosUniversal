const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getJSON(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

(async () => {
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = data.guests || [];

  console.log(`=== AUDITORIA COMPLETA DE ASISTENTES (TOTAL REGISTROS: ${guests.length}) ===\n`);

  const confirmed = guests.filter(g => (g.status || '').toLowerCase() === 'confirmado');
  const declined = guests.filter(g => (g.status || '').toLowerCase().includes('no'));
  const pending = guests.filter(g => (g.status || '').toLowerCase() === 'pendiente' || !g.status);

  let totalConfirmedSeats = 0;
  let totalTitulares = confirmed.length;
  let totalAcomps = 0;

  const breakdownBySeats = { 1: 0, 2: 0, 3: 0, 4: 0, '5+': 0 };

  confirmed.forEach(g => {
    const seats = Number(g.totalSeats) || 1;
    totalConfirmedSeats += seats;
    const acomps = Math.max(0, seats - 1);
    totalAcomps += acomps;

    if (breakdownBySeats[seats] !== undefined) {
      breakdownBySeats[seats]++;
    } else {
      breakdownBySeats['5+']++;
    }
  });

  console.log('--- RESUMEN GENERAL ---');
  console.log(`Total Pases Registrados: ${guests.length}`);
  console.log(`Pases Confirmados: ${confirmed.length}`);
  console.log(`Pases Pendientes: ${pending.length}`);
  console.log(`Pases Declinados (No asisten): ${declined.length}`);
  console.log(`\n--- BUTACAS / ASISTENTES EN SALA ---`);
  console.log(`TOTAL BUTACAS CONFIRMADAS EN SALA: ${totalConfirmedSeats}`);
  console.log(`  • Titulares que asisten: ${totalTitulares}`);
  console.log(`  • Acompañantes que asisten: ${totalAcomps}`);
  console.log(`Capacidad Sala: 300 personas`);
  console.log(`Butacas Disponibles Restantes: ${300 - totalConfirmedSeats}`);
  console.log(`Porcentaje de Ocupación Sala: ${((totalConfirmedSeats / 300) * 100).toFixed(1)}%`);

  console.log('\n--- DISTRIBUCIÓN DE PASES CONFIRMADOS POR CANTIDAD DE ENTRADAS ---');
  console.log(`• Pases de 1 persona (Solo titular): ${breakdownBySeats[1]} pases (${breakdownBySeats[1]} personas)`);
  console.log(`• Pases de 2 personas (Titular + 1): ${breakdownBySeats[2]} pases (${breakdownBySeats[2] * 2} personas)`);
  console.log(`• Pases de 3 personas (Titular + 2): ${breakdownBySeats[3]} pases (${breakdownBySeats[3] * 3} personas)`);
  console.log(`• Pases de 4 personas (Titular + 3): ${breakdownBySeats[4]} pases (${breakdownBySeats[4] * 4} personas)`);
})();
