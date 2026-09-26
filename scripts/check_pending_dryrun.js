const https = require('https');
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function cleanEmail(raw) {
  if (!raw) return '';
  const matches = String(raw).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return '';
  return [...new Set(matches.map(e => e.trim().toLowerCase()))].join(',');
}

async function getGuestData() {
  const res = await fetch(`${WEBAPP_URL}?action=adminList`);
  const text = await res.text();
  return JSON.parse(text);
}

async function main() {
  console.log('📋 Consultando base de datos oficial...');
  const data = await getGuestData();
  const guests = data.guests || [];
  
  console.log(`Total invitados registrados en la base: ${guests.length}`);
  
  const pending = guests.filter(g => {
    const ms = (g.mailStatus || '').trim();
    const email = cleanEmail(g.email);
    const hasValidEmail = email && email.includes('@') && email.toUpperCase().indexOf('NO TENGO') < 0 && email.toUpperCase().indexOf('SIN MAIL') < 0;
    const notSent = ms.indexOf('Enviado') < 0 && ms.indexOf('enviad') < 0 && ms.indexOf('Abierto') < 0 && ms.indexOf('Entregado') < 0 && ms.indexOf('Correo enviado') < 0;
    return hasValidEmail && notSent;
  });

  const byStage = {};
  pending.forEach(g => {
    const st = g.stage || 'Sin Etapa';
    if (!byStage[st]) byStage[st] = [];
    byStage[st].push(g);
  });

  console.log(`\n======================================================`);
  console.log(` TOTAL PENDIENTES CON MAIL VÁLIDO: ${pending.length}`);
  console.log(`======================================================\n`);

  console.log('📊 DESGLOSE POR ETAPA / TANDA:');
  for (const [stageName, list] of Object.entries(byStage)) {
    console.log(`  • ${stageName}: ${list.length} pendiente(s)`);
  }

  console.log('\n📋 LISTADO DETALLADO DE LOS ' + pending.length + ' INVITADOS PENDIENTES:');
  pending.forEach((g, i) => {
    const mailFormatted = cleanEmail(g.email);
    console.log(`  ${i+1}. [${g.code}] ${g.name} | Etapa: ${g.stage || 'N/A'} | Empresa/Agencia: ${g.agency || g.channel || 'N/A'} | Mail: ${mailFormatted}`);
  });
}

main().catch(console.error);
