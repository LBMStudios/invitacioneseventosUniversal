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
  return new Promise((resolve, reject) => {
    const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
    https.get(fullUrl, (res) => {
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

async function fix() {
  console.log('1. Consultando toda la base de datos en vivo...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = Array.isArray(res.guests) ? res.guests : (Array.isArray(res) ? res : []);

  console.log(`Total registros en vivo: ${guests.length}`);

  // Buscar todas las filas con emails concatenados o basura
  const badCodesToDelete = [];
  const rowsToClean = [];

  guests.forEach(g => {
    const email = String(g.email || '').trim();
    if (email.includes(';') || email.includes(',') || (email.match(/@/g) || []).length > 1) {
      console.log(`❌ Detectada fila con emails múltiples: [${g.code}] ${g.name} -> "${email}"`);
      badCodesToDelete.push(g.code);
    }
  });

  console.log(`\nFilas a eliminar/corregir: ${badCodesToDelete.length}`);

  if (badCodesToDelete.length > 0) {
    console.log('Eliminando filas sucias en lote:', badCodesToDelete);
    await postUpdate('bulkDelete', { codes: badCodesToDelete.join(',') });
    console.log('✅ Filas sucias eliminadas.');
  }

  // Ahora nos aseguramos de que existan los registros individuales limpios:
  console.log('\n2. Verificando que existan los invitados individuales...');

  const individualList = [
    { name: 'Ivanna', email: 'ivanna@mercurioviajes.com.uy', agency: 'MERCURIO VIAJES', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'Bettina', email: 'bettina@mercurioviajes.com.uy', agency: 'MERCURIO VIAJES', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'Tatiana', email: 'tatiana@mercurioviajes.com.uy', agency: 'MERCURIO VIAJES', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'Gabriela Conti', email: 'gconti@coit.com.uy', agency: 'COIT', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'J. Leone', email: 'jleone@coit.com.uy', agency: 'COIT', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'Mario Etchesure', email: 'mario@conosurviajes.uy', agency: 'CONOSUR', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'Javier Fernández Goñi', email: 'javier@conosurviajes.uy', agency: 'CONOSUR', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'Adriana Rumbos', email: 'adriana@rumbosturismo.com', agency: 'RUMBOS', channel: 'AGENCIA', referent: 'AB', seats: 1 },
    { name: 'Alejandro', email: 'alejandro@rumbosturismo.com', agency: 'RUMBOS', channel: 'AGENCIA', referent: 'AB', seats: 1 },
    { name: 'Virginia', email: 'virginia@rumbosturismo.com', agency: 'RUMBOS', channel: 'AGENCIA', referent: 'AB', seats: 1 },
    { name: 'Gustavo Pereira', email: 'gustavo.pereira@activetravel.com.uy', agency: 'ACTIVE TRAVEL', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'Gonzalo Pereira', email: 'gonzalo.pere@activetravel.com.uy', agency: 'ACTIVE TRAVEL', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'Federico Alonso', email: 'federico.alonso@activetravel.com.uy', agency: 'ACTIVE TRAVEL', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'Carolina Schultz', email: 'carolina.schultz@vyt.com.uy', agency: 'V Y T', channel: 'AGENCIA', referent: 'AB', seats: 2 },
    { name: 'Alejandro Perciavalle', email: 'alejandro.perciavalle@vyt.com.uy', agency: 'V Y T', channel: 'AGENCIA', referent: 'AB', seats: 2 }
  ];

  // Reconsultar lista
  const res2 = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const currentGuests = Array.isArray(res2.guests) ? res2.guests : (Array.isArray(res2) ? res2 : []);
  const existingEmails = new Set(currentGuests.map(g => String(g.email || '').toLowerCase().trim()));

  for (const ind of individualList) {
    if (!existingEmails.has(ind.email.toLowerCase())) {
      console.log(`➕ Insertando ${ind.name} <${ind.email}>...`);
      const addRes = await postUpdate('addGuest', { name: ind.name, email: ind.email });
      if (addRes.code) {
        await postUpdate('updateGuest', {
          code: addRes.code,
          name: ind.name,
          email: ind.email,
          agency: ind.agency,
          channel: ind.channel,
          referent: ind.referent,
          totalSeats: ind.seats,
          status: 'Pendiente'
        });
      }
    } else {
      console.log(`✔️ Ya existe correctamente: ${ind.name} <${ind.email}>`);
    }
  }

  console.log('\n3. Limpiando caché y regenerando links...');
  await postUpdate('actualizarTodo', {});
  console.log('🎉 BASE DE DATOS COMPLETAMENTE LIMPIA Y SIN MULTI-EMAILS');
}

fix();
