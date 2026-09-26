const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Códigos exactos de los 16 invitados que tenían butacas confirmadas y pasaron a expirado
const RESTORE_CODES = [
  'UA-C40101A1', // Mariano Mosca (4)
  'UA-C40404D4', // J. Olivera (5)
  'UA-C40202B2', // W. Helou (2)
  'UA-C40303C3', // B. Perdomo (2)
  'UA-AFE5BD48', // Gimena Rodriguez (4)
  'UA-6A820E9B', // Gustavo Amoroso (3)
  'UA-805814BB', // Sandra Yuane (3)
  'UA-98620481', // Rodrigo Pinto (3)
  'UA-96126527', // Tiffany Herrera (2)
  'UA-0FB47E1B', // Ignacio Vidal (2)
  'UA-C9E7B342', // Belén Arbiza (2)
  'UA-7BA7B4C8', // Carmen Galan (2)
  'UA-2E904FBD', // Emiliano Arevalo (2)
  'UA-E2D839E8-C', // Enrique Haladjian (CAMBADU - 2)
  'UA-12B86D7F-MJ', // Maria Jose (2)
  'UA-98620610'  // Orlandys Suarez (2)
];

async function restoreVIPs() {
  console.log('1. Descargando base en vivo...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const allGuests = data.guests || [];

  // Encontrar por código o nombre
  const targets = [];
  const targetNames = [
    'Mariano Mosca', 'Olivera', 'Helou', 'Perdomo', 'Gimena Rodriguez',
    'Gustavo Amoroso', 'Sandra Yuane', 'Rodrigo Pinto', 'Tiffany Herrera',
    'Ignacio Vidal', 'Belén Arbiza', 'Carmen Galan', 'Emiliano Arevalo',
    'Haladjian', 'Maria Jose', 'Orlandys'
  ];

  targetNames.forEach(tn => {
    const tLower = tn.toLowerCase();
    const g = allGuests.find(x => {
      const xn = (x.name || '').toLowerCase();
      return xn.includes(tLower) && (x.status || '').trim() !== 'Confirmado';
    });
    if (g) targets.push(g);
  });

  console.log(`Encontrados ${targets.length} invitados para re-confirmar:`);
  targets.forEach(t => console.log(`  • ${t.name} (${t.code}) - ${t.totalSeats} butacas`));

  console.log('\n2. Re-confirmando...');
  for (const t of targets) {
    const params = new URLSearchParams({
      action: 'updateGuest',
      code: t.code,
      name: t.name,
      email: t.email || '',
      phone: t.phone || '',
      status: 'Confirmado',
      companion: Number(t.totalSeats) > 1 ? 'Sí' : 'No',
      companionName: t.companionName || '',
      totalSeats: t.totalSeats || '2',
      stage: t.stage || '1er Envío',
      channel: t.channel || 'ESPECIAL',
      agency: t.agency || 'Canal 4',
      referent: t.referent || 'UA'
    });

    await fetchUrl(`${WEBAPP_URL}?${params.toString()}`);
    console.log(`  ✅ Re-confirmado: ${t.name}`);
  }

  console.log('\n3. Verificando estado final...');
  const vRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const vData = JSON.parse(vRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const conf = (vData.guests || []).filter(g => (g.status || '').trim() === 'Confirmado');
  const seats = conf.reduce((s, g) => s + (Number(g.totalSeats) || 1), 0);

  console.log(`\n🎉 NUEVO TOTAL ASISTENTES EN SALA: ${seats} butacas (${conf.length} pases)`);
}

restoreVIPs().catch(console.error);
