const https = require('https');
const fs = require('fs');

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

async function runExact() {
  console.log('1. Cargando pendientes de Base_Invitados_Agencias_UA.json...');
  const guests = JSON.parse(fs.readFileSync('Base_Invitados_Agencias_UA.json', 'utf8'));
  const pend = guests.filter(g => (g.status || '').toLowerCase() === 'pendiente' || !g.status);
  console.log(`Encontrados ${pend.length} pendientes exactos.`);

  console.log('2. Expirando los 41 pendientes en paralelo...');
  const chunkSize = 10;
  for (let i = 0; i < pend.length; i += chunkSize) {
    const chunk = pend.slice(i, i + chunkSize);
    await Promise.all(chunk.map(g => {
      console.log(` Expirando ${g.name} (${g.code})...`);
      return getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(g.code)}&status=Expirado`);
    }));
  }

  console.log('\n3. Sincronizando base y reportes...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');

  console.log('\n4. Verificando stats finales...');
  const statsRes = await getJSON(WEBAPP_URL + '?action=adminStats');
  console.log('STATS FINALES:', JSON.stringify(statsRes.stats, null, 2));
}

runExact().catch(console.error);
