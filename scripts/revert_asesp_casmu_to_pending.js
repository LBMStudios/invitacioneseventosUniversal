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
      status: 'Pendiente',
      companion: 'Sí',
      companionName: '',
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
  const toPending = [
    // 12 ASESP
    { code: 'UA-52679693', name: 'Nestor Conde', email: 'nconde@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-41617516', name: 'Angela Hoffman', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-2435229D', name: 'Angela Hoffman', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-545CE8E9', name: 'Monica Naumis', email: 'mnaumis@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-122C9852', name: 'Lucy Hernandez', email: 'lhernandez@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-28AA4CC5', name: 'Sandra Perroni', email: 'sperroni@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-A6AB1B32', name: 'Gina De Bellis', email: 'egdebellis@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-B1897516', name: 'Alberto Yaffe', email: 'ayaffe@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-13E4E7E0', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-9502C047', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-27459629', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-B4F7AF40', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-25D1CAD0', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },

    // 5 CASMU
    { code: 'UA-8F23F9C7', name: 'Nadia Nuñez', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-A4BB6932', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-AC652B40', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-F46A82A6', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-9CF6443E', name: 'Extra Vendedor', email: 'ca72787@casmu.com', agency: 'CASMU' }
  ];

  console.log(`Reestableciendo ${toPending.length} pases a 'Pendiente'...`);
  for (const item of toPending) {
    const res = await postUpdate(item);
    console.log(`-> ${item.code} (${item.name}):`, res);
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\nSincronizando y regenerando reporte...');
  const regen = await getJSON(`${BACKEND_URL}?action=actualizarTodo`);
  console.log('Resultado sincronización:', regen);
  console.log('\n¡Pases reestablecidos a Pendiente para que los completen ellos mismos!');
}

run().catch(console.error);
