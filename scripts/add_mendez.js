const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const newGuests = [
  'Paulina Méndez',
  'Pilar Méndez',
  'María José Méndez'
];

async function callApi(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  const res = await fetch(fullUrl);
  return await res.json();
}

async function main() {
  const results = [];
  for (let i = 0; i < newGuests.length; i++) {
    const name = newGuests[i];
    console.log(`Creando "${name}"...`);
    const addRes = await callApi('addGuest', { name: name, email: '' });
    if (addRes.code) {
      await callApi('updateGuest', {
        code: addRes.code,
        name: name,
        email: '',
        phone: '',
        agency: 'AGENCIA',
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: 2,
        status: 'Pendiente'
      });
      const link = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${encodeURIComponent(addRes.code)}`;
      results.push({ name, code: addRes.code, link });
      console.log(`  -> Creado: ${addRes.code}`);
    }
  }

  console.log('Sincronizando todo...');
  await callApi('actualizarTodo', {});

  console.log('\nDescargando base actualizada...');
  const resList = await callApi('adminList', {});
  const guests = resList.guests || [];

  const headers = [
    'Código', 'Nombre Completo', 'Email', 'Teléfono', 'Estado RSVP',
    'Lleva Acompañante', 'Nombre Acompañante', 'Total Lugares', 'Fecha Respuesta',
    'Link Invitación', 'Estado Envío Mail', 'Canal', 'Agencia / Convenio',
    'Referente UA', 'Etapa', 'Fecha Apertura Mail'
  ];

  function escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return '"' + s + '"';
  }

  const rows = guests.map(g => [
    escapeCsv(g.code), escapeCsv(g.name), escapeCsv(g.email), escapeCsv(g.phone),
    escapeCsv(g.status || 'Pendiente'), escapeCsv(g.companion || 'No'),
    escapeCsv(g.companionName || ''), escapeCsv(g.totalSeats || 2),
    escapeCsv(g.responseDate || ''),
    escapeCsv(g.link || `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${encodeURIComponent(g.code)}`),
    escapeCsv(g.mailStatus || ''), escapeCsv(g.channel || ''),
    escapeCsv(g.agency || ''), escapeCsv(g.referent || ''),
    escapeCsv(g.stage || ''), escapeCsv(g.openedAt || '')
  ].join(','));

  const csvContent = '\uFEFF' + [headers.map(h => escapeCsv(h)).join(','), ...rows].join('\r\n');
  fs.writeFileSync('Base_Invitados_Agencias_UA.csv', csvContent, 'utf8');
  fs.writeFileSync('Base_Invitados_Agencias_UA.json', JSON.stringify(guests, null, 2), 'utf8');

  console.log('\n=== RESULTADOS ===');
  results.forEach(r => {
    console.log(`🎬 ${r.name} (2 accesos)\n👉 ${r.link}\n`);
  });
}

main().catch(console.error);
