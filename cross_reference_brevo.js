const fs = require('fs');
const XLSX = require('xlsx');

const brevoContacts = JSON.parse(fs.readFileSync('Brevo_Lista_Agencias.json', 'utf8'));
const inviteGuests = JSON.parse(fs.readFileSync('Base_Invitados_Agencias_UA.json', 'utf8'));

// Mapeo exhaustivo de dominios
const DOMAIN_MAP = {
  'jorgemartinez.com.uy': 'Jorge Martínez',
  'libertyuruguay.com.uy': 'Liberty Uruguay',
  'creditravel.net': 'Creditravel',
  'creditravel.com.uy': 'Creditravel',
  'bntours.com': 'BN Tours',
  'activetravel.com.uy': 'Active Travel',
  'mactravel.com.uy': 'Mac Travel',
  'lamana.com.uy': 'La Mana Viajes',
  'sinfronteras.com.uy': 'Sin Fronteras',
  'vyt.com.uy': 'VyT Viajes',
  'delsurviajes.com.uy': 'Del Sur Viajes',
  'novoturismo.com.uy': 'Novo Turismo',
  'rumbosturismo.com': 'Rumbos Turismo',
  'jpsantos.com.uy': 'JP Santos',
  'personaloperadora.com.uy': 'Personal Operadora',
  'travellerviajes.com.uy': 'Traveller Viajes',
  'melitour.com.uy': 'Melitour',
  'azulviajes.com.uy': 'Azul Viajes',
  'mevuelo.com': 'Me Vuelo',
  'campomar.com.uy': 'Campomar Viajes',
  'dcomtravel.com': 'DCOM Travel',
  'e-travels.com.uy': 'E-Travels',
  'viajaconbea.com': 'Viaja con Bea',
  'ventusviajes.com': 'Ventus Viajes',
  'hcviajes.com': 'HC Viajes',
  'cycviajes.com.uy': 'C&C Viajes',
  'anda.com.uy': 'ANDA',
  'emegeviajes.com.uy': 'Emege Viajes',
  'mercurioviajes.com.uy': 'Mercurio Viajes',
  'mercurio.com.uy': 'Mercurio Viajes',
  'traveloz.com.uy': 'Traveloz',
  'destinico.com': 'Destinico',
  'proviajes.com.uy': 'Proviajes',
  'carrascoviajes.com.uy': 'Carrasco Viajes',
  'andamosvolando.com': 'Andamos Volando',
  '321vola.com': '321 Volá',
  'guamatur.com': 'Guamatur',
  'acviajes.com.uy': 'AC Viajes',
  'ceciliaregules.com': 'Cecilia Regules Viajes',
  'horizonttravel.com.uy': 'Horizont Travel',
  'donagustinviajes.com.uy': 'Don Agustín Viajes',
  'experience.com.uy': 'Experience Travel',
  'martindiazturismo.com': 'Martín Díaz Turismo',
  'zafiroviajes.uy': 'Zafiro Viajes',
  'dsviajes.com.uy': 'DS Viajes',
  'ciceroneuruguay.com': 'Cicerone Uruguay',
  'syncroviajes.com': 'Syncro Viajes',
  'coit.com.uy': 'COIT Viajes',
  'conexion-viajes.com': 'Conexión Viajes',
  'globaltours.com.uy': 'Global Tours',
  'adventour.com.uy': 'Adventour',
  'solutionviajes.uy': 'Solution Viajes',
  'consolidtravel.com.uy': 'Consolid Travel',
  'orientalviajes.com.uy': 'Oriental Viajes',
  'turispayviajes.com': 'Turispay Viajes',
  'turispayviqjes.com': 'Turispay Viajes',
  'newtravel.com.uy': 'New Travel',
  'estudiocallorda.com': 'Estudio Callorda',
  'ibizaviajes.com': 'Ibiza Viajes',
  'toctocviajes.com': 'TocToc Viajes',
  'hiperviajes.com.uy': 'HiperViajes',
  'cisplatinauruguay.com': 'Cisplatina Turismo'
};

function deriveCompany(email) {
  const e = (email || '').toLowerCase().trim();
  const domain = e.split('@')[1] || '';
  if (DOMAIN_MAP[domain]) return DOMAIN_MAP[domain];
  if (domain && domain !== 'gmail.com' && domain !== 'hotmail.com' && domain !== 'yahoo.com') {
    const base = domain.split('.')[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  }
  return 'Agencia de Viajes';
}

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Sets e índices de búsqueda
const inviteEmails = new Map();
const inviteNames = new Map();

inviteGuests.forEach(g => {
  if (g.email) {
    g.email.split(/[,;]/).forEach(e => {
      const clean = e.trim().toLowerCase();
      if (clean && clean.includes('@')) {
        inviteEmails.set(clean, g);
      }
    });
  }
  if (g.name) {
    inviteNames.set(norm(g.name), g);
  }
});

const faltantes = [];
const yaInvitados = [];

brevoContacts.forEach(bc => {
  const email = (bc.email || '').trim().toLowerCase();
  const nom = (bc.attributes && bc.attributes.NOMBRE ? String(bc.attributes.NOMBRE).trim() : '');
  const ape = (bc.attributes && bc.attributes.APELLIDOS ? String(bc.attributes.APELLIDOS).trim() : '');
  const fullName = (nom || ape) ? `${nom} ${ape}`.trim() : '';
  const cleanPhone = bc.attributes && bc.attributes.SMS ? (String(bc.attributes.SMS).startsWith('598') ? '0' + String(bc.attributes.SMS).slice(3) : String(bc.attributes.SMS)) : '';
  const empresa = deriveCompany(email);

  let match = null;
  let matchType = '';

  // 1. Coincidencia por Email
  if (email && inviteEmails.has(email)) {
    match = inviteEmails.get(email);
    matchType = 'Email exacto';
  } 
  // 2. Coincidencia por Nombre
  else if (fullName) {
    const n = norm(fullName);
    if (inviteNames.has(n)) {
      match = inviteNames.get(n);
      matchType = 'Nombre exacto';
    } else {
      // Buscar similitud de nombre
      for (const [invN, invG] of inviteNames.entries()) {
        if ((n.length > 6 && invN.includes(n)) || (invN.length > 6 && n.includes(invN))) {
          match = invG;
          matchType = 'Nombre similar';
          break;
        }
      }
    }
  }

  if (match) {
    yaInvitados.push({
      nombreBrevo: fullName || email.split('@')[0],
      empresa,
      emailBrevo: email,
      telefono: cleanPhone,
      codigoPase: match.code,
      nombreEnPase: match.name,
      estadoRSVP: match.status,
      coincidencia: matchType
    });
  } else {
    faltantes.push({
      nombre: fullName || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      empresa,
      email,
      telefono: cleanPhone,
      idBrevo: bc.id
    });
  }
});

// Ordenar alfabéticamente
faltantes.sort((a, b) => a.empresa.localeCompare(b.empresa, 'es') || a.nombre.localeCompare(b.nombre, 'es'));
yaInvitados.sort((a, b) => a.empresa.localeCompare(b.empresa, 'es') || a.nombreBrevo.localeCompare(b.nombreBrevo, 'es'));

console.log('═══════════════════════════════════════════════════════════════');
console.log(`📊 TOTAL CONTACTOS EN BREVO (AGENCIAS): ${brevoContacts.length}`);
console.log(`✅ YA TIENEN INVITACIÓN / EN LA BASE:   ${yaInvitados.length}`);
console.log(`⚠️  FALTANTES (En Brevo pero SIN pase):  ${faltantes.length}`);
console.log('═══════════════════════════════════════════════════════════════');

// Generar Excel con 2 pestañas: "Faltantes por Validar" y "Ya Invitados"
const wb = XLSX.utils.book_new();

const wsFaltantes = XLSX.utils.json_to_sheet(faltantes.map(f => ({
  'Nombre': f.nombre,
  'Empresa / Agencia': f.empresa,
  'Email': f.email,
  'Teléfono / WhatsApp': f.telefono,
  'ID Brevo': f.idBrevo
})));
wsFaltantes['!cols'] = [{ wch: 30 }, { wch: 26 }, { wch: 36 }, { wch: 22 }, { wch: 12 }];

const wsYaInvitados = XLSX.utils.json_to_sheet(yaInvitados.map(y => ({
  'Nombre Brevo': y.nombreBrevo,
  'Empresa / Agencia': y.empresa,
  'Email': y.emailBrevo,
  'Código Pase UA': y.codigoPase,
  'Nombre en Invitación': y.nombreEnPase,
  'Estado RSVP': y.estadoRSVP,
  'Tipo Coincidencia': y.coincidencia
})));
wsYaInvitados['!cols'] = [{ wch: 28 }, { wch: 24 }, { wch: 34 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 18 }];

XLSX.utils.book_append_sheet(wb, wsFaltantes, 'Faltantes por Validar');
XLSX.utils.book_append_sheet(wb, wsYaInvitados, 'Ya Tienen Invitación');

const excelPath = 'Cruce_Brevo_vs_Invitaciones.xlsx';
XLSX.writeFile(wb, excelPath);

console.log(`\n📄 Archivo Excel generado: ${excelPath}`);

// Guardar JSON para análisis
fs.writeFileSync('faltantes_brevo.json', JSON.stringify(faltantes, null, 2), 'utf8');
