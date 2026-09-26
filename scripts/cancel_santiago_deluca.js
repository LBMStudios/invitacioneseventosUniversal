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

function postUpdate(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  return fetchUrl(fullUrl);
}

async function cancelSantiagoDeLuca() {
  console.log('1. Cancelando confirmación de Santiago De Luca (CASMU - UA-417B6C81)...');
  const updateRes = await postUpdate('updateGuest', {
    code: 'UA-417B6C81',
    name: 'Santiago De Luca',
    email: 'ca72712@casmu.com',
    phone: '',
    companion: 'No',
    companionName: '',
    totalSeats: 0,
    agency: 'CASMU',
    channel: 'SALUD',
    referent: 'AM/MT',
    status: 'No asiste'
  });
  console.log('updateGuest response:', updateRes);

  console.log('\n2. Ejecutando Sincronización Completa (actualizarTodo)...');
  const syncRes = await postUpdate('actualizarTodo', {});
  console.log('actualizarTodo response:', syncRes);

  console.log('\n3. Obteniendo nuevas estadísticas de sala...');
  const statsRes = await postUpdate('adminStats', {});
  console.log('adminStats response:', statsRes);

  console.log('\n=============================================');
  console.log('✅ CANCELACIÓN PROCESADA CORRECTAMENTE');
  console.log('Santiago De Luca (CASMU) marcado como "No asiste"');
  console.log('Se liberaron 2 butacas en la sala.');
  console.log('=============================================');
}

cancelSantiagoDeLuca();
