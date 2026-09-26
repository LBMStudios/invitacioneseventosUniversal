const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const guests = [
  {
    name: 'Seba Detomas',
    agency: 'OM Travel Montevideo',
    role: 'Director OM Travel MVD',
    seats: 2
  },
  {
    name: 'Juan Ignacio Crncich',
    agency: 'OM Travel Montevideo',
    role: 'Director OM Travel MVD',
    seats: 2
  },
  {
    name: 'Rodrigo Perez',
    agency: 'OM Travel Florida',
    role: 'OM Travel Florida',
    seats: 2
  }
];

async function callApi(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  const res = await fetch(fullUrl);
  return await res.json();
}

async function main() {
  const results = [];
  for (const g of guests) {
    console.log(`Creando "${g.name}" (${g.agency})...`);
    const addRes = await callApi('addGuest', { name: g.name, email: '' });
    if (addRes.code) {
      await callApi('updateGuest', {
        code: addRes.code,
        name: g.name,
        email: '',
        phone: '',
        agency: g.agency,
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: g.seats,
        status: 'Pendiente'
      });
      const link = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${encodeURIComponent(addRes.code)}`;
      results.push({
        name: g.name,
        code: addRes.code,
        role: g.role,
        seats: g.seats,
        link: link
      });
      console.log(`  -> Creado: ${addRes.code}`);
    }
  }

  console.log('\nSincronizando base de datos...');
  await callApi('actualizarTodo', {});

  console.log('\nDescargando base actualizada...');
  const resList = await callApi('adminList', {});
  const allGuests = resList.guests || [];

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

  const rows = allGuests.map(g => [
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
  fs.writeFileSync('Base_Invitados_Agencias_UA.json', JSON.stringify(allGuests, null, 2), 'utf8');

  console.log('\n=== RESULTADOS LISTOS ===');
  results.forEach(r => {
    console.log(`🎬 ${r.name} (${r.seats} accesos) [${r.role}]\n👉 ${r.link}\n`);
  });
}

main().catch(console.error);
