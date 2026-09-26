const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const queryNames = [
  'Caro Thomas',
  'Flor Costanzo',
  'Lucha Coitiño',
  'Vale Olivera',
  'Camila walch',
  'Heliana Molina',
  'Anaclara Arrieta',
  'Victoria de Souza',
  'Helena Haller',
  'guadalupe placeres',
  'laura da silva',
  'Belén gallo',
  'carli Varela',
  'Amparo Schelotto',
  'Sofi Giammarchi',
  'Mateo Parafita',
  'Mathias Batto',
  'Karina Vargas',
  'Ayelén Álvarez',
  'Rodrigo Ferrari',
  'Jorge Brun'
];

function normalize(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

async function main() {
  console.log('Descargando lista actual de invitados...');
  const r = await fetch(WEBAPP_URL + '?action=adminList');
  const d = await r.json();
  const guests = d.guests || [];
  console.log(`Total invitados en base: ${guests.length}`);

  // Also check if there are guests from Traveloz and Destinico
  console.log('\n--- INVITADOS DE TRAVELOZ / DESTINICO EN LA BASE ---');
  const agencyGuests = guests.filter(g => {
    const ag = normalize(g.agency);
    return ag.includes('traveloz') || ag.includes('destinico');
  });
  console.log(`Encontrados con agencia Traveloz/Destinico: ${agencyGuests.length}`);
  agencyGuests.forEach(g => {
    console.log(`  [${g.code}] ${g.name} | Ag: ${g.agency} | Email: ${g.email} | MailStatus: ${g.mailStatus} | RSVP: ${g.status}`);
  });

  console.log('\n--- BÚSQUEDA UNO A UNO DE LOS 21 ---');
  const matched = [];
  const notFound = [];

  for (let i = 0; i < queryNames.length; i++) {
    const q = queryNames[i];
    const qNorm = normalize(q);
    const qTokens = qNorm.split(/\s+/);
    
    // First try full match
    let matches = guests.filter(g => {
      const gNorm = normalize(g.name);
      return qTokens.every(tok => gNorm.includes(tok));
    });

    // If not found, try last name or first name if long enough
    if (matches.length === 0) {
      matches = guests.filter(g => {
        const gNorm = normalize(g.name);
        return qTokens.some(tok => tok.length >= 4 && gNorm.includes(tok));
      });
    }

    if (matches.length === 0) {
      console.log(`${i+1}. [NO ENCONTRADO] "${q}"`);
      notFound.push(q);
    } else {
      matches.forEach(m => {
        console.log(`${i+1}. [ENCONTRADO] "${q}" -> Code: ${m.code} | Name: ${m.name} | Ag: ${m.agency} | Email: ${m.email} | MailStatus: ${m.mailStatus}`);
        matched.push({ query: q, guest: m });
      });
    }
  }

  console.log(`\nResumen: ${matched.length} matches, ${notFound.length} no encontrados.`);
}

main().catch(console.error);
