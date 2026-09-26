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
  if (!raw) return '';
  const matches = String(raw).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return '';
  return [...new Set(matches.map(e => e.trim().toLowerCase()))].join(',');
}

(async () => {
  const list = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = list.guests || [];

  const confirmed = guests.filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  const declined = guests.filter(g => (g.status || '').toLowerCase().includes('no asiste') || (g.status || '').toLowerCase().includes('rechaz'));
  const pending = guests.filter(g => !confirmed.includes(g) && !declined.includes(g));

  const pendingWithEmail = [];
  const pendingWithoutEmail = [];

  pending.forEach(g => {
    const validEmails = cleanEmail(g.email);
    if (validEmails) {
      pendingWithEmail.push({ ...g, cleanEmail: validEmails });
    } else {
      pendingWithoutEmail.push(g);
    }
  });

  console.log('--- RESUMEN EXACTO DE LA BASE ---');
  console.log('Total registros en base:', guests.length);
  console.log('Confirmados:', confirmed.length);
  console.log('No asisten:', declined.length);
  console.log('Pendientes totales:', pending.length);
  console.log('Pendientes CON EMAIL (destinatarios):', pendingWithEmail.length);
  console.log('Pendientes SIN EMAIL (WhatsApp / Manual):', pendingWithoutEmail.length);

  const byAgency = {};
  pendingWithEmail.forEach(g => {
    const ag = g.agency || g.channel || 'Sin Agencia';
    byAgency[ag] = (byAgency[ag] || 0) + 1;
  });

  console.log('\n--- PENDIENTES CON EMAIL POR AGENCIA / CANAL ---');
  const sortedAgencies = Object.entries(byAgency).sort((a,b) => b[1] - a[1]);
  sortedAgencies.forEach(([ag, count]) => {
    console.log(`- ${ag}: ${count}`);
  });
})();
