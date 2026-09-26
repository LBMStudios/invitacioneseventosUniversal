const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

async function callApi(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  const res = await fetch(fullUrl);
  try {
    return await res.json();
  } catch (e) {
    return {};
  }
}

async function main() {
  console.log('🔧 Finalizando restauración de confirmados...');

  // 1. Confirmar Elisa Costa (UA-4750D43B) con 3 cupos
  console.log('Actualizando Elisa Costa (UA-4750D43B) a Confirmado (3 cupos)...');
  await callApi('updateGuest', {
    code: 'UA-4750D43B',
    name: 'Elisa Costa',
    email: 'elisa.costa@cosem.com.uy',
    totalSeats: 3,
    companion: 'Sí',
    companionName: 'Acompañantes',
    status: 'Confirmado',
    agency: 'COSEM',
    channel: 'SALUD',
    referent: 'AM/MT'
  });

  // 2. Eliminar códigos pendientes duplicados de Laura Caprio y Sandra Perroni
  const codesToDelete = [
    'UA-23641B5E', // Laura Caprio Pendiente duplicado (la confirmada es UA-DF9F77B2)
    'UA-28AA4CC5'  // Sandra Perroni Pendiente duplicado (la confirmada es UA-D88A84A6)
  ];

  for (const code of codesToDelete) {
    console.log(`🗑️ Eliminando código duplicado pendiente: ${code}...`);
    await callApi('deleteGuest', { code: code });
  }

  // 3. Sincronizar y actualizar reportes
  console.log('🔄 Sincronizando base y reportes...');
  await callApi('actualizarTodo', {});

  // 4. Descargar base actualizada
  console.log('📥 Descargando base actualizada...');
  const resListUpdated = await callApi('adminList', {});
  const allGuests = resListUpdated.guests || [];

  const confirmed = allGuests.filter(g => g.status === 'Confirmado');
  console.log(`\n🎉 Total Confirmados en el sistema: ${confirmed.length}`);
  
  const targetGuests = allGuests.filter(g => 
    (g.name && (g.name.includes('Laura Caprio') || g.name.includes('Elisa Costa') || g.name.includes('Sandra Perroni')))
  );

  console.log('\n=== ESTADO FINAL DE LOS CASOS ===');
  targetGuests.forEach(g => {
    console.log(`• ${g.name} [${g.code}]: Estado=${g.status}, Cupos=${g.totalSeats}, Acomp="${g.companionName || 'Ninguno'}", Link=${g.link}`);
  });
}

main().catch(console.error);
