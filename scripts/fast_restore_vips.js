const https = require('https');
const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function postUrl(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = https.request(WEBAPP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect with GET
        return https.get(res.headers.location, res2 => {
          let body = '';
          res2.on('data', c => body += c);
          res2.on('end', () => resolve(body));
        }).on('error', reject);
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Lista de los códigos de los invitados a confirmar
const GUEST_CODES = [
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
  'UA-E2D839E8-C', // Enrique Haladjian (2)
  'UA-12B86D7F-MJ', // Maria Jose (2)
  'UA-98620610'  // Orlandys Suarez (2)
];

const guestDump = JSON.parse(fs.readFileSync('guest_dump_live.json', 'utf8'));
const allGuests = guestDump.guests || [];

const updates = [];
GUEST_CODES.forEach(c => {
  const g = allGuests.find(x => x.code === c);
  if (g) {
    updates.push({
      action: 'adminUpdateGuest',
      code: g.code,
      name: g.name,
      email: g.email || '',
      phone: g.phone || '',
      status: 'Confirmado',
      companion: Number(g.totalSeats) > 1 ? 'Sí' : 'No',
      companionName: g.companionName || '',
      totalSeats: Number(g.totalSeats) || 2,
      stage: g.stage || '1er Envío',
      channel: g.channel || 'ESPECIAL',
      agency: g.agency || 'Agencia',
      referent: g.referent || 'UA'
    });
  }
});

console.log(`Total invitados a confirmar: ${updates.length}`);

async function run() {
  for (const u of updates) {
    console.log(`Confirmando ${u.name} (${u.code}, ${u.totalSeats} butacas)...`);
    const res = await postUrl(u);
    console.log('  ->', res.slice(0, 100));
  }
  console.log('✅ Todos confirmados!');
}

run().catch(console.error);
