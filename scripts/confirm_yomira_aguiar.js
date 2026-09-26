const https = require('https');

function fetchUrl(u) {
  return new Promise((resolve, reject) => {
    https.get(u, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔄 Confirmando invitación para Yomira Aguiar (UA-98620596)...');
  
  const updateUrl = `https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=updateGuest` +
    `&code=UA-98620596` +
    `&name=${encodeURIComponent('Yomira Aguiar')}` +
    `&status=${encodeURIComponent('Confirmado')}` +
    `&companion=${encodeURIComponent('Sí')}` +
    `&companionName=${encodeURIComponent('Acompañante de Yomira Aguiar')}` +
    `&totalSeats=2` +
    `&agency=${encodeURIComponent('Batista Viajes')}` +
    `&referent=${encodeURIComponent('Ana Laura Britos')}` +
    `&callback=cb`;

  const raw = await fetchUrl(updateUrl);
  console.log('Respuesta Apps Script:', raw);

  console.log('✅ Yomira Aguiar confirmada con 2 butacas.');
}

main().catch(console.error);
