const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
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

function normalize(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

async function auditConfirmed() {
  console.log('Descargando todos los invitados...');
  const res = await fetchUrl(WEBAPP_URL);
  const guests = res.guests || [];
  
  const confirmed = guests.filter(g => g.status === 'Confirmado');
  console.log(`Total confirmados encontrados: ${confirmed.length}`);

  // 1. Detectar duplicados exactos o similares en nombres de titulares
  const nameMap = new Map();
  confirmed.forEach(g => {
    const norm = normalize(g.name);
    if (!nameMap.has(norm)) nameMap.set(norm, []);
    nameMap.get(norm).push(g);
  });

  console.log('\n======================================================');
  console.log('🔍 1. TITULARES CON EL MISMO NOMBRE (DOBLES CONFIRMACIONES)');
  console.log('======================================================');
  let dupCount = 0;
  for (const [name, list] of nameMap.entries()) {
    if (list.length > 1 && name) {
      dupCount++;
      console.log(`⚠️ POSIBLE DUPLICADO: "${name}" (${list.length} registros)`);
      list.forEach(g => {
        console.log(`   • [${g.code}] ${g.name} | Butacas: ${g.totalSeats} | Acomp: "${g.companionName}" | Email: ${g.email} | Agencia: ${g.agency}`);
      });
    }
  }
  if (dupCount === 0) console.log('✅ No hay titulares duplicados por nombre exacto.');

  // 2. Detectar si un titular figura además como acompañante de otro titular
  console.log('\n======================================================');
  console.log('🔍 2. PERSONAS QUE SON TITULAR Y ADEMÁS ACOMPAÑANTE DE OTRO');
  console.log('======================================================');
  let crossCount = 0;
  confirmed.forEach(titular => {
    const titNorm = normalize(titular.name);
    if (!titNorm || titNorm === 'extra vendedor' || titNorm === 'invitado') return;

    confirmed.forEach(other => {
      if (other.code === titular.code) return;
      const compNorm = normalize(other.companionName);
      if (compNorm && compNorm.includes(titNorm)) {
        crossCount++;
        console.log(`⚠️ CRUCE DE BUTACAS: "${titular.name}"`);
        console.log(`   1. Es Titular en: [${titular.code}] ${titular.name} (${titular.totalSeats} butacas, Agencia: ${titular.agency})`);
        console.log(`   2. Figura de Acompañante de: [${other.code}] ${other.name} (Acompañante: "${other.companionName}")`);
      }
    });
  });
  if (crossCount === 0) console.log('✅ No se detectaron cruces de titular-acompañante.');

  // 3. Detectar emails duplicados entre confirmados
  console.log('\n======================================================');
  console.log('🔍 3. EMAILS DUPLICADOS ENTRE CONFIRMADOS');
  console.log('======================================================');
  const emailMap = new Map();
  confirmed.forEach(g => {
    const em = (g.email || '').trim().toLowerCase();
    if (em && em.includes('@')) {
      if (!emailMap.has(em)) emailMap.set(em, []);
      emailMap.get(em).push(g);
    }
  });
  let emailDupCount = 0;
  for (const [em, list] of emailMap.entries()) {
    if (list.length > 1) {
      emailDupCount++;
      console.log(`⚠️ EMAIL REPETIDO: "${em}" (${list.length} pases)`);
      list.forEach(g => {
        console.log(`   • [${g.code}] ${g.name} | Butacas: ${g.totalSeats} | Acomp: "${g.companionName}"`);
      });
    }
  }
  if (emailDupCount === 0) console.log('✅ No hay emails duplicados.');

  // 4. Listado completo de confirmados ordenados alfabéticamente
  console.log('\n======================================================');
  console.log('📋 LISTA COMPLETA ALFABÉTICA DE TODOS LOS CONFIRMADOS');
  console.log('======================================================');
  confirmed.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  let totalSeats = 0;
  confirmed.forEach((g, idx) => {
    const seats = Number(g.totalSeats) || 2;
    totalSeats += seats;
    console.log(`${(idx + 1).toString().padStart(3, ' ')}. [${g.code}] ${g.name.padEnd(30, ' ')} | Butacas: ${seats} | Acomp: "${g.companionName || 'Sin acomp'}" | Agencia: ${g.agency || 'N/A'}`);
  });
  console.log(`\nTOTAL TITULARES: ${confirmed.length} | TOTAL BUTACAS CONFIRMADAS: ${totalSeats}`);
}

auditConfirmed();
