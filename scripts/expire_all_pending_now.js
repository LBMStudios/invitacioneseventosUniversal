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
      res.on('end', () => resolve(data));
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

async function main() {
  console.log('1. Descargando base de datos en vivo...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const jsonStr = raw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(jsonStr);
  
  if (!data.ok || !Array.isArray(data.guests)) {
    console.error('Error al obtener lista:', data);
    process.exit(1);
  }

  const guests = data.guests;
  console.log(`Total invitados obtenidos: ${guests.length}`);

  let pendingCount = 0;
  let confirmedCount = 0;
  let confirmedSeats = 0;

  const rows = guests.map(g => {
    let finalStatus = (g.status || '').trim();

    if (finalStatus === 'Confirmado') {
      confirmedCount++;
      confirmedSeats += Number(g.totalSeats) || 1;
    } else if (finalStatus === 'Pendiente' || !finalStatus) {
      pendingCount++;
      finalStatus = 'Expirado';
    }

    return [
      g.code || '',                                                          // A: Código
      g.name || 'Invitado',                                                  // B: Nombre
      g.email || '',                                                         // C: Email
      g.phone || '',                                                         // D: Teléfono
      finalStatus,                                                           // E: Estado
      g.companion || 'No',                                                   // F: Acompañante
      g.companionName || '',                                                 // G: Nombre Acompañante
      Number(g.totalSeats) || 2,                                             // H: Total Butacas
      g.responseDate || '',                                                  // I: Fecha Respuesta
      g.link || `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}`,  // J: Link
      g.mailStatus || 'Pendiente de envío',                                  // K: Estado Envío
      g.demoCheck || '0',                                                    // L: DEMO
      g.channel || 'AGENCIA',                                                // M: Canal
      g.agency || '',                                                        // N: Agencia
      g.referent || 'UA',                                                    // O: Referente
      g.openedAt || '',                                                      // P: Apertura
      g.stage || '1er Envío'                                                 // Q: Etapa
    ];
  });

  console.log(`\n2. Resumen previo a la actualización:`);
  console.log(`   - Confirmados a preservar: ${confirmedCount} (${confirmedSeats} butacas)`);
  console.log(`   - Pendientes a pasar a Expirado: ${pendingCount}`);

  if (pendingCount === 0) {
    console.log('No hay invitados en estado Pendiente. Nada para cambiar.');
    return;
  }

  console.log(`\n3. Enviando transacción masiva con ${rows.length} filas a Google Sheets...`);
  const payloadStr = JSON.stringify(rows);
  const postResult = await sendPost(WEBAPP_URL + '?action=restoreMasterDatabase', payloadStr);
  console.log('Resultado restoreMasterDatabase:', postResult);

  console.log('\n4. Forzando sincronización global...');
  await fetchUrl(WEBAPP_URL + '?action=actualizarTodo');
  await fetchUrl(WEBAPP_URL + '?action=syncSheet');

  console.log('\n5. Verificando estado final en vivo...');
  const verifyRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const verifyJson = JSON.parse(verifyRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  
  if (verifyJson.ok && Array.isArray(verifyJson.guests)) {
    const vGuests = verifyJson.guests;
    const vConf = vGuests.filter(g => (g.status || '').trim() === 'Confirmado');
    const vPend = vGuests.filter(g => (g.status || '').trim() === 'Pendiente');
    const vExp = vGuests.filter(g => (g.status || '').trim() === 'Expirado');
    const vNo = vGuests.filter(g => (g.status || '').trim() === 'No asiste');
    const vWait = vGuests.filter(g => (g.status || '').trim() === 'Lista de Espera');
    const vSeats = vConf.reduce((s, g) => s + (Number(g.totalSeats) || 1), 0);

    console.log(`\n========================================`);
    console.log(`ESTADO FINAL EN VIVO TRAS EXPIRACIÓN`);
    console.log(`========================================`);
    console.log(`  ✅ Confirmados: ${vConf.length} personas (${vSeats} butacas)`);
    console.log(`  ⏳ Pendientes: ${vPend.length}`);
    console.log(`  ⏰ Expirados: ${vExp.length}`);
    console.log(`  ❌ No asiste: ${vNo.length}`);
    console.log(`  📋 Lista de Espera: ${vWait.length}`);
    console.log(`  TOTAL: ${vGuests.length}`);
  }
}

main().catch(console.error);
