const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function sendBrevo(toEmail, subject, htmlBody, plainText) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject,
      htmlContent: htmlBody,
      textContent: plainText,
      replyTo: { email: SENDER_EMAIL },
      tags: ['invitacion-evento-cine']
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
          resolve(data);
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

function buildInvitationHtml(name, code) {
  const firstName = name.split(' ')[0];
  const url = `${LANDING_URL}?i=${encodeURIComponent(code)}`;

  return `<!doctype html>
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
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center">
<table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;">

<tr><td class="pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
  <div style="font-size:18px;font-weight:900;color:#ffffff;letter-spacing:0.5px;">UNIVERSAL ASSISTANCE</div>
  <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>

<tr><td class="pad" style="padding:28px 24px;background-color:#0b2149;">
  <div style="font-size:12px;font-weight:700;color:#38bdf8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Te invitamos a una función exclusiva</div>
  <h1 style="margin:0 0 20px 0;color:#ffffff;font-size:28px;font-weight:900;line-height:1.15;text-transform:uppercase;">COYOTE VS ACME</h1>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:20px;">
  <tr><td style="padding:14px;">
    <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">INVITADO/A ESPECIAL</div>
    <div style="font-size:19px;font-weight:900;color:#ffffff;">${name}</div>
  </td></tr>
  </table>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
  <tr>
    <td width="50%" style="vertical-align:top;padding-right:8px;">
      <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">FECHA Y HORA</div>
      <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">Jueves 27 de Agosto · 20:00 hs</div>
      <div style="font-size:11px;color:#cbd5e1;margin-top:1px;">Recepción: 19:30 hs</div>
    </td>
    <td width="50%" style="vertical-align:top;padding-left:8px;">
      <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">LUGAR</div>
      <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">Movie Montevideo Shopping</div>
      <div style="font-size:11px;color:#cbd5e1;margin-top:1px;">Pop y bebida incluidos 🍿</div>
    </td>
  </tr>
  </table>

  <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 20px auto;">
  <tr><td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.4);">
    <a href="${url}" style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;border-radius:999px;">
      Confirmar mi Asistencia
    </a>
  </td></tr>
  </table>

  <div style="font-size:11px;color:rgba(255,255,255,0.55);text-align:center;">
    Los lugares son limitados. Tu código: <strong style="color:#38bdf8;">${code}</strong>
  </div>
</td></tr>

<tr><td style="padding:16px 20px;background-color:#071938;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
  <div style="font-weight:900;font-size:12px;color:#ffffff;">UNIVERSAL ASSISTANCE URUGUAY</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

(async () => {
  const name = 'Valeria Amaral';
  const email = 'valeria.amaral@gmail.com';
  const code = 'UA-4F91B2C8';
  const subject = `${name.split(' ')[0]}, tenés una invitación exclusiva de Universal Assistance · Coyote vs. Acme`;

  console.log(`Enviando invitación a ${name} <${email}> (${code})...`);
  const html = buildInvitationHtml(name, code);
  const plainText = `Hola Valeria, Universal Assistance te invita a la función exclusiva de Coyote vs. Acme el Jueves 27 de Agosto a las 19:30 hs en Movie Montevideo Shopping. Confirmá tu lugar aquí: ${LANDING_URL}?i=${code}`;

  const res = await sendBrevo(email, subject, html, plainText);
  console.log('✅ Enviado vía Brevo:', res);

  // Actualizar estado en la base de datos
  await getJSON(`${WEBAPP_URL}?action=markSent&code=${code}&email=${encodeURIComponent(email)}`);
  console.log('✅ Estado actualizado en la base de datos.');
})();
