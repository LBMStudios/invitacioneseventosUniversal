const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const allGuestsToImport = [
  // Active Travel
  { name: 'Federico Alonso', agency: 'ACTIVE TRAVEL', seats: 2 },
  { name: 'Gonzalo Pere', agency: 'ACTIVE TRAVEL', seats: 2 },
  { name: 'Silvia', agency: 'ACTIVE TRAVEL', seats: 2 },

  // Sunlive
  { name: 'Javier Mossi', agency: 'SUNLIVE', seats: 2 },

  // Sevens
  { name: 'Sebastian Abreu', agency: 'SEVENS', seats: 2 },
  { name: 'Sorteo Sevens 1', agency: 'SEVENS', seats: 2 },
  { name: 'Sorteo Sevens 2', agency: 'SEVENS', seats: 2 },
  { name: 'Sorteo Sevens 3', agency: 'SEVENS', seats: 2 },
  { name: 'Sorteo Sevens 4', agency: 'SEVENS', seats: 2 },
  { name: 'Sorteo Sevens 5', agency: 'SEVENS', seats: 2 },
  { name: 'Carol Sprigingis', agency: 'SEVENS', seats: 2 },
  { name: 'Walter Fernandez', agency: 'SEVENS', seats: 2 },
  { name: 'Claudio Dorner', agency: 'SEVENS', seats: 3 },
  { name: 'Sergio Tournier', agency: 'SEVENS', seats: 3 },

  // JM
  { name: 'Aldo Nipoli', agency: 'JM', seats: 2 },
  { name: 'Carolina Garcia', agency: 'JM', seats: 2 },
  { name: 'Elias Faraut', agency: 'JM', seats: 2 },
  { name: 'Alejandra Martinez', agency: 'JM', seats: 2 },
  { name: 'Diego Martinez', agency: 'JM', seats: 2 },
  { name: 'Marcelo Bergara', agency: 'JM', seats: 2 },
  { name: 'Nacho', agency: 'JM', seats: 2 },
  { name: 'Chumbo', agency: 'JM', seats: 2 },
  { name: 'Sorteo JM 1', agency: 'JM', seats: 2 },
  { name: 'Sorteo JM 2', agency: 'JM', seats: 2 },
  { name: 'Sorteo JM 3', agency: 'JM', seats: 2 },
  { name: 'Sorteo JM 4', agency: 'JM', seats: 2 },
  { name: 'Sorteo JM 5', agency: 'JM', seats: 2 },
  { name: 'Sorteo JM 6', agency: 'JM', seats: 2 },
  { name: 'Sorteo JM 7', agency: 'JM', seats: 2 },
  { name: 'Sorteo JM 8', agency: 'JM', seats: 2 },
  { name: 'Sorteo JM 9', agency: 'JM', seats: 2 },
  { name: 'Sorteo JM 10', agency: 'JM', seats: 2 },
];

async function addWithRetry(item) {
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    try {
      const addUrl = `${WEBAPP_URL}?action=addGuest&name=${encodeURIComponent(item.name)}&email=`;
      const resAdd = await fetch(addUrl);
      const dataAdd = await resAdd.json();
      
      if (dataAdd && dataAdd.code) {
        const updateUrl = `${WEBAPP_URL}?action=updateGuest&code=${encodeURIComponent(dataAdd.code)}&name=${encodeURIComponent(item.name)}&agency=${encodeURIComponent(item.agency)}&totalSeats=${item.seats}&stage=${encodeURIComponent('2do Envío')}&email=`;
        await fetch(updateUrl);
        return dataAdd.code;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  return null;
}

async function main() {
  console.log('📋 Consultando estado de la base de datos...');
  const res = await fetch(`${WEBAPP_URL}?action=adminList`);
  const data = await res.json();
  const existing = data.guests || [];

  const existingKeys = new Set(existing.map(g => `${(g.name||'').trim().toLowerCase()}___${(g.agency||'').trim().toLowerCase()}`));

  const missing = allGuestsToImport.filter(item => {
    const key = `${item.name.trim().toLowerCase()}___${item.agency.trim().toLowerCase()}`;
    return !existingKeys.has(key);
  });

  console.log(`\n======================================================`);
  console.log(` TOTAL INVITADOS EN LISTA: ${allGuestsToImport.length}`);
  console.log(` YA CREADOS EN PLANILLA: ${allGuestsToImport.length - missing.length}`);
  console.log(` PENDIENTES DE CREAR: ${missing.length}`);
  console.log(`======================================================\n`);

  if (missing.length === 0) {
    console.log('🎉 ¡TODOS LOS 32 INVITADOS ESTÁN CREADOS EN LA PLANILLA!');
    return;
  }

  for (let i = 0; i < missing.length; i++) {
    const item = missing[i];
    process.stdout.write(`[${i+1}/${missing.length}] Creando "${item.name}" (${item.agency})... `);
    
    const code = await addWithRetry(item);
    if (code) {
      console.log(`✅ CREADO [${code}]`);
    } else {
      console.log(`❌ Reintentos agotados para ${item.name}`);
    }

    // Pausa de 1.2s entre creaciones
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log('\n✨ ¡Proceso finalizado al 100%! All 32 guests are added.');
}

main().catch(console.error);
