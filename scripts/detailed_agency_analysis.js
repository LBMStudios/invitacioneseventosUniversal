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
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function analyze() {
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = res.guests || [];
  const confirmed = guests.filter(g => g.status === 'Confirmado');

  console.log('--- REVISIÓN DE CONFIRMADOS POR AGENCIA ---');
  const byAgency = {};
  confirmed.forEach(g => {
    const ag = g.agency || 'Sin Agencia';
    if (!byAgency[ag]) byAgency[ag] = { count: 0, seats: 0, list: [] };
    const s = Number(g.totalSeats) || 2;
    byAgency[ag].count++;
    byAgency[ag].seats += s;
    byAgency[ag].list.push(`${g.name} (${s} butacas) [${g.code}]`);
  });

  Object.keys(byAgency).sort().forEach(ag => {
    console.log(`\n📌 ${ag}: ${byAgency[ag].count} pases / ${byAgency[ag].seats} butacas`);
    byAgency[ag].list.forEach(item => console.log('   • ' + item));
  });

  console.log('\n--- REVISIÓN DE PENDIENTES ---');
  const pending = guests.filter(g => g.status === 'Pendiente');
  console.log('Pendientes actuales:', pending.length);
  pending.forEach(p => console.log(`   • ${p.name} [${p.code}] - ${p.agency}`));

  console.log('\n--- REVISIÓN DE EXPIRADOS ---');
  const expired = guests.filter(g => g.status === 'Expirado');
  console.log('Expirados actuales:', expired.length);
  
  console.log('\n--- REVISIÓN DE LISTA DE ESPERA ---');
  const waitlist = guests.filter(g => g.status === 'Lista de Espera');
  console.log('Lista de Espera actuales:', waitlist.length);
  waitlist.forEach(w => console.log(`   • ${w.name} [${w.code}] - Tel: ${w.phone} - Butacas: ${w.totalSeats}`));
}

analyze();
