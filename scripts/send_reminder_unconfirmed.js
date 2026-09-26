/**
 * SCRIPT DE RECORDATORIO URGENTE PARA INVITADOS PENDIENTES
 * Envía un correo de recordatorio a quienes aún no confirmaron su asistencia.
 * 
 * Uso: node scripts/send_reminder_unconfirmed.js
 */

// 🚫 BLOQUEO DE SEGURIDAD EXPLICITO: No enviar mails sin autorización del usuario
const ALLOW_EMAIL_SEND = false;

if (!ALLOW_EMAIL_SEND) {
  console.error("❌ ERROR: El envío de emails está BLOQUEADO por configuración de seguridad.");
  console.error("❌ No se enviará ningún correo automáticamente.");
  process.exit(1);
}

const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const EVENT_DATE = '27/08/2026';
const EVENT_TIME = '20:00';
const ARRIVAL_TIME = '19:30';
const VENUE = 'Movie Montevideo Shopping';
const MAPS_URL = 'https://maps.google.com/?q=Movie+Montevideo+Shopping';
const PHONE = '2901 7378';
const REPLY_TO = SENDER_EMAIL;

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function firstName(name) {
  if (!name) return 'Invitado';
  return String(name).trim().split(/\s+/)[0];
}

function cleanEmail(raw) {
  if (!raw) return '';
  const matches = String(raw).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return '';
  return [...new Set(matches.map(e => e.trim().toLowerCase()))].join(',');
}

function buildReminderEmail(guestName, code) {
  const invUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
  const fn = firstName(guestName);
  
  const subject = `${fn}, ¡faltan pocos días! Confirmá tu lugar en la función especial de cine`;
  
  const htmlBody = `<!doctype html>
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
<div style="font-size:14px;font-weight:800;color:#ffffff;line-height:1.4;">Hola <span style="color:#38bdf8;">${esc(fn)}</span>, aún no registramos tu respuesta para la función exclusiva de <strong style="color:#ffffff;">Coyote vs. Acme</strong>.</div>
</td></tr></table>

<div style="font-size:13px;color:#cbd5e1;line-height:1.5;margin-bottom:20px;text-align:center;">
Queremos asegurarnos de contar con tu presencia. Te pedimos por favor confirmar tus lugares a la brevedad para reservar tus entradas oficiales.
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:14px;">
<div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">DATOS DE TU INVITACIÓN</div>
<div style="font-size:15px;font-weight:900;color:#ffffff;">Jueves 27 de Agosto · 20:00 hs</div>
<div style="font-size:12px;color:#cbd5e1;margin-top:2px;">Movie Montevideo Shopping (Llegada 19:30 hs)</div>
<div style="font-size:11px;color:#38bdf8;margin-top:6px;font-weight:700;">Código Personal: <strong>${esc(code)}</strong></div>
</td></tr></table>

<table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 20px auto;">
<tr><td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.5);">
<a href="${esc(invUrl)}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;border-radius:999px;">Confirmar Mi Asistencia Ahora ➔</a>
</td></tr></table>

<div style="font-size:11px;color:rgba(255,255,255,0.7);text-align:center;line-height:1.4;">
Si tenés alguna duda o necesitás modificar tu reserva, podés contactarnos directamente a este correo.
</div>

</td></tr>
<tr><td style="padding:16px 20px;background-color:#071938;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
<div style="font-weight:900;font-size:12px;color:#ffffff;">UNIVERSAL ASSISTANCE URUGUAY</div>
<div style="font-size:11px;color:#38bdf8;margin-top:4px;font-weight:700;">
Tel: ${esc(PHONE)} &nbsp;|&nbsp;
<a href="mailto:${esc(REPLY_TO)}" style="color:#ffffff;text-decoration:underline;">${esc(REPLY_TO)}</a>
</div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const plainText = [
    `Hola ${fn},`,
    '', '¡Faltan pocos días para vernos en el cine!',
    'Aún no registramos tu respuesta para la Avant Premiere de Coyote vs. Acme.',
    '', 'DETALLES DEL EVENTO:',
    `  Fecha: ${EVENT_DATE}`,
    `  Hora: ${EVENT_TIME} hs (Llegada 19:30 hs)`,
    `  Lugar: ${VENUE}`,
    `  Código: ${code}`,
    '', 'Por favor ingresá a tu link personal para asegurar tu lugar:',
    `${invUrl}`,
    '', '--------------------------------------',
    'Universal Assistance Uruguay',
    `Tel: ${PHONE} | Email: ${REPLY_TO}`
  ].join('\n');

  return { subject, htmlBody, plainText };
}

function sendBrevo(toEmail, subject, htmlBody, plainText) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject,
      htmlContent: htmlBody,
      textContent: plainText,
      replyTo: { email: REPLY_TO },
      tags: ['recordatorio-pendientes-cine'],
      headers: {
        'X-Mailin-custom': 'UA-Recordatorio',
        'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=Unsubscribe>`
      }
    });

    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) resolve(data);
        else reject(new Error(`Brevo ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function markReminderSent(code, email) {
  const url = `${WEBAPP_URL}?action=markSent&code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`;
  try { await fetch(url); } catch (_) {}
}

async function main() {
  console.log('⏰ RECORDATORIO PARA INVITADOS PENDIENTES DE RESPUESTA');
  console.log('═══════════════════════════════════════════════════════\n');

  const res = await fetch(`${WEBAPP_URL}?action=adminList`);
  const data = await res.json();
  const guests = data.guests || [];

  const pending = guests.filter(g => {
    const status = String(g.status || '').trim();
    const mailStatus = String(g.mailStatus || '').trim();
    const isPending = !status || status === 'Pendiente';
    const notYetReminded = !mailStatus.includes('Recordatorio');
    const email = cleanEmail(g.email);
    const hasValidEmail = email && email.includes('@') && email.toUpperCase().indexOf('NO TENGO') < 0;
    return isPending && notYetReminded && hasValidEmail;
  });

  console.log(`📋 Invitados pendientes con email válido encontrados: ${pending.length}\n`);

  if (pending.length === 0) {
    console.log('✨ No hay invitados pendientes de respuesta con e-mail. ¡Todo al día!');
    return;
  }

  let sent = 0, errors = 0;
  const processedEmails = new Set();

  for (let i = 0; i < pending.length; i++) {
    const g = pending[i];
    const email = cleanEmail(g.email);

    if (processedEmails.has(email)) {
      console.log(`[${i+1}/${pending.length}] ${g.name} (${email})... 📋 OMITIDO (email duplicado)`);
      continue;
    }
    processedEmails.add(email);

    const { subject, htmlBody, plainText } = buildReminderEmail(g.name, g.code);

    process.stdout.write(`[${i+1}/${pending.length}] Enviando recordatorio a ${g.name} (${email})... `);

    try {
      await sendBrevo(email, subject, htmlBody, plainText);
      console.log('✅ ENVIADO');
      sent++;
      await markReminderSent(g.code, email);
    } catch (e) {
      console.log(`❌ ERROR: ${e.message}`);
      errors++;
    }

    if (i < pending.length - 1) {
      await new Promise(r => setTimeout(r, 2500));
    }
  }

  console.log('\n======================================================');
  console.log(`📊 TOTAL RECORDATORIOS: ${sent} enviados, ${errors} fallidos de ${pending.length}`);
  console.log('======================================================\n');
}

main().catch(console.error);
