const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';

const recipientEmail = 'lucasbeathyate@gmail.com';
const guestName = 'Lucas';
const code = 'UA-DEMO-TEST';
const invUrl = `${LANDING_URL}?i=${code}`;

const subject = `Lucas, ¡faltan pocos días! Confirmá tu lugar en la función especial de cine`;

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
<div style="font-size:14px;font-weight:800;color:#ffffff;line-height:1.4;">Hola <span style="color:#38bdf8;">Lucas</span>, aún no registramos tu respuesta para la función exclusiva de <strong style="color:#ffffff;">Coyote vs. Acme</strong>.</div>
</td></tr></table>

<div style="font-size:13px;color:#cbd5e1;line-height:1.5;margin-bottom:20px;text-align:center;">
Queremos asegurarnos de contar con tu presencia. Te pedimos por favor confirmar tus lugares a la brevedad para reservar tus entradas oficiales.
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:14px;">
<div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">DATOS DE TU INVITACIÓN</div>
<div style="font-size:15px;font-weight:900;color:#ffffff;">Jueves 27 de Agosto · 20:00 hs</div>
<div style="font-size:12px;color:#cbd5e1;margin-top:2px;">Movie Montevideo Shopping (Llegada 19:30 hs)</div>
<div style="font-size:11px;color:#38bdf8;margin-top:6px;font-weight:700;">Código Personal: <strong>${code}</strong></div>
</td></tr></table>

<table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 20px auto;">
<tr><td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.5);">
<a href="${invUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;border-radius:999px;">Confirmar Mi Asistencia Ahora ➔</a>
</td></tr></table>

<div style="font-size:11px;color:rgba(255,255,255,0.7);text-align:center;line-height:1.4;">
Si tenés alguna duda o necesitás modificar tu reserva, podés contactarnos directamente a este correo.
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

const postData = JSON.stringify({
  sender: { name: SENDER_NAME, email: SENDER_EMAIL },
  to: [{ email: recipientEmail, name: guestName }],
  subject: subject,
  htmlContent: htmlBody
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
    console.log('Status code:', res.statusCode);
    console.log('Respuesta Brevo:', body);
  });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
