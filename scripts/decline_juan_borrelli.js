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
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function declineJuanBorrelli() {
  console.log('1. Buscando registro de Juan Borrelli...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const jsonStr = raw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(jsonStr);

  const guests = data.guests || [];
  const matches = guests.filter(g => {
    const n = (g.name || '').toLowerCase();
    const e = (g.email || '').toLowerCase();
    return n.includes('borrel') || n.includes('borrelli') || e.includes('borrelli');
  });

  console.log(`Coincidencias encontradas: ${matches.length}`);
  matches.forEach(m => {
    console.log(`  - Código: ${m.code} | Nombre: ${m.name} | Estado actual: ${m.status} | Butacas: ${m.totalSeats} | Acomp: ${m.companionName || 'Ninguno'}`);
  });

  if (matches.length === 0) {
    console.log('No se encontró a Juan Borrelli.');
    return;
  }

  for (const target of matches) {
    console.log(`\n2. Actualizando a '${target.name}' (${target.code}) a 'No asiste'...`);
    const params = new URLSearchParams({
      action: 'updateGuest',
      code: target.code,
      name: target.name,
      email: target.email || '',
      phone: target.phone || '',
      status: 'No asiste',
      companion: 'No',
      companionName: target.companionName || '',
      totalSeats: target.totalSeats || '2',
      stage: target.stage || '1er Envío',
      channel: target.channel || 'SALUD',
      agency: target.agency || 'SEMM',
      referent: target.referent || 'UA'
    });

    const updateRes = await fetchUrl(`${WEBAPP_URL}?${params.toString()}`);
    console.log('Respuesta actualización:', updateRes);
  }

  console.log('\n3. Forzando actualización de caché y reportes...');
  await fetchUrl(`${WEBAPP_URL}?action=actualizarTodo`);

  console.log('\n4. Verificando estado actualizado en vivo...');
  const verifyRaw = await fetchUrl(`${WEBAPP_URL}?action=adminList&callback=cb`);
  const verifyData = JSON.parse(verifyRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const vGuests = verifyData.guests || [];

  const juanUpdated = vGuests.find(g => matches.some(m => m.code === g.code));
  console.log(`\nEstado final de Juan Borrelli:`, juanUpdated ? `${juanUpdated.name} -> ${juanUpdated.status}` : 'No encontrado');

  const conf = vGuests.filter(g => (g.status || '').trim() === 'Confirmado');
  const seats = conf.reduce((sum, g) => sum + (Number(g.totalSeats) || 1), 0);
  console.log(`\n📊 NUEVO TOTAL DE CONFIRMADOS EN VIVO: ${conf.length} personas (${seats} butacas)`);
}

declineJuanBorrelli().catch(console.error);
