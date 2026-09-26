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
      stage: guestData.stage || '1er Envío',
      channel: guestData.channel || 'SALUD',
      agency: guestData.agency || '',
      referent: guestData.referent || 'AM/MT'
    });

    const fullUrl = `${BACKEND_URL}?${params.toString()}`;
    https.get(fullUrl, (res) => {
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

async function run() {
  const asespExtras = [
    { code: 'UA-F264FA49', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-AB5F31F5', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-0D9CB9D1', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-35B91EE9', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-B36F0809', name: 'Extra Vendedor', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-DDC44D12', name: 'Angela Hoffman', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' }
  ];

  console.log('Confirmando 5 extras de ASESP y código alternativo de Angela...');
  for (const item of asespExtras) {
    const res = await postUpdate(item);
    console.log(`-> ${item.code} (${item.name}):`, res);
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('Sincronizando y regenerando reporte...');
  const regen = await getJSON(`${BACKEND_URL}?action=actualizarTodo`);
  console.log('Resultado sincronización:', regen);
}

run().catch(console.error);
