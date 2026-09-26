const https = require('https');

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getJSON(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function postUpdate(guestData) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      action: 'updateGuest',
      code: guestData.code,
      name: guestData.name || '',
      email: guestData.email || '',
      phone: guestData.phone || '',
      status: 'Confirmado',
      companion: 'Sí',
      companionName: guestData.companionName || '',
      totalSeats: '2',
      stage: '1er Envío',
      channel: 'SALUD',
      agency: guestData.agency,
      referent: 'AM/MT'
    });

    const fullUrl = `${BACKEND_URL}?${params.toString()}`;
    https.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const toConfirm = [
    { code: 'UA-EA4466E3', name: 'Angela Hoffman', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-7F32096A', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-CD352D0E', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-A955F58F', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-681A0C32', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-406AA17F', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },

    { code: 'UA-F6E0D95B', name: 'Nadia Nuñez', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-C8F229E5', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-BDA52115', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-5FB09F50', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-545E5986', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' }
  ];

  console.log('Confirmando códigos activos de ASESP y CASMU...');
  for (const item of toConfirm) {
    const res = await postUpdate(item);
    console.log(`-> ${item.code} (${item.name}):`, res);
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('Sincronizando...');
  const resSync = await getJSON(`${BACKEND_URL}?action=actualizarTodo`);
  console.log('Sincronización:', resSync);
}

run().catch(console.error);
