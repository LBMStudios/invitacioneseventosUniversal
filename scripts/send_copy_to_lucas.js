const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const firstName = 'Lucas';
const code = 'UA-001';
const invitationUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;

const subject = 'Aclaración importante: Fecha de la función especial · Universal Assistance (Jueves 27 de Agosto)';

const htmlBody = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @media only screen and (max-width:600px){
    .card{width:100%!important;border-radius:16px!important;}
    .pad{padding:20px 16px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Aclaración: La función especial es el Jueves 27 de Agosto a las 19:30 hs en Movie Montevideo Shopping.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center">
<table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;">
<tr><td class="pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
  <div style="font-size:18px;font-weight:900;color:#ffffff;letter-spacing:0.5px;">UNIVERSAL ASSISTANCE</div>
  <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>
<tr><td class="pad" style="padding:28px 24px;background-color:#0b2149;">
  <div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">COMUNICADO OFICIAL</div>
  <h1 style="margin:0 0 16px 0;color:#ffffff;font-size:24px;font-weight:900;line-height:1.2;text-transform:uppercase;">ACLARACIÓN DE FECHA</h1>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:20px;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px;color:#ffffff;line-height:1.6;">
      ¡Hola <strong>${esc(firstName)}</strong>! 👋<br><br>
      Te escribimos para realizar una <strong>aclaración importante</strong> respecto al correo de recordatorio enviado hoy:<br><br>
      Queremos confirmarte que la función especial de cine de <strong>Coyote vs. Acme</strong> se realizará el <strong>JUEVES 27 DE AGOSTO</strong> (la próxima semana), y no mañana.
    </div>
  </td></tr></table>

  <!-- Tarjeta con los datos de fecha -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;border:2px solid #38bdf8;border-radius:12px;margin-bottom:24px;">
  <tr><td style="padding:18px 20px;text-align:center;">
    <div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">DETALLES CONFIRMADOS</div>
    <div style="font-size:16px;font-weight:900;color:#ffffff;margin-bottom:4px;">🗓️ Jueves 27 de Agosto de 2026</div>
    <div style="font-size:13px;color:#cbd5e1;margin-bottom:4px;">⏰ 19:30 hs (Recepción y acreditación) · 20:00 hs (Función puntual)</div>
    <div style="font-size:13px;color:#cbd5e1;margin-bottom:6px;">📍 Movie Montevideo Shopping</div>
    <div style="font-size:12px;color:#38bdf8;font-weight:700;">🍿 Pop y bebida cortesía de Universal Assistance</div>
  </td></tr></table>

  <div style="font-size:13px;color:#e2e8f0;line-height:1.6;margin-bottom:24px;text-align:center;">
    Tus lugares ya se encuentran <strong>100% reservados y asegurados</strong> con tu código <strong>${esc(code)}</strong>.
  </div>

  <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 20px auto;">
  <tr><td align="center" style="background-color:#ee1f73;border-radius:999px;">
    <a href="${esc(invitationUrl)}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;border-radius:999px;" target="_blank">Ver mi Entrada y Código QR</a>
  </td></tr></table>

  <div style="font-size:13px;color:#94a3b8;text-align:center;line-height:1.5;">
    ¡Te esperamos para compartir una gran noche de cine!<br>
    <strong style="color:#ffffff;">Equipo de Universal Assistance Uruguay</strong>
  </div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

const plainText = `¡Hola ${firstName}!

Te escribimos para realizar una aclaracion importante respecto al correo de recordatorio enviado hoy:

Queremos confirmarte que la funcion especial de cine de Coyote vs. Acme se realizara el JUEVES 27 DE AGOSTO (la proxima semana), y no manana.

DETALLES CONFIRMADOS:
  - Fecha: Jueves 27 de Agosto de 2026
  - Horario: 19:30 hs (Recepcion) · 20:00 hs (Funcion puntual)
  - Lugar: Movie Montevideo Shopping
  - Incluye: Pop y bebida cortesia de Universal Assistance
  - Codigo de reserva: ${code}

Ver tu entrada y QR: ${invitationUrl}

¡Te esperamos para compartir una gran noche de cine!
Universal Assistance Uruguay`;

const payload = JSON.stringify({
  sender: { name: SENDER_NAME, email: SENDER_EMAIL },
  to: [{ email: 'lucasbeathyate@gmail.com' }],
  subject,
  htmlContent: htmlBody,
  textContent: plainText,
  replyTo: { email: SENDER_EMAIL },
  tags: ['aclaracion-fecha-evento']
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
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('✅ Enviado a lucasbeathyate@gmail.com. Status:', res.statusCode, 'Response:', d));
});
req.on('error', e => console.error(e));
req.write(payload);
req.end();
