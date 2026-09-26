const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

async function main() {
  console.log('⏳ Descargando base de datos completa de invitados y agencias...');
  const r = await fetch(WEBAPP_URL + '?action=adminList');
  const d = await r.json();
  const guests = d.guests || [];
  console.log(`✅ Total de registros obtenidos: ${guests.length}`);

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
  console.log(`📄 Archivo CSV generado (compatible con Excel): ${csvPath}`);

  fs.writeFileSync(jsonPath, JSON.stringify(guests, null, 2), 'utf8');
  console.log(`📄 Archivo JSON generado: ${jsonPath}`);
}

main().catch(console.error);
