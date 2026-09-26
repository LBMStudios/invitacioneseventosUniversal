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
    // Usamos el endpoint updateGuest vía GET/POST
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
  console.log('1. Obteniendo lista actual de invitados...');
  const res = await getJSON(`${BACKEND_URL}?action=adminList`);
  const guests = res.guests || [];
  console.log(`Total invitados en base: ${guests.length}`);

  // Lista de códigos a confirmar
  const toConfirm = [
    // 7 Titulares ASESP
    { code: 'UA-52679693', name: 'Nestor Conde', email: 'nconde@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-2435229D', name: 'Angela Hoffman', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-545CE8E9', name: 'Monica Naumis', email: 'mnaumis@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-122C9852', name: 'Lucy Hernandez', email: 'lhernandez@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-28AA4CC5', name: 'Sandra Perroni', email: 'sperroni@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-A6AB1B32', name: 'Gina De Bellis', email: 'gdebellis@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-B1897516', name: 'Alberto Yaffe', email: 'ayaffe@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },

    // 5 Vendedores Extra ASESP
    { code: 'UA-0FCEEBD4', name: 'Vendedor ASESP 1', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-4CE920D4', name: 'Vendedor ASESP 2', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-7CE55BF3', name: 'Vendedor ASESP 3', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-CBE13BD1', name: 'Vendedor ASESP 4', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },
    { code: 'UA-CDE2DE15', name: 'Vendedor ASESP 5', email: 'ahoffmann@asesp.com.uy', agency: 'ASOC ESPAÑOLA' },

    // CASMU (Nadia + 4 extras)
    { code: 'UA-7247AA09', name: 'Nadia Nuñez', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-83DDD797', name: 'Vendedor CASMU 1', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-B5D7339C', name: 'Vendedor CASMU 2', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-80F1E857', name: 'Vendedor CASMU 3', email: 'ca72787@casmu.com', agency: 'CASMU' },
    { code: 'UA-9676D063', name: 'Vendedor CASMU 4', email: 'ca72787@casmu.com', agency: 'CASMU' }
  ];

  console.log(`\n2. Confirmando ${toConfirm.length} invitados en Google Sheets...`);

  for (const item of toConfirm) {
    const existing = guests.find(g => g.code === item.code);
    const payload = {
      code: item.code,
      name: existing?.name || item.name,
      email: existing?.email || item.email,
      phone: existing?.phone || '',
      companionName: existing?.companionName || '',
      agency: existing?.agency || item.agency,
      channel: existing?.channel || 'SALUD',
      referent: existing?.referent || 'AM/MT',
      stage: existing?.stage || '1er Envío'
    };

    console.log(`-> Actualizando ${payload.code} (${payload.name})...`);
    const updateRes = await postUpdate(payload);
    console.log(`   Resultado:`, updateRes);
    await new Promise(r => setTimeout(r, 600)); // Evitar rate-limits
  }

  // Asegurar que el código alternativo de Angela UA-DDC44D12 también exista o apunte
  console.log('\n3. Creando/asegurando código alternativo UA-DDC44D12 para Angela Hoffman...');
  const angelaAlt = await postUpdate({
    code: 'UA-DDC44D12',
    name: 'Angela Hoffman',
    email: 'ahoffmann@asesp.com.uy',
    agency: 'ASOC ESPAÑOLA',
    channel: 'SALUD',
    referent: 'AM/MT',
    stage: '1er Envío'
  });
  console.log('   Resultado código alternativo Angela:', angelaAlt);

  console.log('\n4. Regenerando reportes y sincronización...');
  const regenRes = await getJSON(`${BACKEND_URL}?action=actualizarTodo`);
  console.log('   ActualizarTodo resultado:', regenRes);

  console.log('\n🎉 ¡TODOS LOS INVITADOS DE ASESP Y CASMU QUEDARON CONFIRMADOS EXITOSAMENTE!');
}

run().catch(console.error);
