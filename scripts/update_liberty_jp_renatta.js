const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

async function callApi(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  const res = await fetch(fullUrl);
  return await res.json();
}

async function main() {
  console.log('🔄 Actualizando pases de Liberty...');

  // 1. Obtener lista actual
  const listRes = await callApi('adminList', {});
  const guests = listRes.guests || [];

  // 2. Actualizar JP Guaglioni a 4 lugares (él + 3 más)
  const jpRecords = guests.filter(g => 
    (g.name && g.name.toLowerCase().includes('guagli')) ||
    (g.email && g.email.toLowerCase().includes('guaglianoni')) ||
    (g.email && g.email.toLowerCase().includes('juanpablo@liberty'))
  );

  for (const jp of jpRecords) {
    console.log(`Actualizando JP [${jp.code}] (${jp.name}) a 4 accesos...`);
    await callApi('updateGuest', {
      code: jp.code,
      name: jp.name,
      email: jp.email || '',
      phone: jp.phone || '',
      agency: jp.agency || 'LIBERTY',
      channel: jp.channel || 'AGENCIA',
      referent: jp.referent || 'AB',
      stage: jp.stage || '1er Envío',
      totalSeats: 4,
      status: jp.status || 'Pendiente'
    });
  }

  // 3. Crear o actualizar Renatta Almeida con 2 accesos
  const renattaExisting = guests.find(g => (g.name || '').toLowerCase().includes('renatta'));
  let renattaCode = '';
  if (renattaExisting) {
    renattaCode = renattaExisting.code;
    console.log(`Renatta ya existe con código ${renattaCode}. Actualizando a 2 accesos...`);
    await callApi('updateGuest', {
      code: renattaCode,
      name: 'Renatta Almeida',
      email: renattaExisting.email || '',
      phone: renattaExisting.phone || '',
      agency: 'LIBERTY',
      channel: 'AGENCIA',
      referent: 'AB',
      stage: 'Envío Manual',
      totalSeats: 2,
      status: renattaExisting.status || 'Pendiente'
    });
  } else {
    console.log('Creando a Renatta Almeida (LIBERTY, 2 accesos)...');
    const addRes = await callApi('addGuest', { name: 'Renatta Almeida', email: '' });
    if (addRes.code) {
      renattaCode = addRes.code;
      await callApi('updateGuest', {
        code: renattaCode,
        name: 'Renatta Almeida',
        email: '',
        phone: '',
        agency: 'LIBERTY',
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: 2,
        status: 'Pendiente'
      });
      console.log(`✅ Creada Renatta Almeida: ${renattaCode}`);
    }
  }

  // 4. Sincronizar y exportar
  console.log('🔄 Sincronizando todo...');
  await callApi('actualizarTodo', {});

  const resListUpdated = await callApi('adminList', {});
  const allGuests = resListUpdated.guests || [];

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

  console.log('✨ Liberty actualizado correctamente.');
}

main().catch(console.error);
