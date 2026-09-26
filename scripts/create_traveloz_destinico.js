const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const guestsToAdd = [
  'Caro Thomas',
  'Flor Costanzo',
  'Lucha Coitiño',
  'Vale Olivera',
  'Camila Walch',
  'Heliana Molina',
  'Anaclara Arrieta',
  'Victoria de Souza',
  'Helena Haller',
  'Guadalupe Placeres',
  'Laura da Silva',
  'Belén Gallo',
  'Carli Varela',
  'Amparo Schelotto',
  'Sofi Giammarchi',
  'Mateo Parafita',
  'Mathias Batto',
  'Karina Vargas',
  'Ayelén Álvarez',
  'Rodrigo Ferrari',
  'Jorge Brun'
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

async function main() {
  console.log('1. Verificando invitados actuales en la base...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const currentGuests = res.guests || [];
  console.log(`Total actual: ${currentGuests.length}`);

  const results = [];

  for (let i = 0; i < guestsToAdd.length; i++) {
    const name = guestsToAdd[i];
    console.log(`[${i+1}/${guestsToAdd.length}] Creando "${name}"...`);
    
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
        agency: 'Traveloz / Destinico',
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: 2,
        status: 'Pendiente'
      });
      const link = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${encodeURIComponent(addRes.code)}`;
      results.push({
        num: i + 1,
        name: name,
        code: addRes.code,
        link: link,
        agency: 'Traveloz / Destinico'
      });
      console.log(`  -> Creado con código: ${addRes.code}`);
    } else {
      console.error(`  -> Error al crear ${name}:`, addRes);
    }
  }

  console.log('\n2. Sincronizando y actualizando todo el sistema...');
  await postUpdate('actualizarTodo', {});

  console.log('\n=== LISTA DE LINKS GENERADOS ===');
  results.forEach(r => {
    console.log(`${r.num}. ${r.name} | Código: ${r.code} | Link: ${r.link}`);
  });
}

main().catch(console.error);
