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

async function deduplicateAndSync() {
  console.log('1. Obteniendo lista en vivo...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const allGuests = data.guests || [];

  // Encontramos los duplicados
  const seenCodes = new Set();
  const duplicateIndices = [];

  allGuests.forEach((g, idx) => {
    const code = (g.code || '').trim();
    if (seenCodes.has(code)) {
      duplicateIndices.push({ idx: idx + 2, code: code, name: g.name, status: g.status }); // idx+2 por fila de sheets
    } else {
      seenCodes.add(code);
    }
  });

  console.log('Duplicados a unificar en la hoja:', duplicateIndices);

  // Llamamos a Apps Script para eliminar filas duplicadas
  // Agregamos un endpoint temporal o ejecutamos la eliminación
}

deduplicateAndSync().catch(console.error);
