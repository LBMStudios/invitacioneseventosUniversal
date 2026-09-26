const https = require('https');
const url = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList';

function httpGet(u) {
  return new Promise((resolve, reject) => {
    https.get(u, res => {
      if (res.statusCode >= 300 && res.headers.location) {
        return resolve(httpGet(res.headers.location));
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function cleanEmail(raw) {
  if (!raw) return '';
  const matches = String(raw).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return '';
  return [...new Set(matches.map(e => e.trim().toLowerCase()))].join(',');
}

async function main() {
  const raw = await httpGet(url);
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Error parseando JSON. Primeros 200 caracteres:', raw.slice(0, 200));
    return;
  }

  const guests = data.guests || [];
  
  console.log('======================================================');
  console.log(' TOTAL DE INVITADOS EN LA BASE DE DATOS:', guests.length);
  console.log('======================================================\n');
  
  const pendingWithEmail = [];
  const pendingByStage = {};
  
  guests.forEach(g => {
    const rawEmail = (g.email || '').trim();
    const cleaned = cleanEmail(rawEmail);
    const ms = (g.mailStatus || '').trim();
    const isSent = ms.includes('Enviado') || ms.includes('enviad') || ms.includes('Abierto') || ms.includes('Entregado') || ms.includes('Correo enviado');
    
    const isValidEmail = cleaned && cleaned.includes('@') && !cleaned.toUpperCase().includes('NO TENGO') && !cleaned.toUpperCase().includes('SIN MAIL');
    
    if (isValidEmail && !isSent) {
      pendingWithEmail.push(g);
      const stage = g.stage || 'Sin Etapa';
      if (!pendingByStage[stage]) pendingByStage[stage] = [];
      pendingByStage[stage].push(g);
    }
  });

  console.log('RESUMEN GENERAL DE PENDIENTES CON MAIL:');
  console.log(`TOTAL INVITADOS CON MAIL PENDIENTES DE ENVÍO: ${pendingWithEmail.length}\n`);

  console.log('DESGLOSE POR ETAPA (STAGE):');
  Object.keys(pendingByStage).forEach(st => {
    console.log(`- ${st}: ${pendingByStage[st].length} pendiente(s)`);
  });

  console.log(`\nDETALLE COMPLETO DE LOS ${pendingWithEmail.length} PENDIENTES:`);
  pendingWithEmail.forEach((g, i) => {
    console.log(`${i+1}. [${g.code}] ${g.name} | Etapa: ${g.stage || 'N/A'} | Empresa/Agencia: ${g.agency || g.channel || 'N/A'} | Email: ${g.email}`);
  });
}

main().catch(console.error);
