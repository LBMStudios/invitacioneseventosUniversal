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

async function addMariaJose() {
  console.log('1. Creando invitación para María José Sensión (COSEM)...');
  const addRes = await postUpdate('addGuest', {
    name: 'María José Sensión',
    email: ''
  });
  console.log('addGuest response:', addRes);

  const code = addRes.code || addRes.guestCode;
  if (!code) {
    console.error('No se obtuvo código de invitado');
    return;
  }

  console.log(`\n2. Actualizando datos de ${code} con 2 cupos (doble) para COSEM...`);
  const updateRes = await postUpdate('updateGuest', {
    code: code,
    name: 'María José Sensión',
    email: '',
    phone: '',
    companion: 'Sí',
    companionName: '',
    totalSeats: 2,
    agency: 'COSEM',
    channel: 'SALUD',
    referent: 'AM/MT',
    status: 'Pendiente'
  });
  console.log('updateGuest response:', updateRes);

  console.log('\n3. Ejecutando Sincronización Completa (actualizarTodo)...');
  const syncRes = await postUpdate('actualizarTodo', {});
  console.log('actualizarTodo response:', syncRes);

  const inviteUrl = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${code}`;
  console.log('\n=============================================');
  console.log('🎉 ¡INVITACIÓN REGISTRADA CON ÉXITO!');
  console.log(`Titular: María José Sensión`);
  console.log(`Empresa: COSEM`);
  console.log(`Cupos Asignados: 2 personas (Doble: Titular + Acompañante)`);
  console.log(`Código VIP: ${code}`);
  console.log(`Link: ${inviteUrl}`);
  console.log('=============================================');
}

addMariaJose();
