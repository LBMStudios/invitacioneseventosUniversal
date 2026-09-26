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
  console.log('1. Actualizando a Joel Felder (UA-192EB1CE) a 4 asientos Confirmados...');
  const resJoel = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-192EB1CE&name=${encodeURIComponent('Joel Felder')}&agency=Buemes&referent=${encodeURIComponent('Ana Laura Britos')}&channel=AGENCIA&totalSeats=4&status=Confirmado&companion=${encodeURIComponent('Sí')}&companionName=${encodeURIComponent('3 Acompañantes')}`);
  console.log('Resultado Joel:', resJoel);

  console.log('\n2. Creando/Actualizando a Maximiliano Abreo (UA-7D8E219B) con 4 asientos Confirmados...');
  const resMaxi = await getJSON(WEBAPP_URL + `?action=updateGuest&code=UA-7D8E219B&name=${encodeURIComponent('Maximiliano Abreo')}&agency=Buemes&referent=${encodeURIComponent('Ana Laura Britos')}&channel=AGENCIA&totalSeats=4&status=Confirmado&companion=${encodeURIComponent('Sí')}&companionName=${encodeURIComponent('3 Acompañantes')}`);
  console.log('Resultado Maxi:', resMaxi);

  console.log('\n3. Verificando ambos registros en la base...');
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const found = (data.guests || []).filter(g => g.code === 'UA-192EB1CE' || g.code === 'UA-7D8E219B');
  console.log(JSON.stringify(found, null, 2));
})();
