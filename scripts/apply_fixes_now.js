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

async function main() {
  console.log('1. Obteniendo datos actuales...');
  const checkRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const clean = checkRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(clean);
  const guests = data.guests || [];

  const monica = guests.find(g => g.code === 'UA-545CE8E9');
  const andreaOriginal = guests.find(g => g.code === 'UA-98620475');

  console.log('Registro actual UA-98620475:', andreaOriginal);
  console.log('Registro actual Mónica Naumis UA-545CE8E9:', monica);

  // 1. Actualizar UA-98620475 con Andrea Silvana Menéndez Martínez y Mateo
  console.log('\n2. Actualizando UA-98620475 a Andrea Silvana Menéndez Martínez (con Mateo)...');
  const updateParams = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-98620475',
    name: 'Andrea Silvana Menéndez Martínez',
    email: andreaOriginal ? (andreaOriginal.email || '') : '',
    phone: andreaOriginal ? (andreaOriginal.phone || '') : '',
    status: 'Confirmado',
    companion: 'Sí',
    companionName: 'Mateo Menéndez Martínez',
    totalSeats: '2',
    stage: andreaOriginal ? (andreaOriginal.stage || '1er Envío') : '1er Envío',
    channel: andreaOriginal ? (andreaOriginal.channel || 'AGENCIA') : 'AGENCIA',
    agency: andreaOriginal ? (andreaOriginal.agency || 'Jorge Martínez') : 'Jorge Martínez',
    referent: andreaOriginal ? (andreaOriginal.referent || 'UA') : 'UA'
  });
  const resAndrea = await fetchUrl(`${WEBAPP_URL}?${updateParams.toString()}`);
  console.log('Resultado Andrea:', resAndrea);

  // 2. Eliminar el código duplicado UA-98620621 si existe
  console.log('\n3. Eliminando código temporal duplicado UA-98620621...');
  const resDel = await fetchUrl(`${WEBAPP_URL}?action=deleteGuest&code=UA-98620621`);
  console.log('Resultado borrado duplicado:', resDel);

  // 3. Marcar a Mónica Naumis (UA-545CE8E9) explícitamente como "No asiste"
  console.log('\n4. Marcando a Mónica Naumis (UA-545CE8E9) como No asiste...');
  const naumisParams = new URLSearchParams({
    action: 'updateGuest',
    code: 'UA-545CE8E9',
    name: monica ? monica.name : 'Monica Naumis',
    email: monica ? (monica.email || 'mnaumis@asesp.com.uy') : 'mnaumis@asesp.com.uy',
    phone: monica ? (monica.phone || '') : '',
    status: 'No asiste',
    companion: 'No',
    companionName: '',
    totalSeats: '2',
    stage: monica ? (monica.stage || '1er Envío') : '1er Envío',
    channel: monica ? (monica.channel || 'SALUD') : 'SALUD',
    agency: monica ? (monica.agency || 'ASOC ESPAÑOLA') : 'ASOC ESPAÑOLA',
    referent: monica ? (monica.referent || 'AM/MT') : 'AM/MT'
  });
  const resNaumis = await fetchUrl(`${WEBAPP_URL}?${naumisParams.toString()}`);
  console.log('Resultado Mónica Naumis:', resNaumis);

  // 4. Verificación final de balances
  console.log('\n5. Verificando estado final...');
  const finalRaw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const finalClean = finalRaw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const finalData = JSON.parse(finalClean);

  const confirmed = (finalData.guests || []).filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  let totalSeats = 0;
  confirmed.forEach(g => totalSeats += (Number(g.totalSeats) || 1));

  console.log(`\n📊 BALANCE FINAL:`);
  console.log(`🎟️ Confirmados: ${confirmed.length} pases | ${totalSeats} butacas ocupadas`);
  console.log(`💺 Butacas Libres en Sala: ${Math.max(300 - totalSeats, 0)} disponibles`);
}

main();
