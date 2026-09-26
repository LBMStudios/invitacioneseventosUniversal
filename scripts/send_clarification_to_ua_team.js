const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasbeathyate@gmail.com';
const SENDER_NAME = 'Universal Assistance Uruguay';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';

function sendBrevo(toEmail, subject, htmlBody, plainText) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject,
      htmlContent: htmlBody,
      textContent: plainText,
      replyTo: { email: 'lucasb@ua.com.uy' }
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

function buildHtml(name, code) {
  const firstName = name.split(' ')[0];
  const url = LANDING_URL + '?i=' + encodeURIComponent(code);
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#071938;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center">
<table role="presentation" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;">
<tr><td style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
  <div style="font-size:18px;font-weight:900;color:#ffffff;letter-spacing:0.5px;">UNIVERSAL ASSISTANCE</div>
  <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>
<tr><td style="padding:28px 24px;background-color:#0b2149;">
  <div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">COMUNICADO OFICIAL</div>
  <h1 style="margin:0 0 16px 0;color:#ffffff;font-size:24px;font-weight:900;line-height:1.2;text-transform:uppercase;">ACLARACIÓN DE FECHA</h1>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:20px;">
  <tr><td style="padding:16px;">
    <div style="font-size:14px;color:#ffffff;line-height:1.6;">
      Estimado/a <strong>${firstName}</strong>,<br><br>
      Te escribimos para realizar una aclaración respecto al correo enviado anteriormente. La función especial y exclusiva de <strong>Coyote vs. Acme</strong> se llevará a cabo el:
    </div>
    <div style="margin-top:14px;padding:12px;background-color:#071938;border-left:4px solid #ee1f73;border-radius:6px;font-size:16px;font-weight:900;color:#ffffff;">
      🗓️ JUEVES 27 DE AGOSTO · 19:30 HS<br>
      <span style="font-size:13px;font-weight:600;color:#38bdf8;">(Recepción 19:30 hs · Función puntual 20:00 hs)</span>
    </div>
  </td></tr>
  </table>

  <div style="font-size:13px;color:#cbd5e1;line-height:1.6;margin-bottom:20px;">
    📍 <strong>Lugar:</strong> Movie Montevideo Shopping<br>
    🎟️ <strong>Tus lugares:</strong> Ya están confirmados y reservados.<br>
    🍿 <strong>Pop y bebida:</strong> Cortesía de Universal Assistance.
  </div>

  <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 20px auto;">
  <tr><td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.4);">
    <a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;border-radius:999px;">
      Ver Mi Entrada y QR de Acceso
    </a>
  </td></tr>
  </table>

  <div style="font-size:11px;color:rgba(255,255,255,0.55);text-align:center;">
    Código de reserva: <strong style="color:#38bdf8;">${code}</strong>
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
  const subject = 'Aclaración importante: Fecha de la función especial · Universal Assistance (Jueves 27 de Agosto)';
  
  console.log('1. Enviando a Sofia Ramirez (emisiones@ua.com.uy)...');
  const res1 = await sendBrevo('emisiones@ua.com.uy', subject, buildHtml('Sofia Ramirez', 'UA-1D94AFD0'), 'Aclaración: La función especial es el Jueves 27 de Agosto a las 19:30 hs en Movie Montevideo Shopping.');
  console.log('✅ Enviado a Sofia:', res1);

  console.log('\n2. Enviando a Ana Camiou (acamiou@ua.com.uy)...');
  const res2 = await sendBrevo('acamiou@ua.com.uy', subject, buildHtml('Ana Camiou', 'UA-A73CA7A0'), 'Aclaración: La función especial es el Jueves 27 de Agosto a las 19:30 hs en Movie Montevideo Shopping.');
  console.log('✅ Enviado a Ana:', res2);
})();
