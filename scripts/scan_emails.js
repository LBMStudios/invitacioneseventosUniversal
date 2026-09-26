async function main() {
  const res = await fetch('https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList');
  const data = await res.json();
  const guests = data.guests || [];
  
  console.log('Total de invitados:', guests.length);
  
  const issues = [];
  
  guests.forEach((g, i) => {
    const email = (g.email || '').trim();
    
    // Check if email looks weird, has spaces, semicolons, multiple addresses, or is missing domain/at
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    const isValidSingle = emailRegex.test(email);
    
    if (!isValidSingle) {
      issues.push({
        num: i + 1,
        code: g.code,
        name: g.name,
        email: email,
        agency: g.agency || g.channel || 'N/A',
        stage: g.stage || 'N/A',
        mailStatus: g.mailStatus || 'Sin estado'
      });
    }
  });

  console.log(`\n======================================================`);
  console.log(` INVITADOS CUYO E-MAIL NO CUMPLE FORMATO ESTÁNDAR (${issues.length}):`);
  console.log(`======================================================\n`);
  
  issues.forEach(g => {
    console.log(`[Fila ${g.num}] Code: ${g.code} | Nombre: ${g.name} | Etapa: ${g.stage} | Agencia: ${g.agency}`);
    console.log(`  -> Mail registrado: "${g.email}" | Estado: ${g.mailStatus}`);
    console.log('----------------------------------------------------------------');
  });
}

main().catch(console.error);
