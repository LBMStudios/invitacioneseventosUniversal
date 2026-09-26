const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';

const recipientEmail = 'lucasbeathyate@gmail.com';
const guestName = 'Lucas';

// Ejemplo con 4 invitaciones para el equipo
const demoPasses = [
  { name: 'Lucas Rossi (Titular)', code: 'UA-DEMO-001', agency: 'SEMM' },
  { name: 'Pase Equipo 2', code: 'UA-DEMO-002', agency: 'SEMM' },
  { name: 'Pase Equipo 3', code: 'UA-DEMO-003', agency: 'SEMM' },
  { name: 'Pase Equipo 4', code: 'UA-DEMO-004', agency: 'SEMM' }
];

const subject = `Lucas, ¡faltan pocos días! Tus 4 invitaciones para la función especial de cine`;

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const passesHtml = demoPasses.map((p, idx) => {
  const invUrl = `${LANDING_URL}?i=${encodeURIComponent(p.code)}`;
  return `
    <div style="background:#16356e; border:1px solid #38bdf8; border-radius:12px; padding:16px; margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px;">🎟️ PASE ${idx + 1} · ${esc(p.name)}</span>
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

const htmlBody = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>@media only screen and (max-width:600px){.card{width:100%!important;border-radius:16px!important;}.pad{padding:18px 16px!important;}.title{font-size:24px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tus 4 invitaciones para Coyote vs. Acme. Confirmá los lugares de tu equipo.</div>
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
<div style="font-size:14px;font-weight:800;color:#ffffff;line-height:1.4;">Hola <span style="color:#38bdf8;">Lucas</span>, tenés <strong>${demoPasses.length} invitaciones reservadas</strong> para la función especial de <strong style="color:#ffffff;">Coyote vs. Acme</strong>.</div>
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
