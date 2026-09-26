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

async function audit() {
  console.log('🔄 Consultando base de datos en vivo de Google Sheets...');
  const res = await fetchUrl(WEBAPP_URL + '?action=adminList');
  const guests = Array.isArray(res.guests) ? res.guests : (Array.isArray(res) ? res : []);

  console.log('📊 TOTAL REGISTROS RECUPERADOS EN VIVO:', guests.length);

  let confirmados = 0;
  let asientosConfirmados = 0;
  let pendientes = 0;
  let noAsisten = 0;
  let estadosRaros = [];
  let conEmail = 0;
  let sinEmail = 0;
  let mailsEnviados = 0;
  let mailsAbiertos = 0;
  let listaConfirmados = [];

  guests.forEach(g => {
    const st = String(g.status || '').trim();
    const seats = Number(g.totalSeats) || 2;

    if (g.email && g.email.includes('@') && !g.email.toLowerCase().includes('no tengo')) {
      conEmail++;
    } else {
      sinEmail++;
    }

    const mailSt = String(g.mailStatus || '').toLowerCase();
    if (mailSt.includes('enviad') || mailSt.includes('correo') || mailSt.includes('abierto') || mailSt.includes('recordatorio')) {
      mailsEnviados++;
    }
    if (g.openedAt || mailSt.includes('abierto')) {
      mailsAbiertos++;
    }

    if (st === 'Confirmado' || st.toLowerCase().includes('confirmad')) {
      confirmados++;
      asientosConfirmados += seats;
      listaConfirmados.push({
        code: g.code,
        name: g.name,
        agency: g.agency,
        seats: seats,
        companion: g.companionName || '(sin acompañante)'
      });
    } else if (st === 'No asiste' || st.toLowerCase().includes('no')) {
      noAsisten++;
    } else if (st === 'Pendiente' || st === '') {
      pendientes++;
    } else {
      estadosRaros.push({ code: g.code, name: g.name, status: st });
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎯 AUDITORIA EXACTA DE ESTADOS Y CUPOS EN VIVO:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`• TOTAL DE INVITADOS (FILAS / PASES): ${guests.length}`);
  console.log(`• CONFIRMADOS (Pases titulares):      ${confirmados}`);
  console.log(`• BUTACAS CONFIRMADAS EN SALA:       ${asientosConfirmados} (Titulares + Acompañantes)`);
  console.log(`• PENDIENTES DE RESPUESTA:            ${pendientes}`);
  console.log(`• NO ASISTEN (Declinaron):            ${noAsisten}`);
  console.log(`• ESTADOS IRREGULARES / INVALIDOS:    ${estadosRaros.length}`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`• Invitados con Email valido:         ${conEmail}`);
  console.log(`• Invitados sin Email (WhatsApp):     ${sinEmail}`);
  console.log(`• Emails despachados (MailStatus):    ${mailsEnviados}`);
  console.log(`• Invitaciones Abiertas/Vistas:       ${mailsAbiertos}`);
  console.log('═══════════════════════════════════════════════════════════════');

  console.log(`\n📋 DETALLE DE LOS ${confirmados} CONFIRMADOS (${asientosConfirmados} BUTACAS):`);
  listaConfirmados.forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.code}] ${c.name} (${c.agency || 'UA'}) -> ${c.seats} butacas | Acomp: ${c.companion}`);
  });
}

audit();
