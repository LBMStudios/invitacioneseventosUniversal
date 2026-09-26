const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function postUpdate(action, params) {
  return new Promise((resolve, reject) => {
    const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
    https.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function fixParentRows() {
  console.log('Limpiando emails concatenados en filas padre...');
  
  await postUpdate('updateGuest', {
    code: 'UA-54B6157A',
    name: 'Gustavo "Tato" Pereira',
    email: 'gustavo.pereira@activetravel.com.uy'
  });
  
  await postUpdate('updateGuest', {
    code: 'UA-20BF4480',
    name: 'Gabriela Conti',
    email: 'gconti@coit.com.uy'
  });

  await postUpdate('updateGuest', {
    code: 'UA-96126539',
    name: 'Mario Etchesure',
    email: 'mario@conosurviajes.uy'
  });

  await postUpdate('updateGuest', {
    code: 'UA-EE21309F',
    name: 'Ivanna',
    email: 'ivanna@mercurioviajes.com.uy'
  });

  await postUpdate('updateGuest', {
    code: 'UA-A6276382',
    name: 'Adriana Rumbos',
    email: 'adriana@rumbosturismo.com'
  });

  await postUpdate('updateGuest', {
    code: 'UA-96126540',
    name: 'Carolina Schultz',
    email: 'carolina.schultz@vyt.com.uy'
  });

  console.log('✅ Filas padre normalizadas!');
  await postUpdate('actualizarTodo', {});
}

fixParentRows();
