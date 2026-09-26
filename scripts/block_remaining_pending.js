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

// Exceptuar los que recién se pidieron para enviar
const EXCLUDE_CODES = new Set(['UA-98620531', 'UA-98620617']);

async function runBlockRemaining() {
  console.log('1. Consultando lista oficial de Google Sheets...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const list = res.guests || [];
  
  const targets = list.filter(g => {
    const isPending = (g.status || 'Pendiente') === 'Pendiente';
    const isExcluded = EXCLUDE_CODES.has(g.code);
    return isPending && !isExcluded;
  });

  console.log(`\n🎯 Total restantes a BLOQUEAR: ${targets.length}`);

  if (targets.length === 0) {
    console.log('No hay invitados pendientes restantes para bloquear.');
    return;
  }

  console.log('\n2. Ejecutando bloqueo a "Expirado" en Google Sheets...');
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
      if (completed % 20 === 0 || completed === targets.length) {
        console.log(`Progreso: ${completed}/${targets.length} bloqueados (${Math.round((completed / targets.length) * 100)}%)...`);
      }
    } catch (err) {
      console.error(`Error bloqueando a ${g.name} (${g.code}):`, err.message);
    }
  }

  const CONCURRENCY = 8;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const chunk = targets.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(g => blockOne(g)));
  }

  console.log('\n3. Ejecutando Sincronización Completa y Limpieza de Caché (actualizarTodo)...');
  const syncRes = await postUpdate('actualizarTodo', {});
  console.log('actualizarTodo response:', syncRes);

  console.log('\n======================================================');
  console.log(`🎉 ¡TODOS LOS PENDIENTES RESTANTES BLOQUEADOS CON ÉXITO (${targets.length})!`);
  console.log('======================================================');
}

runBlockRemaining();
