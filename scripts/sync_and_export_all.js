const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

async function main() {
  console.log('1. Ejecutando actualización y reconstrucción completa en Google Apps Script...');
  const resAct = await fetch(WEBAPP_URL + '?action=actualizarTodo');
  const dAct = await resAct.json();
  console.log('   Resultado:', dAct);

  console.log('\n2. Sincronizando Hoja3 (Hoja externa de Google Sheets)...');
  try {
    const resSync = await fetch(WEBAPP_URL + '?action=syncSheet');
    console.log('   Sincronización Hoja3 completada con éxito.');
  } catch (e) {
    console.log('   Nota Hoja3:', e.message);
  }

  console.log('\n3. Descargando lista completa actualizada de invitados...');
  const resList = await fetch(WEBAPP_URL + '?action=adminList');
  const dList = await resList.json();
  const guests = dList.guests || [];
  console.log(`   Total de invitados en la base: ${guests.length}`);

  console.log('\n4. Obteniendo estadísticas del evento...');
  const resStats = await fetch(WEBAPP_URL + '?action=adminStats');
  const dStats = await resStats.json();
  console.log('   Estadísticas:', dStats.stats);

  console.log('\n5. Exportando archivos locales...');
  // Headers en español
  const headers = [
    'Código',
    'Nombre Completo',
    'Email',
    'Teléfono',
    'Estado RSVP',
    'Lleva Acompañante',
    'Nombre Acompañante',
    'Total Lugares',
    'Fecha Respuesta',
    'Link Invitación',
    'Estado Envío Mail',
    'Canal',
    'Agencia / Convenio',
    'Referente UA',
    'Etapa',
    'Fecha Apertura Mail'
  ];

  function escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return '"' + s + '"';
  }

  const rows = guests.map(g => [
    escapeCsv(g.code),
    escapeCsv(g.name),
    escapeCsv(g.email),
    escapeCsv(g.phone),
    escapeCsv(g.status || 'Pendiente'),
    escapeCsv(g.companion || 'No'),
    escapeCsv(g.companionName || ''),
    escapeCsv(g.totalSeats || 2),
    escapeCsv(g.responseDate || ''),
    escapeCsv(g.link || `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${encodeURIComponent(g.code)}`),
    escapeCsv(g.mailStatus || ''),
    escapeCsv(g.channel || ''),
    escapeCsv(g.agency || ''),
    escapeCsv(g.referent || ''),
    escapeCsv(g.stage || ''),
    escapeCsv(g.openedAt || '')
  ].join(','));

  const csvContent = '\uFEFF' + [headers.map(h => escapeCsv(h)).join(','), ...rows].join('\r\n');
  const csvPath = 'Base_Invitados_Agencias_UA.csv';
  const jsonPath = 'Base_Invitados_Agencias_UA.json';

  fs.writeFileSync(csvPath, csvContent, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(guests, null, 2), 'utf8');

  console.log(`   📄 CSV exportado: ${csvPath}`);
  console.log(`   📄 JSON exportado: ${jsonPath}`);
}

main().catch(console.error);
