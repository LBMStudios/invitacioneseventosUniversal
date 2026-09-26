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

async function lockAllPublic() {
  console.log('1. Obteniendo toda la base oficial...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const list = res.guests || [];
  
  // Bloquear a TODOS los que no estén en Confirmado o No asiste
  const toLock = list.filter(g => (g.status || 'Pendiente') === 'Pendiente');

  console.log(`\n🎯 Bloqueando de forma absoluta ${toLock.length} invitaciones restantes a "Expirado"...`);

  let count = 0;
  async function blockOne(g) {
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
      count++;
    } catch (e) {
      console.error('Error:', e.message);
    }
  }

  const CONCURRENCY = 10;
  for (let i = 0; i < toLock.length; i += CONCURRENCY) {
    const chunk = toLock.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(g => blockOne(g)));
    console.log(`Progreso: ${Math.min(i + CONCURRENCY, toLock.length)} / ${toLock.length}...`);
  }

  console.log('\n2. Sincronizando y purgando caché en Google Sheets...');
  await postUpdate('actualizarTodo', {});

  console.log('\n======================================================');
  console.log('🔒 BLOQUEO TOTAL COMPLETADO.');
  console.log('Nadie puede inscribirse por su cuenta desde ningún enlace.');
  console.log('Solo vos podés confirmar o agregar desde el Panel Admin o Google Sheets.');
  console.log('======================================================');
}

lockAllPublic();
