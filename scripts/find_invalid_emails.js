async function main() {
  const response = await fetch('https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList');
  const data = await response.json();
  const guests = data.guests || [];
  
  console.log('======================================================');
  console.log(' INSPECCIONANDO EMAILS DE TODOS LOS INVITADOS (Total:', guests.length + ')');
  console.log('======================================================\n');
  
  const invalidOrUnrecognized = [];

  guests.forEach((g, idx) => {
    const rawEmail = (g.email || '').trim();
    
    // Reglas para detectar emails no reconocidos o inválidos
    const noMailText = !rawEmail || rawEmail.toUpperCase().includes('NO TENGO') || rawEmail.toUpperCase().includes('SIN MAIL') || rawEmail.toUpperCase().includes('DESCONOCIDO');
    const hasAt = rawEmail.includes('@');
    const hasPeriod = rawEmail.includes('.');
    const hasSemicolon = rawEmail.includes(';');
    const isMultiple = (rawEmail.match(/@/g) || []).length > 1;

    if (noMailText || !hasAt || !hasPeriod || hasSemicolon || isMultiple) {
      invalidOrUnrecognized.push({
        index: idx + 1,
        code: g.code,
        name: g.name,
        agency: g.agency || g.channel || 'N/A',
        stage: g.stage || 'N/A',
        rawEmail: rawEmail,
        mailStatus: g.mailStatus || 'N/A',
        reason: !rawEmail ? 'Campo de e-mail vacío' :
                noMailText ? 'Registrado como sin mail / "No tengo"' :
                !hasAt ? 'Falta el símbolo @' :
                !hasPeriod ? 'Falta el punto del dominio (.)' :
                hasSemicolon ? 'Contiene punto y coma (;)' :
                isMultiple ? 'Múltiples direcciones en una sola celda' : 'Formato de mail no reconocido'
      });
    }
  });

  console.log(`🔍 SE ENCONTRARON ${invalidOrUnrecognized.length} REGISTROS CON PROBLEMAS DE E-MAIL:\n`);
  invalidOrUnrecognized.forEach((g, i) => {
    console.log(`${i+1}. [${g.code}] ${g.name}`);
    console.log(`   • Agencia/Empresa: ${g.agency}`);
    console.log(`   • Etapa: ${g.stage}`);
    console.log(`   • Email grabado en planilla: "${g.rawEmail}"`);
    console.log(`   • Motivo de observación: ${g.reason}`);
    console.log(`   • Estado de envío: ${g.mailStatus}`);
    console.log('------------------------------------------------------');
  });
}

main().catch(console.error);
