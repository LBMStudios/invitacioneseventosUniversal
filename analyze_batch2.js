const https = require('https');
const url = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList';

function httpGet(u) {
  return new Promise((resolve, reject) => {
    https.get(u, res => {
      if (res.statusCode >= 300 && res.headers.location) return resolve(httpGet(res.headers.location));
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

httpGet(url).then(raw => {
  const data = JSON.parse(raw);
  const guests = data.guests || [];
  console.log('Total de invitados en la base de datos:', guests.length);
  
  // Imprimir todas las etapas (stages) únicas que existen en la base
  const stages = [...new Set(guests.map(g => g.stage || 'Sin Etapa'))];
  console.log('\nEtapas presentes en la base:', stages);

  const batch2 = guests.filter(g => {
    const s = (g.stage || '').toLowerCase();
    return s.includes('2') || s.includes('segundo') || s.includes('2do');
  });

  console.log(`\n======================================================`);
  console.log(` ANALISIS DE INVITADOS DEL 2DO ENVÍO (Total: ${batch2.length})`);
  console.log(`======================================================`);
  
  const categories = {
    hasEmailNotSent: [],
    hasEmailSent: [],
    noEmail: [],
    invalidFormat: []
  };

  const seenEmails = new Set();

  batch2.forEach((g) => {
    const rawEmail = (g.email || '').trim();
    const ms = (g.mailStatus || '').trim();
    const isSent = ms.includes('Enviado') || ms.includes('enviad') || ms.includes('Abierto') || ms.includes('Entregado') || ms.includes('Correo enviado');
    
    if (!rawEmail || rawEmail.toUpperCase().includes('NO TENGO') || rawEmail.toUpperCase().includes('SIN MAIL')) {
      categories.noEmail.push(g);
    } else if (isSent) {
      categories.hasEmailSent.push(g);
    } else {
      categories.hasEmailNotSent.push(g);
      if (rawEmail.includes(';') || !rawEmail.includes('@') || rawEmail.endsWith(';')) {
        categories.invalidFormat.push(g);
      }
    }
  });

  console.log(`\n📊 DESGLOSE GENERAL 2DO ENVÍO:`);
  console.log(`  • Total en 2do Envío: ${batch2.length}`);
  console.log(`  • Con mail Y YA ENVIADOS: ${categories.hasEmailSent.length}`);
  console.log(`  • Sin mail (o "No Tengo"): ${categories.noEmail.length}`);
  console.log(`  • Con mail PERO NO ENVIADOS AÚN: ${categories.hasEmailNotSent.length}`);
  console.log(`  • De los no enviados, con formato especial (puntos y coma / múltiples): ${categories.invalidFormat.length}`);

  console.log(`\n📋 DETALLE DE TODOS LOS INVITADOS CON MAIL QUE AÚN NO FUERON ENVIADOS EN EL 2DO ENVÍO:`);
  categories.hasEmailNotSent.forEach((g, i) => {
    console.log(`  ${i+1}. [${g.code}] ${g.name} | Agencia/Empresa: ${g.agency || g.channel || 'N/A'} | Mail: "${g.email}" | Estado Mail: "${g.mailStatus || 'Pendiente'}"`);
  });

}).catch(console.error);
