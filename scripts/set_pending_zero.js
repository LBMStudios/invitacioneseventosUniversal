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

async function setAllPendingToZero() {
  console.log('1. Obteniendo todos los invitados pendientes...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const list = res.guests || [];
  const pending = list.filter(g => (g.status || 'Pendiente') === 'Pendiente');
  
  console.log(`Encontrados exactamente ${pending.length} pendientes.`);

  async function expireOne(g) {
    try {
      await postUpdate('updateGuest', {
        code: g.code,
        name: g.name,
        email: g.email || '',
        phone: g.phone || '',
        agency: g.agency || '',
        channel: g.channel || '',
        referent: g.referent || '',
        totalSeats: g.totalSeats || 2,
        companion: g.companion || 'No',
        companionName: g.companionName || '',
        status: 'Expirado'
      });
    } catch (e) {
      console.error('Error expirando ' + g.code + ':', e.message);
    }
  }

  const CONCURRENCY = 10;
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const chunk = pending.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(g => expireOne(g)));
    console.log(`Progreso: ${Math.min(i + CONCURRENCY, pending.length)} / ${pending.length}...`);
  }

  console.log('\n2. Sincronizando caché en Google Sheets...');
  const sync = await postUpdate('actualizarTodo', {});
  console.log('Sync result:', sync);

  console.log('\n3. Verificando estadísticas finales...');
  const statsRes = await fetchUrl(WEBAPP_URL + '?action=adminStats');
  console.log('Nuevas estadísticas:', statsRes.stats);
}

setAllPendingToZero();
