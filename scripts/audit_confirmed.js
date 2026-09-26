const https = require('https');

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

async function audit() {
  const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';
  
  const res = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = res.guests || [];
  
  const confirmed = guests.filter(g => g.status === 'Confirmado');
  const pending = guests.filter(g => g.status === 'Pendiente');
  const notAttending = guests.filter(g => g.status === 'No asiste');

  console.log('==============================================');
  console.log('📊 AUDITORÍA GENERAL DE BASE DE DATOS');
  console.log('==============================================');
  console.log('Total Invitaciones registradas:', guests.length);
  console.log('Titulares Confirmados:', confirmed.length);
  console.log('Pendientes:', pending.length);
  console.log('No Asisten:', notAttending.length);

  let totalSeatsConfirmed = 0;
  let totalCompanions = 0;
  
  console.log('\n--- LISTADO COMPLETO DE CONFIRMADOS ---');
  confirmed.forEach((g, i) => {
    const seats = parseInt(g.totalSeats, 10) || 1;
    totalSeatsConfirmed += seats;
    const comps = seats - 1;
    totalCompanions += Math.max(0, comps);
    console.log((i + 1) + '. [' + g.code + '] ' + g.name + ' (' + (g.agency || 'Sin agencia') + ') | Cupos: ' + seats + ' | Acomp: "' + (g.companionName || '-') + '" | Fecha: ' + (g.responseDate || '-'));
  });

  console.log('\n==============================================');
  console.log('🍿 TOTALES EXACTOS DE SALA DE CINE');
  console.log('==============================================');
  console.log('Titulares confirmados: ' + confirmed.length);
  console.log('Acompañantes confirmados: ' + totalCompanions);
  console.log('Total Personas / Butacas Ocupadas: ' + totalSeatsConfirmed);
  console.log('Capacidad total sala Movie: 200');
  console.log('Butacas disponibles restantes: ' + (200 - totalSeatsConfirmed));
  console.log('==============================================');

  // Chequeo de duplicados o anomalías
  const codes = new Set();
  const duplicateCodes = [];
  confirmed.forEach(g => {
    if (codes.has(g.code)) duplicateCodes.push(g.code);
    codes.add(g.code);
  });

  if (duplicateCodes.length > 0) {
    console.log('⚠️ ALERTA: Códigos duplicados en confirmados:', duplicateCodes);
  } else {
    console.log('✅ Sin códigos duplicados. Todos los registros son únicos.');
  }
}

audit().catch(console.error);
