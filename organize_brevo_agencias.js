const fs = require('fs');

const contacts = JSON.parse(fs.readFileSync('Brevo_Lista_Agencias.json', 'utf8'));

// Mapeo exhaustivo de dominios y emails a nombres de empresa/agencia
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

const SPECIFIC_EMAILS = {
  'vipturismouruguay@gmail.com': 'VIP Turismo',
  'ventasvipturismo@gmail.com': 'VIP Turismo',
  'ventas1.sommainternacional@gmail.com': 'Somma Internacional',
  'turismodelsur2015@hotmail.com': 'Turismo del Sur',
  'mneyraviajesyturismo@gmail.com': 'Martín Neyra Viajes',
  'turismovivirviajando@gmail.com': 'Vivir Viajando',
  'nrumbos@adinet.com.uy': 'Rumbos Turismo',
  'nrumbos@vera.com.uy': 'Rumbos Turismo',
  'gabriel.bonavita.gb@gmail.com': 'Bonavita Viajes',
  'nicoruiz123@gmail.com': 'Ruiz Viajes'
};

function deriveCompany(email, attrs) {
  const e = (email || '').toLowerCase().trim();
  if (SPECIFIC_EMAILS[e]) return SPECIFIC_EMAILS[e];
  
  const domain = e.split('@')[1] || '';
  if (DOMAIN_MAP[domain]) return DOMAIN_MAP[domain];

  // Si no está en mapa, derivar nombre limpio del dominio o email
  if (domain && domain !== 'gmail.com' && domain !== 'hotmail.com' && domain !== 'yahoo.com') {
    const base = domain.split('.')[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  }
  return 'Agencia de Viajes';
}

function cleanName(attrs, email) {
  const nom = (attrs && attrs.NOMBRE ? String(attrs.NOMBRE).trim() : '');
  const ape = (attrs && attrs.APELLIDOS ? String(attrs.APELLIDOS).trim() : '');
  
  let full = `${nom} ${ape}`.trim();
  if (full) return full;

  // Si no tiene nombre registrado en Brevo, usar prefijo de email
  const prefix = (email || '').split('@')[0] || 'Contacto';
  return prefix.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function cleanPhone(attrs) {
  const sms = attrs && attrs.SMS ? String(attrs.SMS).trim() : '';
  if (!sms) return '';
  if (sms.startsWith('598')) {
    return '0' + sms.slice(3);
  }
  return sms;
}

const cleanedContacts = contacts.map(c => {
  const email = (c.email || '').trim();
  const nombre = cleanName(c.attributes, email);
  const empresa = deriveCompany(email, c.attributes);
  const telefono = cleanPhone(c.attributes);

  return {
    nombre,
    empresa,
    email,
    telefono,
    idBrevo: c.id
  };
});

// Ordenar alfabéticamente por Nombre Completo
cleanedContacts.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

// Generar CSV ordenado
const headers = ['Nombre Completo', 'Empresa / Agencia', 'Email', 'Teléfono / WhatsApp', 'ID Brevo'];

function esc(val) {
  if (val === null || val === undefined) return '""';
  const s = String(val).replace(/"/g, '""');
  return '"' + s + '"';
}

const rows = cleanedContacts.map(c => [
  esc(c.nombre),
  esc(c.empresa),
  esc(c.email),
  esc(c.telefono),
  esc(c.idBrevo)
].join(','));

const csvContent = '\uFEFF' + [headers.map(h => esc(h)).join(','), ...rows].join('\r\n');

// Guardar archivos
fs.writeFileSync('Brevo_Lista_Agencias.csv', csvContent, 'utf8');
fs.writeFileSync('Brevo_Lista_Agencias_Organizada.csv', csvContent, 'utf8');

console.log(`✅ Base de datos organizada con éxito: ${cleanedContacts.length} contactos.`);
console.log('📄 Archivos generados: Brevo_Lista_Agencias.csv y Brevo_Lista_Agencias_Organizada.csv');
