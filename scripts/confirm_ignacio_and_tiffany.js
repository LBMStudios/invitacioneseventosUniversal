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
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function postUpdate(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  return fetchUrl(fullUrl);
}

async function confirmIgnacioAndTiffany() {
  console.log('1. Confirmando a Ignacio Vidal (UA-0FB47E1B)...');
  const r1 = await postUpdate('updateGuest', {
    code: 'UA-0FB47E1B',
    name: 'Ignacio Vidal',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Mariana Aguirre',
    totalSeats: 2,
    agency: 'Traveloz / Destinico',
    channel: 'CANAL - AGENCIA',
    referent: 'Ana Laura Britos'
  });
  console.log('Ignacio Vidal:', r1);

  console.log('2. Confirmando a Tiffany Herrera (UA-96126527)...');
  const r2 = await postUpdate('updateGuest', {
    code: 'UA-96126527',
    name: 'Tiffany Herrera',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Kevin Nallem',
    totalSeats: 2,
    agency: 'PROVIAJES',
    channel: 'CANAL - AGENCIA',
    referent: 'AB'
  });
  console.log('Tiffany Herrera:', r2);

  console.log('\n3. Sincronizando base de datos y reportes (actualizarTodo + syncSheet)...');
  await postUpdate('actualizarTodo', {});
  await postUpdate('syncSheet', {});

  console.log('\n4. Verificando datos live...');
  const g1 = await fetchUrl(WEBAPP_URL + '?action=guest&code=UA-0FB47E1B');
  const g2 = await fetchUrl(WEBAPP_URL + '?action=guest&code=UA-96126527');
  console.log('Ignacio live:', JSON.stringify(g1.guest, null, 2));
  console.log('Tiffany live:', JSON.stringify(g2.guest, null, 2));

  console.log('\n5. Verificando estadísticas finales de la sala...');
  const statsRes = await fetchUrl(WEBAPP_URL + '?action=adminStats');
  console.log('📊 Estadísticas en vivo:', JSON.stringify(statsRes.stats, null, 2));
}

confirmIgnacioAndTiffany().catch(console.error);
