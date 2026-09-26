const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getJSON(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function run() {
  const codesToDecline = [
    { code: 'UA-54B6157A', name: 'Gustavo Tato Pereira' },
    { code: 'UA-6BE7E6D4', name: 'Gustavo Pereira' },
    { code: 'UA-406B080E', name: 'Tato Pereira' },
    { code: 'UA-FFFA0728', name: 'Pereira Tato' },
    { code: 'UA-96126535', name: 'Gonzalo Pereira' },
    { code: 'UA-341D7B34', name: 'Gonzalo Peré' }
  ];

  console.log('1. Pasando a "No asiste" los registros de Tato Pereira y Gonzalo Peré...');
  for (const item of codesToDecline) {
    const res = await getJSON(WEBAPP_URL + `?action=updateGuest&code=${encodeURIComponent(item.code)}&status=No%20asiste&companion=No&companionName=&totalSeats=0`);
    console.log(`✅ ${item.name} [${item.code}]:`, res.ok ? 'Actualizado a No asiste' : res);
  }

  console.log('\n2. Sincronizando reportes y caché...');
  await getJSON(WEBAPP_URL + '?action=actualizarTodo');
  await getJSON(WEBAPP_URL + '?action=syncSheet');

  console.log('\n🎉 Registros de Active Travel actualizados correctamente.');
}

run().catch(console.error);
