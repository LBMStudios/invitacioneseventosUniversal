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

function cleanEmail(raw) {
  if (!raw) return [];
  const matches = String(raw).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return [];
  return [...new Set(matches.map(e => e.trim().toLowerCase()))];
}

(async () => {
  const list = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = list.guests || [];

  const confirmed = guests.filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  const declined = guests.filter(g => (g.status || '').toLowerCase().includes('no asiste') || (g.status || '').toLowerCase().includes('rechaz'));
  const pending = guests.filter(g => !confirmed.includes(g) && !declined.includes(g));

  const emailMap = new Map();

  pending.forEach(g => {
    const emails = cleanEmail(g.email);
    emails.forEach(em => {
      if (!emailMap.has(em)) emailMap.set(em, []);
      emailMap.get(em).push(g);
    });
  });

  console.log('=== AUDITORIA DE AGRUPACION POR EMAIL ===');
  console.log('Total registros pendientes con email:', pending.filter(g => cleanEmail(g.email).length > 0).length);
  console.log('Total de EMAILS UNICOS a despachar:', emailMap.size);

  const multi = [];
  const single = [];

  for (const [em, gList] of emailMap.entries()) {
    if (gList.length > 1) {
      multi.push({ email: em, count: gList.length, guests: gList });
    } else {
      single.push({ email: em, guest: gList[0] });
    }
  }

  console.log('Casillas con 1 sola invitacion:', single.length);
  console.log('Casillas con MULTIPLES invitaciones:', multi.length);

  console.log('\n=== DETALLE DE CASILLAS MULTIPLES ===');
  multi.sort((a,b) => b.count - a.count).forEach(m => {
    console.log(`\nEmail: ${m.email} (${m.count} invitaciones / links)`);
    m.guests.forEach((g, idx) => {
      console.log(`  ${idx+1}. ${g.name} | Codigo: ${g.code} | Agencia: ${g.agency || g.channel}`);
    });
  });
})();
