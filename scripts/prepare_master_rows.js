const fs = require('fs');

const scratch = JSON.parse(fs.readFileSync('scratch_all_guests.json', 'utf8'));

const codeMap = new Map();

// 1. Cargar todos los invitados del backup completo
scratch.forEach(g => {
  if (g.code) {
    codeMap.set(g.code.toUpperCase(), {
      code: g.code,
      name: g.name || '',
      email: g.email || '',
      phone: g.phone || '',
      status: g.status || 'Pendiente',
      companion: g.companion || 'No',
      companionName: g.companionName || '',
      totalSeats: Number(g.totalSeats) || 2,
      responseDate: g.responseDate || '',
      link: g.link || `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}`,
      mailStatus: g.mailStatus || '',
      stage: g.stage || '1er Envío',
      channel: g.channel || 'SALUD',
      agency: g.agency || '',
      referent: g.referent || 'AM/MT',
      openedAt: g.openedAt || ''
    });
  }
});

// 2. Asegurar que los pases de ASESP estén presentes y confirmados
const asespGuests = [
  { code: 'UA-52679693', name: 'Nestor Conde', email: 'nconde@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-41617516', name: 'Angela Hoffman', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-DDC44D12', name: 'Angela Hoffman', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-545CE8E9', name: 'Monica Naumis', email: 'mnaumis@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-122C9852', name: 'Lucy Hernandez', email: 'lhernandez@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-28AA4CC5', name: 'Sandra Perroni', email: 'sperroni@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-A6AB1B32', name: 'Gina De Bellis', email: 'egdebellis@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-B1897516', name: 'Alberto Yaffe', email: 'ayaffe@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-0D9CB9D1', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-F264FA49', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-AB5F31F5', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-35B91EE9', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 },
  { code: 'UA-B36F0809', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA', status: 'Confirmado', companion: 'Sí', totalSeats: 2 }
];

asespGuests.forEach(g => {
  const existing = codeMap.get(g.code.toUpperCase());
  if (existing) {
    existing.status = 'Confirmado';
    existing.totalSeats = 2;
    existing.companion = 'Sí';
  } else {
    codeMap.set(g.code.toUpperCase(), {
      code: g.code,
      name: g.name,
      email: g.email,
      phone: '',
      status: 'Confirmado',
      companion: 'Sí',
      companionName: '',
      totalSeats: 2,
      responseDate: '',
      link: `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}`,
      mailStatus: 'Enviado',
      stage: '1er Envío',
      channel: 'SALUD',
      agency: g.agency,
      referent: 'AM/MT',
      openedAt: ''
    });
  }
});

// 3. Asegurar que los pases de CASMU estén presentes y confirmados
const casmuGuests = [
  { code: 'UA-417B6C81', name: 'Santiago De Luca', email: 'ca72712@casmu.com', agency: 'CASMU', status: 'Confirmado', companion: 'Sí', companionName: 'Mathias Silva', totalSeats: 2 },
  { code: 'UA-8F23F9C7', name: 'Nadia Nuñez', email: 'ca72787@casmu.com', agency: 'CASMU', status: 'Confirmado', companion: 'Sí', companionName: '', totalSeats: 2 },
  { code: 'UA-A4BB6932', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU', status: 'Confirmado', companion: 'Sí', companionName: '', totalSeats: 2 },
  { code: 'UA-AC652B40', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU', status: 'Confirmado', companion: 'Sí', companionName: '', totalSeats: 2 },
  { code: 'UA-F46A82A6', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU', status: 'Confirmado', companion: 'Sí', companionName: '', totalSeats: 2 },
  { code: 'UA-9CF6443E', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU', status: 'Confirmado', companion: 'Sí', companionName: '', totalSeats: 2 }
];

casmuGuests.forEach(g => {
  const existing = codeMap.get(g.code.toUpperCase());
  if (existing) {
    existing.status = 'Confirmado';
    existing.totalSeats = 2;
    existing.companion = 'Sí';
    if (g.companionName) existing.companionName = g.companionName;
  } else {
    codeMap.set(g.code.toUpperCase(), {
      code: g.code,
      name: g.name,
      email: g.email,
      phone: '',
      status: 'Confirmado',
      companion: 'Sí',
      companionName: g.companionName || '',
      totalSeats: 2,
      responseDate: '',
      link: `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}`,
      mailStatus: 'Enviado',
      stage: '1er Envío',
      channel: 'SALUD',
      agency: g.agency,
      referent: 'AM/MT',
      openedAt: ''
    });
  }
});

// Convertir a matriz 2D para Sheets (17 columnas)
const masterList = Array.from(codeMap.values());
const rows = masterList.map(g => [
  g.code,
  g.name,
  g.email,
  g.phone,
  g.status,
  g.companion,
  g.companionName,
  g.totalSeats,
  g.responseDate,
  g.link,
  g.mailStatus,
  '0',
  g.stage,
  g.channel,
  g.agency,
  g.referent,
  g.openedAt
]);

const confirmedTotal = masterList.filter(g => g.status === 'Confirmado');
const totalSeats = confirmedTotal.reduce((acc, g) => acc + Number(g.totalSeats || 0), 0);

console.log('=== DATASET MAESTRO LISTO ===');
console.log('Total invitados:', masterList.length);
console.log('Total confirmados:', confirmedTotal.length);
console.log('Total asientos confirmados:', totalSeats);

fs.writeFileSync('master_rows.json', JSON.stringify(rows));
console.log('Guardado en master_rows.json');
