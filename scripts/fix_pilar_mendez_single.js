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

async function fixPilarMendez() {
  console.log('1. Actualizando a Pilar Méndez (UA-98620530) a 1 solo pase (va sola)...');
  const resUpdate = await postUpdate('updateGuest', {
    code: 'UA-98620530',
    name: 'Pilar Méndez',
    phone: '093588680',
    status: 'Confirmado',
    companion: 'No',
    companionName: '',
    totalSeats: 1
  });
  console.log('Resultado actualización:', resUpdate);

  console.log('\n2. Sincronizando sistema y reportes (actualizarTodo + syncSheet)...');
  await postUpdate('actualizarTodo', {});
  await postUpdate('syncSheet', {});

  console.log('\n3. Verificando datos live de Pilar Méndez...');
  const g = await fetchUrl(WEBAPP_URL + '?action=guest&code=UA-98620530');
  console.log('Pilar Méndez live:', JSON.stringify(g.guest, null, 2));

  console.log('\n4. Verificando estadísticas finales...');
  const statsRes = await fetchUrl(WEBAPP_URL + '?action=adminStats');
  console.log('📊 Estadísticas en vivo:', JSON.stringify(statsRes.stats, null, 2));
}

fixPilarMendez().catch(console.error);
