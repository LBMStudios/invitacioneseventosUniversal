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

async function main() {
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = data.guests || [];

  const registeredToday = guests.filter(g => {
    const rd = String(g.responseDate || '');
    const op = String(g.openedAt || '');
    const st = String(g.stage || '');
    const ms = String(g.mailStatus || '');
    return rd.includes('8/27/2026') || rd.includes('27/08/2026') ||
           op.includes('8/27/2026') || op.includes('27/08') ||
           ms.includes('27/08') || ms.includes('8/27');
  });

  console.log(`Encontrados con actividad/registro hoy (27 de Agosto): ${registeredToday.length}`);
  registeredToday.forEach(g => {
    console.log(`- Código: ${g.code} | Nombre: ${g.name} | Email: ${g.email} | Estado: ${g.status} | Butacas: ${g.totalSeats} | Acomp: ${g.companionName} | Fecha Resp: ${g.responseDate} | Agencia: ${g.agency}`);
  });
}

main();
