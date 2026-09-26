const https = require('https');
const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function cleanEmail(email) {
  if (!email) return '';
  const cleaned = String(email)
    .replace(/['"\u2018\u2019\u201c\u201d]/g, '')
    .replace(/[<>]/g, ' ')
    .trim();
  if (!cleaned.includes('@') || !cleaned.includes('.') || cleaned.toUpperCase().includes('NO TENGO')) {
    return '';
  }
  return cleaned.toLowerCase();
}

async function prepareDispatchList() {
  console.log('1. Descargando base de datos en vivo...');
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const jsonStr = raw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(jsonStr);

  if (!data.ok || !Array.isArray(data.guests)) {
    console.error('Error al obtener lista:', data);
    process.exit(1);
  }

  const allGuests = data.guests;
  console.log(`Total registros en base: ${allGuests.length}`);

  // Filtrar estrictamente solo Confirmados
  const confirmed = allGuests.filter(g => (g.status || '').trim() === 'Confirmado');
  console.log(`Total confirmados: ${confirmed.length}`);

  const withEmail = [];
  const withoutEmail = [];

  confirmed.forEach(g => {
    const validEmail = cleanEmail(g.email);
    const guestObj = {
      code: g.code,
      name: g.name || 'Invitado',
      email: validEmail,
      rawEmail: g.email || '',
      phone: g.phone || '',
      companionName: g.companionName || '',
      totalSeats: Number(g.totalSeats) || 1,
      agency: g.agency || '',
      link: g.link || `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}`
    };

    if (validEmail) {
      withEmail.push(guestObj);
    } else {
      withoutEmail.push(guestObj);
    }
  });

  // Agrupar por email para evitar duplicados si una persona tiene más de un pase asignado al mismo correo
  const emailMap = new Map();
  withEmail.forEach(g => {
    if (!emailMap.has(g.email)) {
      emailMap.set(g.email, []);
    }
    emailMap.get(g.email).push(g);
  });

  const uniqueEmails = Array.from(emailMap.keys());
  const totalSeatsWithEmail = withEmail.reduce((sum, g) => sum + g.totalSeats, 0);
  const totalSeatsWithoutEmail = withoutEmail.reduce((sum, g) => sum + g.totalSeats, 0);

  console.log(`\n========================================`);
  console.log(`AUDITORÍA PRE-VUELO DE ENVÍO`);
  console.log(`========================================`);
  console.log(`✅ Confirmados con correo válido: ${withEmail.length} registros (${uniqueEmails.length} correos únicos) -> ${totalSeatsWithEmail} butacas`);
  console.log(`⚠️ Confirmados sin correo electrónico: ${withoutEmail.length} registros -> ${totalSeatsWithoutEmail} butacas`);
  console.log(`Total Butacas Confirmadas: ${totalSeatsWithEmail + totalSeatsWithoutEmail}`);

  if (withoutEmail.length > 0) {
    console.log(`\n--- Confirmados sin correo (se les gestiona por WhatsApp o manual) ---`);
    withoutEmail.forEach((g, i) => {
      console.log(`  ${i+1}. ${g.name} (${g.totalSeats} butacas) — ${g.agency || 'Sin agencia'}`);
    });
  }

  // Guardar lista para despacho
  fs.writeFileSync('confirmed_dispatch_list.json', JSON.stringify({
    totalConfirmed: confirmed.length,
    withEmailCount: withEmail.length,
    uniqueEmailCount: uniqueEmails.length,
    withoutEmailCount: withoutEmail.length,
    totalSeatsWithEmail,
    totalSeatsWithoutEmail,
    recipients: withEmail,
    withoutEmail
  }, null, 2));

  console.log(`\nArchivo guardado en confirmed_dispatch_list.json`);
}

prepareDispatchList().catch(console.error);
