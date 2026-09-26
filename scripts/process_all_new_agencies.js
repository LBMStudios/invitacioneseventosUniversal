const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const guestsToProcess = [
  // LIBERTY
  { name: 'Carolina Rizzo', agency: 'Liberty Uruguay', seats: 2 },
  { name: 'Renatta Almeida', agency: 'Liberty Uruguay', seats: 2 },

  // V Y T viajes y turismo
  { name: 'Gabriela Zimmerman', agency: 'V Y T Viajes', seats: 2 },
  { name: 'Carolina Shultz', agency: 'V Y T Viajes', seats: 2 },
  { name: 'Alejandro Perciavalle', agency: 'V Y T Viajes', seats: 2 },
  { name: 'Hector', agency: 'V Y T Viajes', seats: 2 },
  { name: 'Federico Sassi', agency: 'V Y T Viajes', seats: 2 },

  // BN tours
  { name: 'Noela Fonsalia', agency: 'BN Tours', seats: 2 },
  { name: 'Sebastian Lopez', agency: 'BN Tours', seats: 2 },
  { name: 'Bernardo Nuñez', agency: 'BN Tours', seats: 2 },
  { name: 'Alejandra Bermudez', agency: 'BN Tours', seats: 2 },
  { name: 'Sebastian Borroni', agency: 'BN Tours', seats: 2 },
  { name: 'Valentina Daguerre', agency: 'BN Tours', seats: 2 },

  // Travel Ya
  { name: 'Alejandro Haberfeld', agency: 'Travel Ya', seats: 2 },

  // Sunlive (Patricia Correa extras)
  { name: 'Patricia Correa (Pase Extra 1)', agency: 'Sunlive', seats: 2 },
  { name: 'Patricia Correa (Pase Extra 2)', agency: 'Sunlive', seats: 2 },

  // Batista Viajes
  { name: 'Yomira Aguiar', agency: 'Batista Viajes', seats: 2 },
  { name: 'Juan Andres Varela', agency: 'Batista Viajes', seats: 2 },
  { name: 'Beatriz Alvarez', agency: 'Batista Viajes', seats: 2 },
  { name: 'Magdalena Larrosa', agency: 'Batista Viajes', seats: 2 },

  // Melitour
  { name: 'Gianfranco Iafrate', agency: 'Melitour', seats: 2, email: '' },
  { name: 'Alejandra', agency: 'Melitour', seats: 2, email: 'alejandra@melitour.com.uy' },
  { name: 'Carmen', agency: 'Melitour', seats: 2, email: 'carmen@melitour.com.uy' },

  // COIT (Jimena Leone extras)
  { name: 'Jimena Leone (Entradas Extras)', agency: 'COIT', seats: 2 }
];

async function callApi(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  const res = await fetch(fullUrl);
  return await res.json();
}

async function main() {
  console.log('🔄 Consultando base actual en Google Sheets...');
  const currentDbRes = await callApi('adminList', {});
  const existingGuests = currentDbRes.guests || [];

  // Actualizar JP Guaglioni a 4 accesos si existe
  const jpRecords = existingGuests.filter(g => 
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

  const results = [];

  for (let i = 0; i < guestsToProcess.length; i++) {
    const item = guestsToProcess[i];
    
    // Buscar si ya existe por nombre exacto
    const existing = existingGuests.find(g => 
      g.name && g.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );

    let code = '';

    if (existing) {
      code = existing.code;
      console.log(`[${i + 1}/${guestsToProcess.length}] Ya existe: ${item.name} (${code}). Actualizando...`);
      await callApi('updateGuest', {
        code: code,
        name: item.name,
        email: existing.email || '',
        phone: existing.phone || '',
        agency: item.agency,
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: item.seats,
        status: existing.status || 'Pendiente'
      });
    } else {
      console.log(`[${i + 1}/${guestsToProcess.length}] Creando nuevo: ${item.name} (${item.agency})...`);
      const addRes = await callApi('addGuest', { name: item.name, email: item.email || '' });
      if (!addRes.code) {
        console.error(`❌ Error creando ${item.name}:`, addRes);
        continue;
      }
      code = addRes.code;
      await callApi('updateGuest', {
        code: code,
        name: item.name,
        email: item.email || '',
        phone: item.phone || '',
        agency: item.agency,
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: item.seats,
        status: 'Pendiente'
      });
    }

    const link = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${encodeURIComponent(code)}`;
    results.push({
      agency: item.agency,
      name: item.name,
      seats: item.seats,
      code: code,
      link: link
    });
  }

  console.log('\n🔄 Sincronizando todo en Google Sheets...');
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

  fs.writeFileSync('scripts/agencias_nuevas_results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('🎉 ¡Todas las agencias y extras han sido procesadas con éxito!');
}

main().catch(console.error);
