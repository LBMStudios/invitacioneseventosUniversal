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

async function fixMercurio() {
  console.log('1. Consultando filas actuales...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = Array.isArray(res.guests) ? res.guests : (Array.isArray(res) ? res : []);
  
  const mercurio = guests.filter(g => 
    (g.agency || '').toUpperCase().includes('MERCURIO') || 
    (g.email || '').toLowerCase().includes('mercurio') || 
    (g.name || '').toLowerCase().includes('ivan') ||
    (g.name || '').toLowerCase().includes('bettina') ||
    (g.name || '').toLowerCase().includes('tatiana')
  );
  
  console.log('Filas encontradas en Mercurio / Ivana:');
  mercurio.forEach(g => console.log(`[${g.code}] ${g.name} -> <${g.email}>`));

  // 1. A Ivanna/Ivana le ponemos ivanna@mercurioviajes.com.uy
  for (const g of mercurio) {
    if ((g.name || '').toLowerCase().includes('ivan')) {
      console.log(`\nActualizando ${g.code} (${g.name}) con email: ivanna@mercurioviajes.com.uy...`);
      await postUpdate('updateGuest', {
        code: g.code,
        name: 'Ivanna',
        email: 'ivanna@mercurioviajes.com.uy',
        agency: 'MERCURIO VIAJES',
        channel: 'AGENCIA',
        referent: 'AB',
        totalSeats: g.totalSeats || 2,
        status: g.status || 'Pendiente'
      });
    }
  }

  // 2. Verificamos si Bettina existe como fila individual con bettina@mercurioviajes.com.uy
  const hasBettina = guests.some(g => 
    (g.email || '').toLowerCase() === 'bettina@mercurioviajes.com.uy' && 
    !(g.name || '').toLowerCase().includes('ivan')
  );

  if (!hasBettina) {
    console.log('\nCreando fila individual para Bettina <bettina@mercurioviajes.com.uy>...');
    const addRes = await postUpdate('addGuest', { name: 'Bettina', email: 'bettina@mercurioviajes.com.uy' });
    if (addRes.code) {
      await postUpdate('updateGuest', {
        code: addRes.code,
        name: 'Bettina',
        email: 'bettina@mercurioviajes.com.uy',
        agency: 'MERCURIO VIAJES',
        channel: 'AGENCIA',
        referent: 'AB',
        totalSeats: 2,
        status: 'Pendiente'
      });
    }
  } else {
    console.log('\nBettina ya existe con su email propio.');
  }

  console.log('\n2. Verificando estado final de Mercurio Viajes...');
  const resFinal = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guestsFinal = Array.isArray(resFinal.guests) ? resFinal.guests : (Array.isArray(resFinal) ? resFinal : []);
  const mercurioFinal = guestsFinal.filter(g => 
    (g.agency || '').toUpperCase().includes('MERCURIO') || 
    (g.email || '').toLowerCase().includes('mercurio') || 
    (g.name || '').toLowerCase().includes('ivan')
  );

  mercurioFinal.forEach(g => console.log(`✅ [${g.code}] ${g.name} -> <${g.email}>`));
}

fixMercurio();
