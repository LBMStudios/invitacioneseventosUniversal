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

(async () => {
  console.log('1. Buscando a todos los invitados de SEVENS...');
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = data.guests || [];

  const sevens = guests.filter(g => {
    const txt = (g.agency + ' ' + g.channel + ' ' + g.referent + ' ' + g.name).toUpperCase();
    return txt.includes('SEVENS');
  });

  console.log(`Encontrados ${sevens.length} invitados de SEVENS.`);

  const codes = sevens.map(g => g.code);
  console.log('Códigos a eliminar:', codes.join(', '));

  console.log('\n2. Eliminando invitados de SEVENS de la base de datos...');
  const res = await getJSON(WEBAPP_URL + `?action=bulkDelete&codes=${encodeURIComponent(codes.join(','))}`);
  console.log('Resultado de bulkDelete:', res);

  console.log('\n3. Verificando estado final de la base...');
  const verifyData = await getJSON(WEBAPP_URL + '?action=adminList');
  const remaining = (verifyData.guests || []).filter(g => {
    const txt = (g.agency + ' ' + g.channel + ' ' + g.referent + ' ' + g.name).toUpperCase();
    return txt.includes('SEVENS');
  });
  console.log(`Invitados de SEVENS restantes: ${remaining.length}`);
  console.log(`Total invitados actuales en la base: ${(verifyData.guests || []).length}`);
})();
