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

async function expireAllPending() {
  console.log('1. Obteniendo lista completa de invitados desde el backend...');
  const resList = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = resList.guests || [];

  const pendingGuests = guests.filter(g => (g.status || '').toLowerCase() === 'pendiente' || !g.status);
  console.log(`🔍 Total de invitados en estado 'Pendiente' encontrados: ${pendingGuests.length}`);

  if (pendingGuests.length === 0) {
    console.log('✅ No hay ningún invitado en estado Pendiente.');
    return;
  }

  console.log('\n2. Cambiando estado de los pendientes a "Expirado"...');
  let count = 0;
  for (const g of pendingGuests) {
    count++;
    console.log(`[${count}/${pendingGuests.length}] Expirando ${g.name} (${g.code})...`);
    await postUpdate('updateGuest', {
      code: g.code,
      name: g.name || '',
      email: g.email || '',
      status: 'Expirado'
    });
  }

  console.log('\n3. Ejecutando actualización global y sincronización...');
  await postUpdate('actualizarTodo', {});
  await postUpdate('syncSheet', {});

  console.log('\n4. Verificando estadísticas finales...');
  const statsRes = await fetchUrl(WEBAPP_URL + '?action=adminStats');
  console.log('Estadísticas en vivo:', JSON.stringify(statsRes.stats, null, 2));
}

expireAllPending().catch(console.error);
