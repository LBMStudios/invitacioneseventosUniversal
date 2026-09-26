const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getJSON(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function expireAllFast() {
  console.log('1. Obteniendo lista de invitados desde el backend...');
  const res = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = res.guests || [];

  const pending = guests.filter(g => (g.status || '').toLowerCase() === 'pendiente' || !g.status);
  console.log(`🔍 Total pendientes a procesar: ${pending.length}`);

  if (pending.length === 0) {
    console.log('🎉 ¡No quedan pendientes!');
  } else {
    console.log('⚡ Procesando en grupos de 10 en paralelo...');
    const chunkSize = 10;
    for (let i = 0; i < pending.length; i += chunkSize) {
      const chunk = pending.slice(i, i + chunkSize);
      console.log(`--- Tanda ${Math.floor(i / chunkSize) + 1} de ${Math.ceil(pending.length / chunkSize)} ---`);
      await Promise.all(chunk.map(g => {
        console.log(` Expirando ${g.name} (${g.code})...`);
        return getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(g.code)}&status=Expirado`);
      }));
    }
  }

  console.log('\n2. Sincronizando base y reportes...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');

  console.log('\n3. Verificando estadísticas finales...');
  const statsRes = await getJSON(WEBAPP_URL + '?action=adminStats');
  console.log('📊 Stats finales en vivo:', JSON.stringify(statsRes.stats, null, 2));
}

expireAllFast().catch(console.error);
