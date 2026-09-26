const https = require('https');
const fs = require('fs');

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

function sendPost(url, payloadString) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString)
      }
    }, (res) => {
      // Si redirecciona (302/303), Apps Script ya ejecutó el código. Seguimos el redirect con GET.
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(payloadString);
    req.end();
  });
}

async function runBulkExpire() {
  console.log('1. Cargando la base de datos oficial...');
  const resList = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = resList.guests || [];
  console.log(`Total invitados obtenidos: ${guests.length}`);

  let changedCount = 0;
  const rows = guests.map(g => {
    let finalStatus = g.status || 'Expirado';
    if (finalStatus !== 'Confirmado' && finalStatus !== 'No asiste' && finalStatus !== 'Lista de Espera') {
      if (finalStatus === 'Pendiente' || !finalStatus) {
        changedCount++;
      }
      finalStatus = 'Expirado';
    }

    return [
      g.code,                                              // A: Código
      g.name || 'Invitado',                                // B: Nombre
      g.email || '',                                       // C: Email
      g.phone || '',                                       // D: Teléfono
      finalStatus,                                         // E: Estado
      g.companion || 'No',                                 // F: Acompañante
      g.companionName || '',                               // G: Nombre Acompañante
      Number(g.totalSeats) || 2,                           // H: Total Butacas
      g.responseDate || '',                                // I: Fecha Respuesta
      g.link || `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}`, // J: Link
      g.mailStatus || 'Pendiente de envío',                // K: Estado Envío
      g.demoCheck || '0',                                  // L: DEMO
      g.channel || 'AGENCIA',                              // M: Canal
      g.agency || '',                                      // N: Agencia
      g.referent || 'UA',                                  // O: Referente
      g.openedAt || '',                                    // P: Apertura
      g.stage || '1er Envío'                               // Q: Etapa
    ];
  });

  console.log(`2. Cambiando ${changedCount} invitados de 'Pendiente' a 'Expirado'...`);
  const payloadStr = JSON.stringify(rows);
  console.log(`3. Enviando transacción masiva de ${rows.length} filas a Google Sheets...`);
  
  const postResult = await sendPost(WEBAPP_URL + '?action=restoreMasterDatabase', payloadStr);
  console.log('Resultado transacción:', postResult);

  console.log('\n4. Forzando sincronización global...');
  await fetchUrl(WEBAPP_URL + '?action=actualizarTodo');
  await fetchUrl(WEBAPP_URL + '?action=syncSheet');

  console.log('\n5. Verificando estadísticas finales en vivo...');
  const statsRes = await fetchUrl(WEBAPP_URL + '?action=adminStats');
  console.log('📊 ESTADÍSTICAS EN VIVO:', JSON.stringify(statsRes.stats, null, 2));
}

runBulkExpire().catch(console.error);
