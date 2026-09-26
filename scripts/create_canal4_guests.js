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
  const canal4Guests = [
    { code: 'UA-C40101A1', name: 'Mariana Mosca', email: 'mmosca@canal4.com.uy', seats: 2 },
    { code: 'UA-C40202B2', name: 'W. Helou', email: 'whelou@canal4.com.uy', seats: 2 },
    { code: 'UA-C40303C3', name: 'B. Perdomo', email: 'bperdomo@canal4.com.uy', seats: 2 },
    { code: 'UA-C40404D4', name: 'J. Olivera', email: 'jolivera@canal4.com.uy', seats: 2 },
    { code: 'UA-C40505E5', name: 'Cupo Canal 4 (Administración 1)', email: '', seats: 2 },
    { code: 'UA-C40606F6', name: 'Cupo Canal 4 (Administración 2)', email: '', seats: 2 },
    { code: 'UA-C40707A7', name: 'Cupo Canal 4 (Administración 3)', email: '', seats: 2 },
    { code: 'UA-C40808B8', name: 'Cupo Canal 4 (Administración 4)', email: '', seats: 2 }
  ];

  console.log('1. Creando/Actualizando pases de Canal 4 en la base...');
  for (const g of canal4Guests) {
    const url = WEBAPP_URL + `?action=updateGuest&code=${g.code}&name=${encodeURIComponent(g.name)}&email=${encodeURIComponent(g.email)}&channel=${encodeURIComponent('MEDIOS / PRENSA')}&agency=${encodeURIComponent('Canal 4')}&referent=${encodeURIComponent('Ana Camiou')}&totalSeats=${g.seats}&status=Pendiente&companion=S%C3%AD`;
    const res = await getJSON(url);
    console.log(`  ✅ ${g.name} (${g.code}):`, res.message || res.ok);
  }

  console.log('\n2. Verificando en la lista live...');
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const found = (data.guests || []).filter(g => (g.agency || '').includes('Canal 4') || (g.name || '').includes('Canal 4'));
  console.log(`Total pases Canal 4 en la base: ${found.length}`);
  found.forEach(f => {
    console.log(`  • ${f.code} | ${f.name} | ${f.email || 'Sin mail'} | ${f.totalSeats} asientos | Link: ${f.link}`);
  });
})();
