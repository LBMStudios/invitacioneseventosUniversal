const https = require('https');
const fs = require('fs');

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
  console.log('🔄 Ejecutando auditoría final completa...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const confirmed = guests.filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  const declined = guests.filter(g => (g.status || '').toLowerCase() === 'no asiste');
  const waitlist = guests.filter(g => (g.status || '').toLowerCase().includes('espera'));

  let confirmedSeats = 0;
  confirmed.forEach(g => confirmedSeats += (Number(g.totalSeats) || 1));

  let declinedSeats = 0;
  declined.forEach(g => declinedSeats += (Number(g.totalSeats) || 1));

  let waitlistSeats = 0;
  waitlist.forEach(g => waitlistSeats += (Number(g.totalSeats) || 1));

  console.log('----------------------------------------------------');
  console.log('📊 AUDITORÍA GENERAL EN VIVO:');
  console.log('----------------------------------------------------');
  console.log(`🎟️ Pases Confirmados: ${confirmed.length}`);
  console.log(`👥 Butacas Ocupadas: ${confirmedSeats} / 300`);
  console.log(`💺 Butacas Libres en Sala: ${Math.max(300 - confirmedSeats, 0)}`);
  console.log(`❌ Bajas / No asisten: ${declined.length} pases (${declinedSeats} butacas liberadas)`);
  console.log(`📋 En Lista de Espera: ${waitlist.length} pases (${waitlistSeats} butacas solicitadas)`);
  console.log('----------------------------------------------------');

  // Verificar casos clave
  const checkKeys = [
    { name: 'Joel Felder', expected: 'No asiste' },
    { name: 'Laura Rodriguez', expected: 'Confirmado' },
    { name: 'Mariano Mosca', expected: 'No asiste' },
    { name: 'J. Olivera', expected: 'Lista de Espera' },
    { name: 'W. Helou', expected: 'Lista de Espera' },
    { name: 'B. Perdomo', expected: 'Lista de Espera' },
    { name: 'Andrea Silvana Menéndez Martínez', expected: 'Confirmado' },
    { name: 'Monica Reyes', expected: 'Confirmado' },
    { name: 'Sebastián Furtado', expected: 'Confirmado' },
    { name: 'Federico Alonso', expected: 'No asiste' },
    { name: 'Mariano Umpierre', expected: 'Confirmado' },
    { name: 'Carmen Galan', expected: 'No asiste' }
  ];

  console.log('\n🔍 VERIFICACIÓN DE ÚLTIMOS MOVIMIENTOS:');
  checkKeys.forEach(k => {
    const found = guests.find(g => (g.name || '').toLowerCase().includes(k.name.toLowerCase()));
    if (found) {
      const ok = found.status === k.expected;
      console.log(` [${ok ? '✅' : '❌'}] ${k.name}: Estado '${found.status}' (Esperado: '${k.expected}') | Butacas: ${found.totalSeats} | Acomp: ${found.companionName || '—'}`);
    } else {
      console.log(` [❌] ${k.name}: NO ENCONTRADO`);
    }
  });
}

main();
