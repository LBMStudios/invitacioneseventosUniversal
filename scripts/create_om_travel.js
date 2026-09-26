const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const omTravelFlorida = [
  'Tatiana Castagno',
  'Tatiana Fierro',
  'Facu Bentancur',
  'Paul Calandria',
  'Mathias Ferreira',
  'Victoria Sanner'
];

const omTravelMvd = [
  'Juan Pedro Garmendia',
  'Juan Manuel Pacheco',
  'Santiago Cirilli',
  'Bernardo Meyer',
  'Elisa Ayres',
  'Enrique Roldan',
  'Matias Gomez',
  'Michel Sanchez'
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function postUpdate(action, params) {
  return new Promise((resolve, reject) => {
    const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
    https.get(fullUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function registerGroup(names, agencyName) {
  const list = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    console.log(`Creando "${name}" (${agencyName})...`);
    const addRes = await postUpdate('addGuest', {
      name: name,
      email: ''
    });

    if (addRes.code) {
      await postUpdate('updateGuest', {
        code: addRes.code,
        name: name,
        email: '',
        phone: '',
        agency: agencyName,
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: 2,
        status: 'Pendiente'
      });
      const link = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${encodeURIComponent(addRes.code)}`;
      list.push({
        name: name,
        code: addRes.code,
        link: link,
        agency: agencyName
      });
      console.log(`  -> OK: ${addRes.code}`);
    } else {
      console.error(`  -> Error con ${name}:`, addRes);
    }
  }
  return list;
}

async function main() {
  console.log('--- REGISTRANDO OM TRAVEL FLORIDA ---');
  const floridaResults = await registerGroup(omTravelFlorida, 'OM Travel Florida');

  console.log('\n--- REGISTRANDO OM TRAVEL MVD ---');
  const mvdResults = await registerGroup(omTravelMvd, 'OM Travel Montevideo');

  console.log('\nSincronizando base de datos...');
  await postUpdate('actualizarTodo', {});

  console.log('\n=== RESULTADOS OM TRAVEL FLORIDA ===');
  floridaResults.forEach(r => console.log(`🎬 ${r.name} (2 accesos)\n👉 ${r.link}\n`));

  console.log('=== RESULTADOS OM TRAVEL MVD ===');
  mvdResults.forEach(r => console.log(`🎬 ${r.name} (2 accesos)\n👉 ${r.link}\n`));
}

main().catch(console.error);
