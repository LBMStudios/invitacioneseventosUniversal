async function main() {
  const response = await fetch('https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList');
  const data = await response.json();
  const guests = data.guests || [];
  
  function cleanEmail(raw) {
    if (!raw) return '';
    const matches = String(raw).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (!matches) return '';
    return [...new Set(matches.map(e => e.trim().toLowerCase()))].join(',');
  }

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

  console.log('======================================================');
  console.log(' TOTAL DE INVITADOS REGISTRADOS:', guests.length);
  console.log(' TOTAL PENDIENTES DE ENVÍO CON MAIL:', pendingWithEmail.length);
  console.log('======================================================\n');

  console.log('📊 DESGLOSE POR ETAPA (STAGE):');
  for (const [st, arr] of Object.entries(pendingByStage)) {
    console.log(`  - ${st}: ${arr.length} pendiente(s)`);
  }

  console.log('\n📋 DETALLE COMPLETO DE LOS PENDIENTES CON MAIL:');
  pendingWithEmail.forEach((g, i) => {
    console.log(`  ${i+1}. [${g.code}] ${g.name} | Etapa: ${g.stage || 'N/A'} | Empresa/Agencia: ${g.agency || g.channel || 'N/A'} | Mail: ${g.email}`);
  });
}

main().catch(console.error);
