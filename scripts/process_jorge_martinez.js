const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const jmList = [
  { name: 'Aldo Nipoli', seats: 3 },
  { name: 'Gabriel Piastra', seats: 3 },
  { name: 'Monica Reyes', seats: 3 },
  { name: 'Angel Brazionis', seats: 3 },
  { name: 'Laura Ronchetti', seats: 3 },
  { name: 'Victoria Cardoso', seats: 2 },
  { name: 'Fernando Nader', seats: 3 },
  { name: 'Carina Cobas', seats: 2 },
  { name: 'Lorena Sanchez', seats: 3 },
  { name: 'Orlandys Suárez', seats: 2 },
  { name: 'Rodolfo Capote', seats: 2 },
  { name: 'Victoria Mendez', seats: 2 },
  { name: 'Elias Farah', seats: 2 }
];

async function callApi(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  const res = await fetch(fullUrl);
  try { return await res.json(); } catch(e) { return {}; }
}

async function main() {
  console.log('🔄 Consultando base actual para Jorge Martínez...');
  const currentDbRes = await callApi('adminList', {});
  const existingGuests = currentDbRes.guests || [];

  // Eliminar duplicado exacto de Victoria Mendez si existe (UA-94F047C2)
  const dupVictoria = existingGuests.find(g => g.code === 'UA-94F047C2');
  if (dupVictoria) {
    console.log('🗑️ Eliminando duplicado UA-94F047C2 (Victoria Mendez)...');
    await callApi('deleteGuest', { code: 'UA-94F047C2' });
  }

  const results = [];

  for (let i = 0; i < jmList.length; i++) {
    const item = jmList[i];
    
    // Buscar coincidencia en base
    const existing = existingGuests.find(g => {
      const gn = (g.name || '').toLowerCase().trim();
      const target = item.name.toLowerCase().trim();
      if (gn === target) return true;
      if (target === 'laura ronchetti' && gn.includes('rocheti')) return true;
      if (target === 'elias farah' && gn.includes('elias fara')) return true;
      return false;
    });

    let code = '';

    if (existing) {
      code = existing.code;
      console.log(`[${i + 1}/${jmList.length}] Actualizando existente: ${item.name} (${code}) con ${item.seats} accesos...`);
      await callApi('updateGuest', {
        code: code,
        name: item.name,
        email: existing.email || '',
        phone: existing.phone || '',
        agency: 'Jorge Martínez',
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: item.seats,
        status: existing.status || 'Pendiente'
      });
    } else {
      console.log(`[${i + 1}/${jmList.length}] Creando nuevo: ${item.name} (${item.seats} accesos)...`);
      const addRes = await callApi('addGuest', { name: item.name, email: '' });
      if (!addRes.code) {
        console.error(`❌ Error creando ${item.name}:`, addRes);
        continue;
      }
      code = addRes.code;
      await callApi('updateGuest', {
        code: code,
        name: item.name,
        email: '',
        phone: '',
        agency: 'Jorge Martínez',
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: item.seats,
        status: 'Pendiente'
      });
    }

    const link = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${encodeURIComponent(code)}`;
    results.push({
      agency: 'Jorge Martínez',
      name: item.name,
      seats: item.seats,
      code: code,
      link: link
    });
  }

  console.log('\n🔄 Sincronizando todo...');
  await callApi('actualizarTodo', {});

  console.log('📥 Descargando base actualizada...');
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

  fs.writeFileSync('scripts/jorge_martinez_results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('🎉 ¡Todos los invitados de Jorge Martínez han sido procesados con éxito!');
}

main().catch(console.error);
