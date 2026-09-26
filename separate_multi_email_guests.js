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

async function runSeparation() {
  console.log('1. Consultando lista actual...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = Array.isArray(res.guests) ? res.guests : (Array.isArray(res) ? res : []);

  console.log('Total registros:', guests.length);

  // Definir las separaciones exactas
  const separations = [
    {
      originalCode: 'UA-EBE42DF6',
      keep: {
        code: 'UA-EBE42DF6',
        name: 'Ivanna',
        email: 'ivanna@mercurioviajes.com.uy',
        agency: 'MERCURIO VIAJES',
        channel: 'AGENCIA',
        referent: 'AB',
        totalSeats: 2,
        status: 'Pendiente'
      },
      addNew: [
        { name: 'Bettina', email: 'bettina@mercurioviajes.com.uy', agency: 'MERCURIO VIAJES', channel: 'AGENCIA', referent: 'AB', seats: 2 },
        { name: 'Jorgelina', email: 'jorgelina@mercurioviajes.com.uy', agency: 'MERCURIO VIAJES', channel: 'AGENCIA', referent: 'AB', seats: 2 },
        { name: 'Tatiana', email: 'tatiana@mercurioviajes.com.uy', agency: 'MERCURIO VIAJES', channel: 'AGENCIA', referent: 'AB', seats: 2 }
      ]
    },
    {
      originalCode: 'UA-B446CF90',
      keep: {
        code: 'UA-B446CF90',
        name: 'Gabriela Conti',
        email: 'gconti@coit.com.uy',
        agency: 'COIT',
        channel: 'AGENCIA',
        referent: 'AB',
        totalSeats: 2,
        status: 'Pendiente'
      },
      addNew: [
        { name: 'J. Leone', email: 'jleone@coit.com.uy', agency: 'COIT', channel: 'AGENCIA', referent: 'AB', seats: 2 }
      ]
    },
    {
      originalCode: 'UA-C32522A0',
      keep: {
        code: 'UA-C32522A0',
        name: 'Mario Etchesure',
        email: 'mario@conosurviajes.uy',
        agency: 'CONOSUR',
        channel: 'AGENCIA',
        referent: 'AB',
        totalSeats: 2,
        status: 'Pendiente'
      },
      addNew: [
        { name: 'Javier Fernández Goñi', email: 'javier@conosurviajes.uy', agency: 'CONOSUR', channel: 'AGENCIA', referent: 'AB', seats: 2 }
      ]
    },
    {
      originalCode: 'UA-7B747EF4',
      keep: {
        code: 'UA-7B747EF4',
        name: 'Adriana Rumbos',
        email: 'adriana@rumbosturismo.com',
        agency: 'RUMBOS',
        channel: 'AGENCIA',
        referent: 'AB',
        totalSeats: 1,
        status: 'Pendiente'
      },
      addNew: [
        { name: 'Alejandro', email: 'alejandro@rumbosturismo.com', agency: 'RUMBOS', channel: 'AGENCIA', referent: 'AB', seats: 1 },
        { name: 'Virginia', email: 'virginia@rumbosturismo.com', agency: 'RUMBOS', channel: 'AGENCIA', referent: 'AB', seats: 1 }
      ]
    },
    {
      originalCode: 'UA-6BE7E6D4',
      keep: {
        code: 'UA-6BE7E6D4',
        name: 'Gustavo Pereira',
        email: 'gustavo.pereira@activetravel.com.uy',
        agency: 'ACTIVE TRAVEL',
        channel: 'AGENCIA',
        referent: 'AB',
        totalSeats: 2,
        status: 'Pendiente'
      },
      addNew: [
        { name: 'Gonzalo Pereira', email: 'gonzalo.pere@activetravel.com.uy', agency: 'ACTIVE TRAVEL', channel: 'AGENCIA', referent: 'AB', seats: 2 },
        { name: 'Federico Alonso', email: 'federico.alonso@activetravel.com.uy', agency: 'ACTIVE TRAVEL', channel: 'AGENCIA', referent: 'AB', seats: 2 }
      ]
    },
    {
      originalCode: 'UA-96126440',
      keep: {
        code: 'UA-96126440',
        name: 'Carolina Schultz',
        email: 'carolina.schultz@vyt.com.uy',
        agency: 'V Y T',
        channel: 'AGENCIA',
        referent: 'AB',
        totalSeats: 2,
        status: 'Pendiente'
      },
      addNew: [
        { name: 'Alejandro Perciavalle', email: 'alejandro.perciavalle@vyt.com.uy', agency: 'V Y T', channel: 'AGENCIA', referent: 'AB', seats: 2 }
      ]
    }
  ];

  console.log('\n2. Actualizando filas originales y agregando nuevos invitados individuales...');

  for (const item of separations) {
    console.log(`\n🔹 Procesando ${item.originalCode} (${item.keep.name})...`);
    // 1. Actualizar la fila original
    const updateRes = await postUpdate('updateGuest', {
      code: item.keep.code,
      name: item.keep.name,
      email: item.keep.email,
      agency: item.keep.agency,
      channel: item.keep.channel,
      referent: item.keep.referent,
      totalSeats: item.keep.totalSeats,
      status: item.keep.status
    });
    console.log(`   ✅ Actualizada fila original: ${item.keep.name} <${item.keep.email}>`);

    // 2. Agregar los nuevos
    for (const add of item.addNew) {
      const addRes = await postUpdate('addGuest', {
        name: add.name,
        email: add.email
      });
      console.log(`   ➕ Agregado nuevo: ${add.name} <${add.email}> -> Código: ${addRes.code || 'generado'}`);

      // Actualizar metadata de agencia y referente en el nuevo
      if (addRes.code) {
        await postUpdate('updateGuest', {
          code: addRes.code,
          name: add.name,
          email: add.email,
          agency: add.agency,
          channel: add.channel,
          referent: add.referent,
          totalSeats: add.seats,
          status: 'Pendiente'
        });
      }
    }
  }

  console.log('\n3. Ejecutando Sincronización Completa para regenerar links y reportes...');
  await postUpdate('actualizarTodo', {});
  console.log('✅ PROCESO DE SEPARACIÓN COMPLETADO CON ÉXITO');
}

runSeparation();
