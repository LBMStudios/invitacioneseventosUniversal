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

async function verifyAttendance() {
  console.log('1. Descargando base de datos en vivo desde Google Sheets...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const jsonStr = raw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(jsonStr);

  const allGuests = data.guests || [];
  const confirmed = allGuests.filter(g => (g.status || '').trim().toLowerCase().includes('confirmad'));

  let totalSeats = 0;
  let totalTitulares = confirmed.length;
  let totalAcomps = 0;

  console.log(`\n======================================================`);
  console.log(`LISTA COMPLETA DE ASISTENTES CONFIRMADOS EN SALA`);
  console.log(`======================================================`);

  confirmed.forEach((g, i) => {
    const seats = Number(g.totalSeats) || 1;
    totalSeats += seats;
    const acompsInPass = seats - 1;
    totalAcomps += acompsInPass;
    const acompText = g.companion === 'Sí' && g.companionName ? ` | Acomp: ${g.companionName}` : (acompsInPass > 0 ? ` | ${acompsInPass} Acompañante(s)` : ' | Sin acompañante');
    console.log(`${String(i + 1).padStart(3, ' ')}. [${g.code}] ${g.name} -> ${seats} butaca(s) (${g.agency || g.channel || 'Directo'})${acompText}`);
  });

  console.log(`\n======================================================`);
  console.log(`RESUMEN OFICIAL DE CAPACIDAD`);
  console.log(`======================================================`);
  console.log(`• Capacidad total de la sala: 300 butacas (o 299 oficial Movie)`);
  console.log(`• Total Pases Confirmados (Titulares): ${totalTitulares}`);
  console.log(`• Total Acompañantes: ${totalAcomps}`);
  console.log(`• TOTAL ASISTENTES / BUTACAS OCUPADAS: ${totalSeats}`);
  console.log(`• Butacas Disponibles / Libres: ${300 - totalSeats}`);
  console.log(`======================================================`);
}

verifyAttendance().catch(console.error);
