const fs = require('fs');
const https = require('https');
const xlsx = require('xlsx');

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

async function runBlockSentPending() {
  console.log('1. Consultando lista oficial de Google Sheets...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const list = res.guests || [];
  console.log(`Total invitados en base: ${list.length}`);

  // Filtrar ÚNICAMENTE: Estado = Pendiente Y Estado Envío contiene "Enviado"
  const targets = list.filter(g => {
    const isPending = (g.status || 'Pendiente') === 'Pendiente';
    const isSent = (g.mailStatus || '').toLowerCase().includes('enviado');
    return isPending && isSent;
  });

  console.log(`\n🎯 Total invitados a BLOQUEAR (Pendientes con email enviado): ${targets.length}`);

  if (targets.length === 0) {
    console.log('No hay invitados pendientes con email enviado para bloquear.');
    return;
  }

  console.log('\n2. Ejecutando bloqueo en Google Sheets (cambio a "Expirado")...');
  let completed = 0;

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
      completed++;
      if (completed % 15 === 0 || completed === targets.length) {
        console.log(`Progreso: ${completed}/${targets.length} bloqueados (${Math.round((completed / targets.length) * 100)}%)...`);
      }
    } catch (err) {
      console.error(`Error bloqueando a ${g.name} (${g.code}):`, err.message);
    }
  }

  // Concurrencia de 8 hilos para rapidez
  const CONCURRENCY = 8;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const chunk = targets.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(g => blockOne(g)));
  }

  console.log('\n3. Ejecutando Sincronización Completa y Limpieza de Caché (actualizarTodo)...');
  const syncRes = await postUpdate('actualizarTodo', {});
  console.log('actualizarTodo response:', syncRes);

  console.log('\n4. Generando planillas de registro con los invitados bloqueados...');
  const exportRows = targets.map((g, idx) => ({
    '#': idx + 1,
    'Código VIP': g.code,
    'Nombre': g.name,
    'Email': g.email || '',
    'Teléfono': g.phone || '',
    'Agencia / Empresa': g.agency || '',
    'Canal': g.channel || '',
    'Estado Anterior': 'Pendiente',
    'Nuevo Estado': 'Expirado',
    'Estado Envío': g.mailStatus || 'Enviado',
    'Link Bloqueado': g.link || ('https://ua-eventos-uy.web.app/coyote-vs-acme?i=' + g.code)
  }));

  // XLSX
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(exportRows);
  xlsx.utils.book_append_sheet(wb, ws, 'Invitaciones_Expiradas');
  xlsx.writeFile(wb, 'Lista_Invitaciones_Bloqueadas_Expiradas.xlsx');

  // CSV
  const header = ['#', 'Código VIP', 'Nombre', 'Email', 'Teléfono', 'Agencia / Empresa', 'Canal', 'Nuevo Estado', 'Estado Envío', 'Link Bloqueado'].map(h => `"${h}"`).join(';');
  const lines = exportRows.map(r => [
    r['#'],
    `"${r['Código VIP']}"`,
    `"${r['Nombre']}"`,
    `"${r['Email']}"`,
    `"${r['Teléfono']}"`,
    `"${r['Agencia / Empresa']}"`,
    `"${r['Canal']}"`,
    `"${r['Nuevo Estado']}"`,
    `"${r['Estado Envío']}"`,
    `"${r['Link Bloqueado']}"`
  ].join(';'));
  fs.writeFileSync('Lista_Invitaciones_Bloqueadas_Expiradas.csv', [header, ...lines].join('\n'), 'utf8');

  console.log('\n======================================================');
  console.log(`🎉 ¡PROCESO COMPLETADO! ${targets.length} INVITACIONES BLOQUEADAS.`);
  console.log('Archivos generados:');
  console.log('• Lista_Invitaciones_Bloqueadas_Expiradas.xlsx');
  console.log('• Lista_Invitaciones_Bloqueadas_Expiradas.csv');
  console.log('======================================================');
}

runBlockSentPending();
