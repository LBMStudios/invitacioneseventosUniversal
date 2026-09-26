const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const newGuests = [
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

async function addGuestRecord(item) {
  // 1. Agregar invitado basico
  const addUrl = `${WEBAPP_URL}?action=addGuest&name=${encodeURIComponent(item.name)}&email=`;
  const resAdd = await fetch(addUrl);
  const dataAdd = await resAdd.json();
  
  if (!dataAdd.ok || !dataAdd.code) {
    console.error(`❌ Error creando ${item.name}:`, dataAdd);
    return;
  }

  const code = dataAdd.code;

  // 2. Actualizar metadata (agencia, asientos, stage)
  const updateUrl = `${WEBAPP_URL}?action=updateGuest&code=${encodeURIComponent(code)}&name=${encodeURIComponent(item.name)}&agency=${encodeURIComponent(item.agency)}&totalSeats=${item.seats}&stage=${encodeURIComponent('2do Envío')}&email=`;
  await fetch(updateUrl);
  
  console.log(`✅ Creado: [${code}] ${item.name} | Agencia: ${item.agency} | Asientos: ${item.seats}`);
}

async function main() {
  console.log(`🚀 Añadiendo ${newGuests.length} nuevos invitados a la base de datos...\n`);
  for (let i = 0; i < newGuests.length; i++) {
    await addGuestRecord(newGuests[i]);
  }
  console.log('\n✨ ¡Todos los invitados han sido agregados correctamente!');
}

main().catch(console.error);
