/**
 * DESPACHO OFICIAL DE RECORDATORIOS AGRUPADOS PARA INVITADOS PENDIENTES
 * Agrupa invitaciones por casilla de correo para enviar 1 solo email por destinatario
 * con todos sus links correspondientes.
 */

// 🚫 BLOQUEO DE SEGURIDAD EXPLICITO: No enviar mails sin autorización del usuario
const ALLOW_EMAIL_SEND = false;

if (!ALLOW_EMAIL_SEND) {
  console.error("❌ ERROR: El envío de emails está BLOQUEADO por configuración de seguridad.");
  console.error("❌ No se enviará ningún correo automáticamente.");
  process.exit(1);
}

const https = require('https');
const fs = require('fs');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getJSON(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function cleanEmail(raw) {
  if (!raw) return [];
  const matches = String(raw).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return [];
  return [...new Set(matches.map(e => e.trim().toLowerCase()))];
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function firstName(name) {
  if (!name || name.trim().toLowerCase().includes('extra') || name.trim().toLowerCase().includes('sorteo')) {
    return 'estimado/a';
  }
  const part = String(name).trim().split(/\s+/)[0];
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

function sendBrevoEmail(toEmail, toName, subject, htmlContent) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail, name: toName || toEmail }],
      subject: subject,
      htmlContent: htmlContent
    });

    const req = https.request({
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(body)); } catch (_) { resolve({ ok: true }); }
        } else {
          reject(new Error(`Brevo HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── PLANTILLA INDIVIDUAL (1 INVITACIÓN) ──
function buildSingleEmailHtml(guest) {
  const fn = firstName(guest.name);
  const code = guest.code;
  const invUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
  const displayGreeting = fn === 'estimado/a' ? 'Hola,' : `Hola <span style="color:#38bdf8;">${esc(fn)}</span>,`;

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>@media only screen and (max-width:600px){.card{width:100%!important;border-radius:16px!important;}.pad{padding:18px 16px!important;}.title{font-size:24px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">¡Faltan pocos días para vernos en el cine! Confirmá tus entradas hoy mismo.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center" style="padding:0;">
<table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #ee1f73;border-radius:20px;overflow:hidden;">
<tr><td class="pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(238,31,115,0.3);">
<div style="font-size:18px;font-weight:900;color:#ffffff;">UNIVERSAL ASSISTANCE</div>
<div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>
<tr><td class="pad" style="padding:28px 24px;background-color:#0b2149;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e1b4b;border:2px solid #ee1f73;border-radius:12px;margin-bottom:20px;">
<tr><td style="padding:16px;text-align:center;">
<div style="font-size:12px;font-weight:900;color:#ee1f73;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">⏰ ¡FALTAN POCOS DÍAS!</div>
<div style="font-size:14px;font-weight:800;color:#ffffff;line-height:1.4;">${displayGreeting} aún no registramos tu respuesta para la función exclusiva de <strong style="color:#ffffff;">Coyote vs. Acme</strong>.</div>
</td></tr></table>

<div style="font-size:13px;color:#cbd5e1;line-height:1.5;margin-bottom:20px;text-align:center;">
Queremos asegurarnos de contar con tu presencia. Te pedimos por favor confirmar tus lugares a la brevedad para reservar tus entradas oficiales.
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:14px;">
<div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">DATOS DE TU INVITACIÓN</div>
<div style="font-size:15px;font-weight:900;color:#ffffff;">Jueves 27 de Agosto · 20:00 hs</div>
<div style="font-size:12px;color:#cbd5e1;margin-top:2px;">Movie Montevideo Shopping (Recepción 19:30 hs)</div>
<div style="font-size:11px;color:#38bdf8;margin-top:6px;font-weight:700;">Código Personal: <strong>${esc(code)}</strong></div>
</td></tr></table>

<table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 20px auto;">
<tr><td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.5);">
<a href="${invUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;border-radius:999px;">Confirmar Mi Asistencia Ahora ➔</a>
</td></tr></table>

<div style="font-size:11px;color:rgba(255,255,255,0.7);text-align:center;line-height:1.4;">
Si tenés alguna duda o necesitás modificar tu reserva, podés responder directamente a este correo.
</div>

</td></tr>
<tr><td style="padding:16px 20px;background-color:#071938;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
<div style="font-weight:900;font-size:12px;color:#ffffff;">UNIVERSAL ASSISTANCE URUGUAY</div>
<div style="font-size:11px;color:#38bdf8;margin-top:4px;font-weight:700;">
Tel: 2901 7378 &nbsp;|&nbsp;
<a href="mailto:lucasb@ua.com.uy" style="color:#ffffff;text-decoration:underline;">lucasb@ua.com.uy</a>
</div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ── PLANTILLA MÚLTIPLE (VARIAS INVITACIONES / EQUIPOS) ──
function buildMultiEmailHtml(email, guests) {
  // Buscar un nombre representativo de la persona
  const realNamedGuest = guests.find(g => g.name && !g.name.toLowerCase().includes('extra') && !g.name.toLowerCase().includes('sorteo') && !g.name.toLowerCase().includes('viajes') && !g.name.toLowerCase().includes('travel'));
  const fn = realNamedGuest ? firstName(realNamedGuest.name) : 'Equipo';
  const displayGreeting = (fn === 'estimado/a' || fn === 'Equipo') ? 'Hola,' : `Hola <span style="color:#38bdf8;">${esc(fn)}</span>,`;

  const passesHtml = guests.map((p, idx) => {
    const invUrl = `${LANDING_URL}?i=${encodeURIComponent(p.code)}`;
    const passLabel = p.name && !p.name.toLowerCase().includes('extra') ? p.name : `Pase de Equipo ${idx + 1}`;
    return `
      <div style="background:#16356e; border:1px solid #38bdf8; border-radius:12px; padding:16px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px;">🎟️ PASE ${idx + 1} · ${esc(passLabel)}</span>
          <span style="background:rgba(56,189,248,0.2); color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px;">${esc(p.code)}</span>
        </div>
        <div style="font-size:12px; color:#cbd5e1; margin-bottom:12px;">Acceso para 2 personas · Movie Montevideo Shopping</div>
        <div style="text-align:center;">
          <a href="${invUrl}" style="display:inline-block; width:90%; background:#ee1f73; color:#ffffff; text-decoration:none; font-size:13px; font-weight:800; padding:10px 16px; border-radius:999px; box-shadow:0 3px 10px rgba(238,31,115,0.4);">
            Completar Datos del Pase ${idx + 1} ➔
          </a>
        </div>
      </div>
    `;
  }).join('');

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>@media only screen and (max-width:600px){.card{width:100%!important;border-radius:16px!important;}.pad{padding:18px 16px!important;}.title{font-size:24px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tus ${guests.length} invitaciones para Coyote vs. Acme. Confirmá los lugares de tu equipo.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center" style="padding:0;">
<table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #ee1f73;border-radius:20px;overflow:hidden;">
<tr><td class="pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(238,31,115,0.3);">
<div style="font-size:18px;font-weight:900;color:#ffffff;">UNIVERSAL ASSISTANCE</div>
<div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>
<tr><td class="pad" style="padding:28px 24px;background-color:#0b2149;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e1b4b;border:2px solid #ee1f73;border-radius:12px;margin-bottom:20px;">
<tr><td style="padding:16px;text-align:center;">
<div style="font-size:12px;font-weight:900;color:#ee1f73;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">⏰ RECORDATORIO DE INVITACIONES</div>
<div style="font-size:14px;font-weight:800;color:#ffffff;line-height:1.4;">${displayGreeting} tenés <strong>${guests.length} invitaciones reservadas</strong> para la función especial de <strong style="color:#ffffff;">Coyote vs. Acme</strong>.</div>
</td></tr></table>

<div style="font-size:13px;color:#cbd5e1;line-height:1.5;margin-bottom:20px;text-align:center;">
A continuación tenés los accesos individuales para que puedas utilizarlos o compartirlos con cada integrante de tu equipo:
</div>

${passesHtml}

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;border:1px solid rgba(56,189,248,0.3);border-radius:12px;margin-bottom:20px;">
<tr><td style="padding:14px;font-size:12px;color:#cbd5e1;line-height:1.5;">
📍 <strong>Lugar:</strong> Movie Montevideo Shopping<br>
🗓️ <strong>Fecha:</strong> Jueves 27 de Agosto · 20:00 hs (Recepción 19:30 hs)<br>
🍿 <strong>Beneficio:</strong> Pop & Bebida incluidos de cortesía
</td></tr></table>

<div style="font-size:11px;color:rgba(255,255,255,0.7);text-align:center;line-height:1.4;">
Si tenés alguna duda sobre la asignación de tus pases, podés responder directamente a este correo.
</div>

</td></tr>
<tr><td style="padding:16px 20px;background-color:#071938;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
<div style="font-weight:900;font-size:12px;color:#ffffff;">UNIVERSAL ASSISTANCE URUGUAY</div>
<div style="font-size:11px;color:#38bdf8;margin-top:4px;font-weight:700;">
Tel: 2901 7378 &nbsp;|&nbsp;
<a href="mailto:lucasb@ua.com.uy" style="color:#ffffff;text-decoration:underline;">lucasb@ua.com.uy</a>
</div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

(async () => {
  console.log('=== INICIANDO DESPACHO OFICIAL DE RECORDATORIOS AGRUPADOS ===\n');
  console.log('1. Descargando estado en tiempo real de la base de datos...');
  const list = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = list.guests || [];

  const confirmed = guests.filter(g => (g.status || '').toLowerCase().includes('confirmad'));
  const declined = guests.filter(g => (g.status || '').toLowerCase().includes('no asiste') || (g.status || '').toLowerCase().includes('rechaz'));
  const pending = guests.filter(g => !confirmed.includes(g) && !declined.includes(g));

  console.log(`- Total en base: ${guests.length}`);
  console.log(`- Confirmados protegidos (NO se tocan): ${confirmed.length}`);
  console.log(`- Pendientes totales: ${pending.length}`);

  // Agrupar pendientes por email limpio
  const emailMap = new Map();
  pending.forEach(g => {
    const emails = cleanEmail(g.email);
    emails.forEach(em => {
      if (!emailMap.has(em)) emailMap.set(em, []);
      emailMap.get(em).push(g);
    });
  });

  console.log(`- Total casillas de correo únicas a despachar: ${emailMap.size}\n`);

  let sentCount = 0;
  let errorCount = 0;
  const results = [];

  const entries = Array.from(emailMap.entries());

  for (let i = 0; i < entries.length; i++) {
    const [toEmail, guestList] = entries[i];
    const isMulti = guestList.length > 1;

    let subject = '';
    let html = '';
    let recipientName = '';

    if (isMulti) {
      const realNamedGuest = guestList.find(g => g.name && !g.name.toLowerCase().includes('extra') && !g.name.toLowerCase().includes('sorteo'));
      recipientName = realNamedGuest ? realNamedGuest.name : guestList[0].name;
      const fn = firstName(recipientName);
      subject = fn === 'estimado/a' ? `Tus ${guestList.length} invitaciones para la función especial de cine - Coyote vs. Acme` : `${fn}, ¡faltan pocos días! Tus ${guestList.length} invitaciones para la función especial de cine`;
      html = buildMultiEmailHtml(toEmail, guestList);
    } else {
      const guest = guestList[0];
      recipientName = guest.name;
      const fn = firstName(guest.name);
      subject = fn === 'estimado/a' ? `¡Faltan pocos días! Confirmá tu lugar en la función especial de cine` : `${fn}, ¡faltan pocos días! Confirmá tu lugar en la función especial de cine`;
      html = buildSingleEmailHtml(guest);
    }

    try {
      const res = await sendBrevoEmail(toEmail, recipientName, subject, html);
      sentCount++;
      console.log(`[${i + 1}/${entries.length}] ✅ ENVIADO a ${toEmail} (${guestList.length} invitación/es) - MsgID: ${res.messageId || 'OK'}`);
      results.push({ email: toEmail, count: guestList.length, status: 'ENVIADO', msgId: res.messageId });
    } catch (err) {
      errorCount++;
      console.error(`[${i + 1}/${entries.length}] ❌ ERROR enviando a ${toEmail}: ${err.message}`);
      results.push({ email: toEmail, count: guestList.length, status: 'ERROR', error: err.message });
    }

    // Pequeño throttle de 80ms para no saturar Brevo
    await sleep(80);
  }

  console.log('\n=== DESPACHO FINALIZADO CON ÉXITO ===');
  console.log(`• Total casillas procesadas: ${entries.length}`);
  console.log(`• Envíos exitosos: ${sentCount}`);
  console.log(`• Errores: ${errorCount}`);

  fs.writeFileSync('./scripts/recordatorios_dispatch_results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    totalEmails: entries.length,
    sent: sentCount,
    errors: errorCount,
    details: results
  }, null, 2));

  console.log('Resultados guardados en scripts/recordatorios_dispatch_results.json');
})();
