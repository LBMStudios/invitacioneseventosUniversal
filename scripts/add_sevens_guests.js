const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const sevensList = JSON.parse(fs.readFileSync('scripts/sevens_parsed.json', 'utf8'));

async function callApi(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  const res = await fetch(fullUrl);
  return await res.json();
}

async function main() {
  console.log('⏳ Obteniendo base actual para verificar registros existentes...');
  const currentDbRes = await callApi('adminList', {});
  const existingGuests = currentDbRes.guests || [];

  const results = [];

  for (let i = 0; i < sevensList.length; i++) {
    const item = sevensList[i];
    const seats = 2;

    // Buscar si ya existe por nombre exacto o email
    const existing = existingGuests.find(g => 
      (g.name && g.name.trim().toLowerCase() === item.name.trim().toLowerCase()) ||
      (g.email && item.email && g.email.trim().toLowerCase() === item.email.trim().toLowerCase())
    );

    let code = '';

    if (existing) {
      code = existing.code;
      console.log(`[${i + 1}/${sevensList.length}] Actualizando existente: ${item.name} (${code})...`);
      await callApi('updateGuest', {
        code: code,
        name: item.name,
        email: item.email,
        phone: item.phone,
        agency: 'SEVENS',
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: seats,
        status: existing.status || 'Pendiente'
      });
    } else {
      console.log(`[${i + 1}/${sevensList.length}] Creando nuevo: ${item.name}...`);
      const addRes = await callApi('addGuest', { name: item.name, email: item.email });
      if (!addRes.code) {
        console.error(`❌ Error creando ${item.name}:`, addRes);
        continue;
      }
      code = addRes.code;
      await callApi('updateGuest', {
        code: code,
        name: item.name,
        email: item.email,
        phone: item.phone,
        agency: 'SEVENS',
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: seats,
        status: 'Pendiente'
      });
    }

    const link = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${encodeURIComponent(code)}`;
    results.push({
      name: item.name,
      email: item.email,
      phone: item.phone,
      agency: 'Sevens',
      seats: seats,
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

  // Guardar mensajes listos para WhatsApp
  let waText = '';
  results.forEach(r => {
    waText += `📍 ${r.agency}\n🎬 ${r.name} (${r.seats} accesos)\n👉 ${r.link}\n\n`;
  });
  waText += `📌 Recordarles que tienen tiempo para confirmar hasta el Jueves 20 de Agosto.\n`;

  fs.writeFileSync('scripts/mensajes_whatsapp_sevens.txt', waText, 'utf8');

  console.log(`\n🎉 ¡Proceso completado con éxito! Se procesaron ${results.length} contactos de Sevens.`);
}

main().catch(console.error);
