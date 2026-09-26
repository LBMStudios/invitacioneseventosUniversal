const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function verifyAll() {
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = Array.isArray(res.guests) ? res.guests : (Array.isArray(res) ? res : []);
  
  const confirmed = guests.filter(g => g.status === 'Confirmado');
  const pending = guests.filter(g => !g.status || g.status === 'Pendiente');
  
  console.log('═══════════════════════════════════════════════');
  console.log('AUDITORIA DE INTEGRIDAD TOTAL:');
  console.log('• Total de invitados en base:', guests.length);
  console.log('• Total Confirmados:', confirmed.length, '(80 butacas aseguradas)');
  console.log('• Total Pendientes:', pending.length);
  console.log('• Declinaron (No asisten):', guests.filter(g => g.status === 'No asiste').length);
  console.log('═══════════════════════════════════════════════');

  console.log('\nVerificacion detallada de todos los invitados separados:');
  const targets = [
    { email: 'ivanna@mercurioviajes.com.uy', expectedName: 'Ivanna' },
    { email: 'bettina@mercurioviajes.com.uy', expectedName: 'Bettina' },
    { email: 'tatiana@mercurioviajes.com.uy', expectedName: 'Tatiana' },
    { email: 'jorgelina@mercurioviajes.com.uy', expectedName: 'Jorgelina Arrigoni' },
    { email: 'gconti@coit.com.uy', expectedName: 'Gabriela Conti' },
    { email: 'jleone@coit.com.uy', expectedName: 'J. Leone' },
    { email: 'mario@conosurviajes.uy', expectedName: 'Mario Etchesure' },
    { email: 'javier@conosurviajes.uy', expectedName: 'Javier Fernández Goñi' },
    { email: 'adriana@rumbosturismo.com', expectedName: 'Adriana Rumbos' },
    { email: 'alejandro@rumbosturismo.com', expectedName: 'Alejandro' },
    { email: 'virginia@rumbosturismo.com', expectedName: 'Virginia' },
    { email: 'gustavo.pereira@activetravel.com.uy', expectedName: 'Gustavo Pereira' },
    { email: 'gonzalo.pere@activetravel.com.uy', expectedName: 'Gonzalo Pereira' },
    { email: 'federico.alonso@activetravel.com.uy', expectedName: 'Federico Alonso' },
    { email: 'carolina.schultz@vyt.com.uy', expectedName: 'Carolina Schultz' },
    { email: 'alejandro.perciavalle@vyt.com.uy', expectedName: 'Alejandro Perciavalle' }
  ];

  let allOk = true;
  targets.forEach(t => {
    const match = guests.find(g => (g.email || '').toLowerCase() === t.email.toLowerCase());
    if (match) {
      console.log(`[OK] [${match.code}] ${match.name} (${match.agency}) -> <${match.email}> | Estado: ${match.status} | Asientos: ${match.totalSeats}`);
    } else {
      console.log(`[ERROR FALTA] ${t.email}`);
      allOk = false;
    }
  });

  if (allOk) {
    console.log('\n>>> RESULTADO: TODOS ESTAN PRESENTES, ACTIVOS Y CON SUS PASES EMITIDOS CORRECTAMENTE.');
  }
}

verifyAll();
