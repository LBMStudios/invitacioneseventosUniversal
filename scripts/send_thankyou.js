/**
 * SCRIPT DE AGRADECIMIENTO POST-EVENTO ("¡GRACIAS POR ACOMPAÑARNOS!")
 * Envía un e-mail de agradecimiento con el link a la galería de fotos oficial del evento.
 * 
 * Uso: node scripts/send_thankyou.js [OPCIONAL_URL_FOTOS]
 * Ejemplo: node scripts/send_thankyou.js "https://photos.app.goo.gl/ejemploFotosUA"
 */

const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

// Link de la galería de fotos (se puede pasar por argumento o usar este default)
const PHOTOS_GALLERY_URL = process.argv[2] || 'https://ua-eventos-uy.web.app/galeria-fotos';
const PHONE = '2901 7378';
const REPLY_TO = SENDER_EMAIL;

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function firstName(name) {
  if (!name) return 'Invitado';
  return String(name).trim().split(/\s+/)[0];
}

function cleanEmail(raw) {
  if (!raw) return '';
  const matches = String(raw).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z2,]+/g);
  if (!matches) return '';
  return [...new Set(matches.map(e => e.trim().toLowerCase()))].join(',');
}

function buildThankYouEmail(guestName, code) {
  const fn = firstName(guestName);
  
  const subject = `${fn}, ¡gracias por acompañarnos! · Universal Assistance`;
  
  const htmlBody = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>@media only screen and (max-width:600px){.card{width:100%!important;border-radius:16px!important;}.pad{padding:18px 16px!important;}.title{font-size:24px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Gracias por compartir con nosotros la Avant Premiere exclusiva de Coyote vs. Acme. Reviví las fotos del evento.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center" style="padding:0;">
<table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;">
<tr><td class="pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
<div style="font-size:18px;font-weight:900;color:#ffffff;">UNIVERSAL ASSISTANCE</div>
<div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>
<tr><td class="pad" style="padding:28px 24px;background-color:#0b2149;text-align:center;">

<div style="font-size:12px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">AVANT PREMIERE EXCLUSIVA</div>
<h1 class="title" style="margin:0 0 16px 0;color:#ffffff;font-size:28px;font-weight:900;line-height:1.2;text-transform:uppercase;">¡GRACIAS POR ACOMPAÑARNOS!</h1>

<div style="font-size:14px;color:#cbd5e1;line-height:1.6;margin-bottom:24px;text-align:center;">
Hola <strong style="color:#ffffff;">${esc(fn)}</strong>, fue un verdadero placer contar con tu presencia en nuestra función especial de <strong>Coyote vs. Acme</strong> en Movie Montevideo Shopping.<br><br>
Esperamos que hayas disfrutado la velada tanto como nosotros. Ya tenemos listas las fotografías oficiales de la noche.
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:16px;text-align:center;">
<div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">📸 GALERÍA OFICIAL DE FOTOS</div>
<div style="font-size:13px;color:#ffffff;line-height:1.4;">Accedé al álbum digital para revivir los mejores momentos del evento y descargar tus fotos.</div>
</td></tr></table>

<table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 24px auto;">
<tr><td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.5);">
<a href="${esc(PHOTOS_GALLERY_URL)}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;border-radius:999px;">Ver y Descargar Fotos 📸</a>
</td></tr></table>

<div style="font-size:12px;color:rgba(255,255,255,0.7);text-align:center;line-height:1.5;">
¡Gracias por confiar siempre en Universal Assistance!<br>
Nos vemos en el próximo evento.
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
    '', '¡Gracias por acompañarnos en nuestra Avant Premiere exclusiva de Coyote vs. Acme!',
    'Fue un placer compartir esta noche con vos.',
    '', 'Ya podés ver y descargar las fotografías oficiales del evento en el siguiente link:',
    `${PHOTOS_GALLERY_URL}`,
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
      tags: ['agradecimiento-post-evento'],
      headers: {
        'X-Mailin-custom': 'UA-Agradecimiento',
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

async function markThankYouSent(code, email) {
  const url = `${WEBAPP_URL}?action=updateGuest&code=${encodeURIComponent(code)}&mailStatus=${encodeURIComponent('Agradecimiento Enviado')}`;
  try { await fetch(url); } catch (_) {}
}

async function main() {
  console.log('💌 ENVÍO DE AGRADECIMIENTO POST-EVENTO CON FOTOS');
  console.log('═════════════════════════════════════════════════\n');
  console.log(`🔗 Link de la galería de fotos configurado: ${PHOTOS_GALLERY_URL}\n`);

  const res = await fetch(`${WEBAPP_URL}?action=adminList`);
  const data = await res.json();
  const guests = data.guests || [];

  const confirmed = guests.filter(g => {
    const status = String(g.status || '').trim();
    const isConfirmed = status.includes('Confirmad') || status.includes('confirmad');
    const email = cleanEmail(g.email);
    const hasValidEmail = email && email.includes('@') && email.toUpperCase().indexOf('NO TENGO') < 0;
    return isConfirmed && hasValidEmail;
  });

  console.log(`📋 Invitados confirmados con e-mail encontrados: ${confirmed.length}\n`);

  if (confirmed.length === 0) {
    console.log('⚠️ No se encontraron invitados confirmados con e-mail.');
    return;
  }

  let sent = 0, errors = 0;
  for (let i = 0; i < confirmed.length; i++) {
    const g = confirmed[i];
    const email = cleanEmail(g.email);
    const { subject, htmlBody, plainText } = buildThankYouEmail(g.name, g.code);

    process.stdout.write(`[${i+1}/${confirmed.length}] Enviando agradecimiento a ${g.name} (${email})... `);

    try {
      await sendBrevo(email, subject, htmlBody, plainText);
      console.log('✅ ENVIADO');
      sent++;
      await markThankYouSent(g.code, email);
    } catch (e) {
      console.log(`❌ ERROR: ${e.message}`);
      errors++;
    }

    if (i < confirmed.length - 1) {
      await new Promise(r => setTimeout(r, 2500));
    }
  }

  console.log('\n======================================================');
  console.log(`📊 TOTAL AGRADECIMIENTOS: ${sent} enviados, ${errors} fallidos de ${confirmed.length}`);
  console.log('======================================================\n');
}

main().catch(console.error);
