const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

async function callApi(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  const res = await fetch(fullUrl);
  try {
    return await res.json();
  } catch (e) {
    return {};
  }
}

async function main() {
  console.log('🔧 Corrigiendo registros confirmados y eliminando duplicados...');

  // 1. Obtener lista actual
  const listRes = await callApi('adminList', {});
  const guests = listRes.guests || [];

  // 2. Actualizar Patricia Correa (UA-CDDA4E11) a 6 cupos totales (ella + hija + 4 nietos)
  console.log('Actualizando cupos de Patricia Correa (UA-CDDA4E11) a 6 accesos...');
  await callApi('updateGuest', {
    code: 'UA-CDDA4E11',
    name: 'Patricia Correa',
    totalSeats: 6,
    agency: 'SUNLIVE',
    channel: 'AGENCIA',
    referent: 'AB',
    status: 'Confirmado'
  });

  // 3. Actualizar Jimena Leone (UA-96126531) a 4 cupos totales (ella + 3 hijos)
  console.log('Actualizando cupos de Jimena Leone (UA-96126531) a 4 accesos...');
  await callApi('updateGuest', {
    code: 'UA-96126531',
    name: 'Jimena Leone',
    email: 'jleone@coit.com.uy',
    totalSeats: 4,
    agency: 'COIT',
    channel: 'AGENCIA',
    referent: 'AB',
    status: 'Confirmado'
  });

  // 4. Eliminar pases duplicados o innecesarios creados
  const codesToDelete = [
    'UA-98620594', // Patricia Correa Pase Extra 1
    'UA-98620595', // Patricia Correa Pase Extra 2
    'UA-98620602', // Jimena Leone Extras
    'UA-98620597', // Beatriz Alvarez (ya existe UA-3F15C2D8 Bea Alvarez)
    'UA-98620598', // Magdalena Larrosa (ya existe UA-96126451 Magui Larrosa)
    'UA-98620583', // Gabriela Zimmerman (ya existe UA-98620453 Gabriela Zimerman)
    'UA-98620584'  // Carolina Shultz (ya existe UA-96126540 Carolina Schultz)
  ];

  for (const code of codesToDelete) {
    console.log(`🗑️ Eliminando código extra: ${code}...`);
    await callApi('deleteGuest', { code: code });
  }

  // 5. Sincronizar y actualizar archivos
  console.log('🔄 Sincronizando base...');
  await callApi('actualizarTodo', {});

  console.log('📥 Descargando base actualizada...');
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

  console.log('✨ Correcciones finalizadas con éxito.');
}

main().catch(console.error);
