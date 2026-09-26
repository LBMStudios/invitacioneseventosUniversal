const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';

const TEST_EMAIL = 'lucasbeathyate@gmail.com';
const TEST_NAME = 'Lucas Rossi (Prueba Gmail)';
const TEST_CODE = 'UA-TEST-GMAIL';

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const invUrl = `${LANDING_URL}?i=${encodeURIComponent(TEST_CODE)}`;

const htmlBody = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>@media only screen and (max-width:600px){.card{width:100%!important;border-radius:16px!important;}.pad{padding:18px 16px!important;}.title{font-size:26px!important;}.col{display:block!important;width:100%!important;padding:0 0 10px 0!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu invitación exclusiva para Coyote vs. Acme. Cupos limitados - Confirmación hasta el Jueves 20 de Agosto.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center" style="padding:0;">
<table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;">
<tr><td class="pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
<div style="font-size:18px;font-weight:900;color:#ffffff;">UNIVERSAL ASSISTANCE</div>
<div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>
<tr><td class="pad" style="padding:28px 24px;background-color:#0b2149;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e1b4b;border:2px solid #ee1f73;border-radius:12px;margin-bottom:20px;">
<tr><td style="padding:14px;text-align:center;">
<div style="font-size:11px;font-weight:900;color:#ee1f73;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">⚠️ PRUEBA DE ENVÍO // CORREO INSTITUCIONAL</div>
<div style="font-size:13px;font-weight:800;color:#ffffff;line-height:1.4;">Confirmación requerida antes del <span style="color:#38bdf8;text-decoration:underline;">Jueves 20 de Agosto</span> para asegurar tus entradas.</div>
</td></tr></table>
<div style="font-size:12px;font-weight:700;color:#38bdf8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Te invitamos a una función exclusiva</div>
<h1 class="title" style="margin:0 0 20px 0;color:#ffffff;font-size:30px;font-weight:900;line-height:1.15;text-transform:uppercase;">COYOTE VS ACME</h1>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:20px;">
<tr><td style="padding:14px;">
<div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">INVITADO ESPECIAL</div>
<div style="font-size:19px;font-weight:900;color:#ffffff;">${esc(TEST_NAME)}</div>
</td></tr></table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
<tr>
<td class="col" width="50%" style="vertical-align:top;padding-right:8px;">
<div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">FECHA Y HORA</div>
<div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">Jueves 27/08/2026 · 20:00 hs</div>
<div style="font-size:11px;color:#cbd5e1;margin-top:1px;">Llegada: 19:30 hs</div>
</td>
<td class="col" width="50%" style="vertical-align:top;padding-left:8px;">
<div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">LUGAR</div>
<div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">Movie Montevideo Shopping</div>
<div style="margin-top:1px;"><a href="https://maps.google.com/?q=Movie+Montevideo+Shopping" style="color:#38bdf8;font-size:11px;font-weight:800;">Ver en Maps</a></div>
</td>
</tr></table>
<table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
<tr><td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.4);">
<a href="${esc(invUrl)}" style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;border-radius:999px;">Confirmar mi Asistencia</a>
</td></tr></table>
<div style="font-size:11px;color:rgba(255,255,255,0.7);text-align:center;margin-top:14px;line-height:1.4;">
⚠️ <strong>Cupos limitados:</strong> Se asignan por orden de confirmación hasta el <strong>Jueves 20 de Agosto</strong>.<br>
Tu código: <strong style="color:#38bdf8;">${esc(TEST_CODE)}</strong>
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

const plainText = `Hola Lucas,\nEsta es una prueba de envío para lucasb@ua.com.uy.`;

const payload = JSON.stringify({
  sender: { name: SENDER_NAME, email: SENDER_EMAIL },
  to: [{ email: TEST_EMAIL }],
  subject: `Lucas, tenés una invitación especial · Universal Assistance`,
  htmlContent: htmlBody,
  textContent: plainText,
  replyTo: { email: SENDER_EMAIL }
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
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    console.log('\n======================================================');
    console.log('📬 RESULTADO DEL ENVÍO DE PRUEBA A LUCASBETHYATE@GMAIL.COM:');
    console.log('  Status Code:', res.statusCode);
    console.log('  Respuesta Brevo:', d);
    console.log('======================================================\n');
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
