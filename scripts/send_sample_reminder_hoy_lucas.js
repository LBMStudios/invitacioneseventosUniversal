const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const TARGET_EMAIL = 'lucasbeathyate@gmail.com';

function buildHtmlReminder(guest) {
  const firstName = (guest.name || 'Lucas').trim().split(/\s+/)[0];
  const url = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${encodeURIComponent(guest.code || 'DEMO-UA-2026')}`;
  const seats = Number(guest.totalSeats) || 2;
  const companionTxt = guest.companion === 'Sí' && guest.companionName ? guest.companionName : (seats > 1 ? `${seats - 1} Acompañante(s)` : 'Pase individual');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>¡Hoy es el gran día! Función Especial Coyote vs. Acme</title>
<style>
  @media only screen and (max-width:600px){
    .card{width:100%!important;border-radius:16px!important;}
    .pad{padding:20px 16px!important;}
    .btn{display:block!important;width:100%!important;padding:16px 20px!important;box-sizing:border-box!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">¡Hoy nos vemos en Movie Montevideo Shopping! Recepción 19:30 hs · Función puntual 20:00 hs.</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center">

<table role="presentation" class="card" width="520" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%;background-color:#0b2149;border:2px solid #ee1f73;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.5);">

<!-- HEADER -->
<tr><td class="pad" style="padding:22px 28px;background-color:#071938;border-bottom:1px solid rgba(238,31,115,0.3);text-align:left;">
  <div style="font-size:17px;font-weight:900;color:#ffffff;letter-spacing:0.8px;">UNIVERSAL ASSISTANCE</div>
  <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:1px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>

<!-- BODY -->
<tr><td class="pad" style="padding:32px 28px;background-color:#0b2149;">
  <div style="font-size:11px;font-weight:900;color:#ee1f73;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">🎬 ¡HOY ES EL GRAN DÍA!</div>
  <h1 style="margin:0 0 16px 0;color:#ffffff;font-size:26px;font-weight:900;line-height:1.2;text-transform:uppercase;">TE ESPERAMOS ESTA NOCHE</h1>

  <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#e2e8f0;">
    ¡Hola <strong style="color:#ffffff;">${firstName}</strong>! 👋<br>
    Llegó el momento de compartir juntos la <strong>Función Especial y Exclusiva de Coyote vs. Acme</strong>.
  </p>

  <!-- TARJETA DE ACCESO RÁPIDO -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;border:2px solid #38bdf8;border-radius:16px;margin-bottom:24px;">
  <tr><td style="padding:20px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding-bottom:10px;font-size:14px;color:#cbd5e1;">
          🗓️ <strong>Fecha:</strong> <span style="color:#ffffff;font-weight:bold;">HOY JUEVES 27 DE AGOSTO</span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:10px;font-size:14px;color:#cbd5e1;">
          ⏰ <strong>Horario:</strong> <span style="color:#ffffff;font-weight:bold;">19:30 hs (Recepción y Photocall) · 20:00 hs (Función puntual)</span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:10px;font-size:14px;color:#cbd5e1;">
          📍 <strong>Lugar:</strong> <span style="color:#ffffff;font-weight:bold;">Movie Montevideo Shopping</span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:10px;font-size:14px;color:#cbd5e1;">
          🎟️ <strong>Lugares confirmados:</strong> <span style="color:#38bdf8;font-weight:bold;">${seats} butaca(s)</span> (${companionTxt})
        </td>
      </tr>
      <tr>
        <td style="font-size:14px;color:#cbd5e1;">
          🍿 <strong>Incluye:</strong> <span style="color:#38bdf8;font-weight:bold;">Pop y bebida cortesía de Universal Assistance</span>
        </td>
      </tr>
    </table>
  </td></tr>
  </table>

  <!-- BOTON VER ENTRADA -->
  <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 24px auto;width:100%;">
  <tr><td align="center">
    <a href="${url}" class="btn" style="display:inline-block;background-color:#ee1f73;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;padding:16px 36px;border-radius:999px;letter-spacing:0.5px;box-shadow:0 6px 20px rgba(238,31,115,0.45);text-transform:uppercase;" target="_blank">
      🎟️ Ver Mi Entrada y Código QR
    </a>
  </td></tr>
  </table>

  <div style="background-color:#16356e;border-left:4px solid #38bdf8;padding:12px 16px;border-radius:8px;margin-bottom:24px;font-size:13px;color:#e2e8f0;line-height:1.5;">
    💡 <strong>Ingreso ágil:</strong> Al llegar al cine, solo debés mostrar tu código QR desde tu celular en el puesto de acreditación de Universal Assistance.
  </div>

  <div style="font-size:13px;color:#94a3b8;text-align:center;line-height:1.5;">
    ¡Te esperamos para vivir una noche inolvidable!<br>
    <strong style="color:#ffffff;">Equipo de Universal Assistance Uruguay</strong>
  </div>
</td></tr>

<!-- FOOTER -->
<tr><td style="padding:16px 24px;background-color:#071938;text-align:center;border-top:1px solid rgba(255,255,255,0.1);">
  <div style="font-size:11px;color:rgba(255,255,255,0.5);">
    Pase Oficial: <strong style="color:#38bdf8;">${guest.code || 'DEMO-UA-2026'}</strong> · Función Privada Exclusiva
  </div>
</td></tr>

</table>

</td></tr></table>
</body>
</html>`;
}

function sendBrevoEmail(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, data: body });
        } else {
          resolve({ ok: false, status: res.statusCode, error: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log(`🎬 Enviando nueva muestra de recordatorio sin 'Sala 2' a ${TARGET_EMAIL}...`);

  const mockGuest = {
    name: 'Lucas Rossi',
    code: '79efc3aa',
    totalSeats: 2,
    companion: 'Sí',
    companionName: '1 Acompañante'
  };

  const html = buildHtmlReminder(mockGuest);
  const subject = '🎬 ¡Hoy es el gran día! Avant Premiere Coyote vs. Acme · Universal Assistance';

  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: TARGET_EMAIL, name: mockGuest.name }],
    subject: subject,
    htmlContent: html,
    replyTo: { email: SENDER_EMAIL }
  };

  const res = await sendBrevoEmail(payload);
  console.log('Resultado Brevo:', res);
}

main();
