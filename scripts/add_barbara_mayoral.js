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

async function addBarbara() {
  console.log('1. Creando invitado Bárbara Mayoral...');
  const addRes = await postUpdate('addGuest', {
    name: 'Bárbara Mayoral',
    email: ''
  });
  console.log('addGuest response:', addRes);

  const code = addRes.code || addRes.guestCode;
  if (!code) {
    console.error('No se obtuvo código de invitado');
    return;
  }

  console.log(`\n2. Actualizando datos de ${code} con acompañante Javier D´Elia...`);
  const updateRes = await postUpdate('updateGuest', {
    code: code,
    name: 'Bárbara Mayoral',
    email: '',
    phone: '',
    companion: 'Sí',
    companionName: 'Javier D´Elia',
    totalSeats: 2,
    agency: 'INVITADO ESPECIAL',
    channel: 'MANUAL',
    referent: 'UA',
    status: 'Confirmado'
  });
  console.log('updateGuest response:', updateRes);

  console.log('\n3. Ejecutando Sincronización Completa (actualizarTodo)...');
  const syncRes = await postUpdate('actualizarTodo', {});
  console.log('actualizarTodo response:', syncRes);

  const inviteUrl = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${code}`;
  console.log('\n=============================================');
  console.log('🎉 ¡INVITACIÓN REGISTRADA CON ÉXITO!');
  console.log(`Titular: Bárbara Mayoral`);
  console.log(`Acompañante: Javier D´Elia`);
  console.log(`Lugares: 2 personas`);
  console.log(`Código VIP: ${code}`);
  console.log(`Link: ${inviteUrl}`);
  console.log('=============================================');
}

addBarbara();
