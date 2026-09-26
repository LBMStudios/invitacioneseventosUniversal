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

async function expireAllPendingParallel() {
  console.log('1. Obteniendo lista completa de invitados...');
  const resList = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = resList.guests || [];

  const pendingGuests = guests.filter(g => (g.status || '').toLowerCase() === 'pendiente' || !g.status);
  console.log(`🔍 Invitados en estado 'Pendiente' por expiración: ${pendingGuests.length}`);

  if (pendingGuests.length === 0) {
    console.log('✅ ¡Todos los pendientes ya están expirados!');
  } else {
    console.log(`⚡ Procesando ${pendingGuests.length} en paralelo...`);
    const chunkSize = 10;
    for (let i = 0; i < pendingGuests.length; i += chunkSize) {
      const chunk = pendingGuests.slice(i, i + chunkSize);
      await Promise.all(chunk.map(g => {
        console.log(`   -> Expirando ${g.name} (${g.code})...`);
        return postUpdate('updateGuest', {
          code: g.code,
          name: g.name || '',
          email: g.email || '',
          status: 'Expirado'
        });
      }));
    }
  }

  console.log('\n2. Ejecutando sync global (actualizarTodo y syncSheet)...');
  await postUpdate('actualizarTodo', {});
  await postUpdate('syncSheet', {});

  console.log('\n3. Verificando estadísticas finales...');
  const statsRes = await fetchUrl(WEBAPP_URL + '?action=adminStats');
  console.log('📊 ESTADÍSTICAS EN VIVO:', JSON.stringify(statsRes.stats, null, 2));
}

expireAllPendingParallel().catch(console.error);
