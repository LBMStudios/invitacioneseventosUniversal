const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      path,
      method: 'GET',
      headers: {
        'api-key': BREVO_API_KEY,
        'accept': 'application/json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          resolve(d);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('--- OBTENIENDO LISTAS DE BREVO ---');
  const lists = await apiGet('/v3/contacts/lists?limit=50');
  console.log('Listas:', JSON.stringify(lists, null, 2));

  console.log('--- BUSCANDO TODOS LOS CONTACTOS EN BREVO ---');
  let all = [];
  let offset = 0;
  while (true) {
    const res = await apiGet(`/v3/contacts?limit=50&offset=${offset}`);
    if (!res.contacts || res.contacts.length === 0) break;
    all.push(...res.contacts);
    if (res.contacts.length < 50) break;
    offset += 50;
  }
  console.log(`Total contactos en Brevo: ${all.length}`);

  const queryNames = [
    'Caro Thomas',
    'Flor Costanzo',
    'Lucha Coitiño',
    'Vale Olivera',
    'Camila walch',
    'Heliana Molina',
    'Anaclara Arrieta',
    'Victoria de Souza',
    'Helena Haller',
    'guadalupe placeres',
    'laura da silva',
    'Belén gallo',
    'carli Varela',
    'Amparo Schelotto',
    'Sofi Giammarchi',
    'Mateo Parafita',
    'Mathias Batto',
    'Karina Vargas',
    'Ayelén Álvarez',
    'Rodrigo Ferrari',
    'Jorge Brun'
  ];

  function normalize(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim();
  }

  console.log('\n--- CONTACTOS CON EMAIL QUE CONTIENEN TRAVELOZ O DESTINICO ---');
  const tOrD = all.filter(c => {
    const em = (c.email || '').toLowerCase();
    const attrs = JSON.stringify(c.attributes || {}).toLowerCase();
    return em.includes('traveloz') || em.includes('destinico') || attrs.includes('traveloz') || attrs.includes('destinico');
  });
  tOrD.forEach(c => {
    console.log(`Email: ${c.email} | Attrs: ${JSON.stringify(c.attributes)}`);
  });

  console.log('\n--- BÚSQUEDA DE LOS 21 EN TODOS LOS CONTACTOS DE BREVO ---');
  for (const q of queryNames) {
    const tokens = normalize(q).split(/\s+/);
    const m = all.filter(c => {
      const full = normalize((c.attributes?.NOMBRE || '') + ' ' + (c.attributes?.APELLIDOS || '') + ' ' + (c.attributes?.FIRSTNAME || '') + ' ' + (c.attributes?.LASTNAME || '') + ' ' + c.email);
      return tokens.every(t => full.includes(t));
    });
    if (m.length > 0) {
      console.log(`[BREVO MATCH] ${q}:`, m.map(c => ({ email: c.email, attrs: c.attributes })));
    } else {
      console.log(`[NO EN BREVO] ${q}`);
    }
  }
}

main().catch(console.error);
