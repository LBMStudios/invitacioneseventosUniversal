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

function postData(url, data) {
  return new Promise((resolve, reject) => {
    const postBody = JSON.stringify(data);
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(postData(res.headers.location, data));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(postBody);
    req.end();
  });
}

async function run() {
  console.log('1. Obteniendo lista completa de invitados...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = res.guests || [];
  console.log(`Total invitados: ${guests.length}`);

  // Preparar las 448 filas exactas para Google Sheets
  const rows = guests.map(g => {
    let finalStatus = g.status || 'Expirado';
    if (finalStatus !== 'Confirmado' && finalStatus !== 'No asiste' && finalStatus !== 'Lista de Espera') {
      finalStatus = 'Expirado';
    }

    return [
      g.code,                                              // A: Código
      g.name || 'Invitado',                                // B: Nombre
      g.email || '',                                       // C: Email
      g.phone || '',                                       // D: Teléfono
      finalStatus,                                         // E: Estado (Confirmado, No asiste, Lista de Espera o Expirado)
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

  console.log('\n2. Escribiendo la base oficial con 0 pendientes en 1 sola transacción...');
  const postRes = await postData(WEBAPP_URL + '?action=restoreMasterDatabase', rows);
  console.log('Resultado restoreMasterDatabase:', postRes);

  console.log('\n3. Consultando estadísticas actualizadas...');
  const statsRes = await fetchUrl(WEBAPP_URL + '?action=adminStats');
  console.log('Nuevas estadísticas:', statsRes.stats);
}

run();
