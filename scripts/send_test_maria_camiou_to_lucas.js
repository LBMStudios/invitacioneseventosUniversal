const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';

function sendBrevo(toEmail, toName, subject, htmlBody, plainText) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent: htmlBody,
      textContent: plainText,
      replyTo: { email: SENDER_EMAIL },
      tags: ['test-confirmacion-maria-camiou']
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
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Brevo HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function buildConfirmationHtml(guestName, code, seats) {
  const invUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
  const qrImgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(invUrl) + '&color=071938&bgcolor=ffffff';
  const seatsText = seats === 1 ? 'Acceso individual (1 persona)' : (seats === 2 ? 'Acceso para 2 personas (Vos + 1)' : `Acceso para ${seats} personas`);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @media only screen and (max-width:600px){
    .card{width:100%!important;border-radius:16px!important;}
    .pad{padding:20px 16px!important;}
    .col{display:block!important;width:100%!important;padding:0 0 12px 0!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center">
<table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #34d399;border-radius:20px;overflow:hidden;">

<!-- Header -->
<tr><td class="pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
  <div style="font-size:18px;font-weight:900;color:#ffffff;letter-spacing:0.5px;">UNIVERSAL ASSISTANCE</div>
  <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>

<!-- Body -->
<tr><td class="pad" style="padding:28px 24px;background-color:#0b2149;">

  <!-- Confirmada Banner -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#064e3b;border:2px solid #34d399;border-radius:12px;margin-bottom:20px;">
    <tr><td style="padding:14px;text-align:center;">
      <div style="font-size:12px;font-weight:900;color:#34d399;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">✓ ASISTENCIA CONFIRMADA</div>
      <div style="font-size:14px;font-weight:800;color:#ffffff;">Tu lugar está reservado para el <span style="color:#34d399;">Jueves 27 de Agosto</span>.</div>
    </td></tr>
  </table>

  <div style="font-size:12px;font-weight:700;color:#38bdf8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Función Exclusiva Avant Première</div>
  <h1 style="margin:0 0 20px 0;color:#ffffff;font-size:28px;font-weight:900;line-height:1.15;text-transform:uppercase;">COYOTE VS ACME</h1>

  <!-- Guest Details Box -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:20px;">
  <tr><td style="padding:14px;">
    <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">INVITADO/A CONFIRMADO/A · BUEMES</div>
    <div style="font-size:19px;font-weight:900;color:#ffffff;">${guestName}</div>
    <div style="font-size:12px;font-weight:700;color:#34d399;margin-top:4px;">🎟️ ${seatsText}</div>
  </td></tr>
  </table>

  <!-- Event Details Grid -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
  <tr>
    <td class="col" width="50%" style="vertical-align:top;padding-right:8px;">
      <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">FECHA Y HORA</div>
      <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">Jueves 27 de Agosto · 20:00 hs</div>
      <div style="font-size:11px;color:#cbd5e1;margin-top:1px;">Recepción: 19:30 hs</div>
    </td>
    <td class="col" width="50%" style="vertical-align:top;padding-left:8px;">
      <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">LUGAR</div>
      <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">Movie Montevideo Shopping</div>
      <div style="font-size:11px;color:#cbd5e1;margin-top:1px;">Pop y refresco incluidos 🍿</div>
    </td>
  </tr>
  </table>

  <!-- QR Code Box -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;border:1px solid rgba(56,189,248,0.4);border-radius:16px;margin-bottom:24px;text-align:center;">
  <tr><td style="padding:20px;text-align:center;">
    <div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">TU CÓDIGO QR DE ACREDITACIÓN</div>
    <img src="${qrImgUrl}" width="160" height="160" alt="QR Acceso" style="display:inline-block;border-radius:8px;background-color:#ffffff;padding:8px;">
    <div style="font-size:13px;font-weight:900;color:#ffffff;margin-top:10px;letter-spacing:1px;">CÓDIGO: <span style="color:#38bdf8;">${code}</span></div>
  </td></tr>
  </table>

  <!-- CTA Button -->
  <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 20px auto;">
  <tr><td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.4);">
    <a href="${invUrl}" style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;border-radius:999px;">
      Ver Mi Pase Digital VIP
    </a>
  </td></tr>
  </table>

  <div style="font-size:11px;color:rgba(255,255,255,0.6);text-align:center;line-height:1.4;">
    Presentá este código QR en tu celular al momento de ingresar a la sala.<br>
    ¡Te esperamos para compartir una gran noche de cine!
  </div>
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 20px;background-color:#071938;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
  <div style="font-weight:900;font-size:12px;color:#ffffff;">UNIVERSAL ASSISTANCE URUGUAY</div>
  <div style="font-size:11px;color:#38bdf8;margin-top:4px;font-weight:700;">Tel: 2901 7378 &nbsp;|&nbsp; lucasb@ua.com.uy</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

async function run() {
  const testRecipients = [
    { email: 'lucasb@ua.com.uy', name: 'Lucas Rossi' },
    { email: 'lucasbeathyate@gmail.com', name: 'Lucas Rossi' }
  ];

  const guestName = 'Maria Camiou';
  const code = 'UA-96126517';
  const seats = 1;

  const subject = `[PRUEBA] Confirmación de Asistencia · Coyote vs. Acme | Universal Assistance (${code})`;
  const html = buildConfirmationHtml(guestName, code, seats);
  const plain = `Hola ${guestName}, tu asistencia para la función exclusiva de Coyote vs. Acme el Jueves 27 de Agosto a las 19:30 hs en Movie Montevideo Shopping ha quedado confirmada. Accedé a tu pase VIP con QR aquí: ${LANDING_URL}?i=${code}`;

  for (const r of testRecipients) {
    try {
      console.log(`Enviando correo de prueba a ${r.name} <${r.email}>...`);
      const res = await sendBrevo(r.email, r.name, subject, html, plain);
      console.log(`✅ Enviado a ${r.email}. MessageId: ${res.messageId}`);
    } catch (err) {
      console.error(`❌ Error enviando a ${r.email}:`, err.message);
    }
  }
}

run();
