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

async function runFix() {
  console.log('1. Cargando la base de datos local...');
  const guests = JSON.parse(fs.readFileSync('Base_Invitados_Agencias_UA.json', 'utf8'));
  console.log(`Total registros: ${guests.length}`);

  // Modificar Ignacio Vidal y Tiffany Herrera a Confirmado
  let fixedCount = 0;
  guests.forEach(g => {
    if (g.code === 'UA-0FB47E1B' || g.code === 'UA-96126527') {
      g.status = 'Confirmado';
      g.companion = 'Sí';
      g.totalSeats = 2;
      fixedCount++;
      console.log(`✅ ${g.name} (${g.code}) modificado a Confirmado con acompañante ${g.companionName}`);
    }
  });

  console.log(`\n2. Mapeando las ${guests.length} filas exactas para Google Sheets...`);
  const rows = guests.map(g => [
    g.code,                                              // A: Código
    g.name || 'Invitado',                                // B: Nombre
    g.email || '',                                       // C: Email
    g.phone || '',                                       // D: Teléfono
    g.status || 'Expirado',                              // E: Estado
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
  ]);

  console.log('3. Guardando base de datos completa en Google Sheets vía restoreMasterDatabase...');
  const postRes = await sendPost(WEBAPP_URL + '?action=restoreMasterDatabase', JSON.stringify(rows));
  console.log('Resultado restoreMasterDatabase:', postRes);

  console.log('\n4. Forzando sincronización global...');
  await fetchUrl(WEBAPP_URL + '?action=actualizarTodo');
  await fetchUrl(WEBAPP_URL + '?action=syncSheet');

  console.log('\n5. Verificando estadísticas finales...');
  const statsRes = await fetchUrl(WEBAPP_URL + '?action=adminStats');
  console.log('📊 Estadísticas en vivo:', JSON.stringify(statsRes.stats, null, 2));
}

runFix().catch(console.error);
