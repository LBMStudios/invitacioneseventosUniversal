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
  const codes = [
    // Códigos de ASESP enviados por Marianna
    { code: 'UA-0D9CB9D1', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-F264FA49', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-AB5F31F5', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-35B91EE9', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-B36F0809', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-DDC44D12', name: 'Angela Hoffman', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-2435229D', name: 'Angela Hoffman', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-EA4466E3', name: 'Angela Hoffman', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },

    // Códigos de CASMU
    { code: 'UA-8F23F9C7', name: 'Nadia Nuñez', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-A4BB6932', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-AC652B40', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-F46A82A6', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-9CF6443E', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-F6E0D95B', name: 'Nadia Nuñez', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-C8F229E5', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-BDA52115', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-5FB09F50', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-545E5986', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' }
  ];

  console.log('Registrando y confirmando todos los códigos enviados...');
  for (const item of codes) {
    const res = await postUpdate(item);
    console.log(`-> ${item.code} (${item.name}):`, res);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('Limpiando caché...');
  await getJSON(`${BACKEND_URL}?action=actualizarTodo`);

  console.log('\nVerificando UA-0D9CB9D1...');
  const test0D = await getJSON(`${BACKEND_URL}?action=guest&code=UA-0D9CB9D1`);
  console.log('Resultado UA-0D9CB9D1:', test0D);
}

run().catch(console.error);
