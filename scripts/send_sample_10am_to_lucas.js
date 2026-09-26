const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const TO_EMAIL = 'lucasbeathyate@gmail.com';
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

function buildMorningSampleHtml() {
  const code = 'UA-DEMO-SAMPLE';
  const invitationUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
  const qrImgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(invitationUrl) + '&color=071938&bgcolor=ffffff';

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @media only screen and (max-width: 600px) {
        .ticket-card { width: 100% !important; border-radius: 16px !important; }
        .ticket-pad { padding: 18px 16px !important; }
        .ticket-title { font-size: 24px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#071938;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:16px 8px;">
      <tr>
        <td align="center">
          
          <table role="presentation" class="ticket-card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;">
            
            <!-- ENCABEZADO -->
            <tr>
              <td class="ticket-pad" style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
                <div style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">UNIVERSAL ASSISTANCE</div>
                <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
              </td>
            </tr>

            <!-- CUERPO PRINCIPAL -->
            <tr>
              <td class="ticket-pad" style="padding:24px 24px 16px 24px;background-color:#0b2149;">
                <div style="font-size:13px;font-weight:900;color:#38bdf8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">⏰ RECORDATORIO DE TU ENTRADA</div>
                <h1 class="ticket-title" style="margin:0;color:#ffffff;font-size:28px;font-weight:900;line-height:1.15;text-transform:uppercase;">COYOTE VS ACME</h1>
                
                <!-- RECUADRO TITULAR -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;">
                  <tr>
                    <td style="padding:14px;">
                      <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">INVITADO CONFIRMADO</div>
                      <div style="font-size:19px;font-weight:900;color:#ffffff;line-height:1.2;">Lucas Beathyate</div>
                      <div style="font-size:12px;color:#e2e8f0;margin-top:3px;font-weight:600;">Acceso para 2 personas (Vos + Acompañante)</div>
                    </td>
                  </tr>
                </table>

                <!-- DATOS DEL EVENTO -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
                  <tr>
                    <td width="50%" style="vertical-align:top;padding-right:8px;">
                      <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">FECHA Y HORA</div>
                      <div style="font-size:14px;font-weight:800;color:#ffffff;margin-top:2px;">Jueves 27 de Agosto · 20:00 hs</div>
                      <div style="font-size:11px;color:#cbd5e1;margin-top:1px;">Recepción: 19:30 hs</div>
                    </td>
                    <td width="50%" style="vertical-align:top;padding-left:8px;">
                      <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;">LUGAR</div>
                      <div style="font-size:14px;font-weight:800;color:#ffffff;margin-top:2px;">Movie Montevideo Shopping</div>
                      <div style="font-size:11px;color:#cbd5e1;margin-top:1px;">🍿 Pop & Refresco incluidos</div>
                    </td>
                  </tr>
                </table>

                <!-- RECUADRO QR -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;background-color:#ffffff;border-radius:16px;text-align:center;">
                  <tr>
                    <td style="padding:20px;" align="center">
                      <div style="font-size:11px;font-weight:800;color:#071938;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">TU CÓDIGO QR DE ACCESO</div>
                      <img src="${qrImgUrl}" width="160" height="160" alt="QR Code" style="display:block;margin:0 auto;border:0;">
                      <div style="font-size:13px;font-weight:900;color:#071938;letter-spacing:1.5px;margin-top:10px;">${code}</div>
                      <div style="font-size:10px;color:#64748b;margin-top:2px;">Presentá este código en la entrada</div>
                    </td>
                  </tr>
                </table>

                <!-- BOTON -->
                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:20px auto 0 auto;">
                  <tr>
                    <td align="center" style="background-color:#ee1f73;border-radius:999px;">
                      <a href="${invitationUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;border-radius:999px;">
                        Ver Mi Entrada Digital en el Celular
                      </a>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:16px 20px;background-color:#071938;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
                <div style="font-weight:900;font-size:12px;color:#ffffff;">UNIVERSAL ASSISTANCE URUGUAY</div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

(async () => {
  const subject = `⏰ [EJEMPLO 10 AM] Recordatorio de Función Especial - Coyote vs. Acme | Universal Assistance (UA-DEMO)`;
  const html = buildMorningSampleHtml();
  const plainText = `Ejemplo del correo enviado a las 10:00 hs: Recordatorio de Función Especial Coyote vs. Acme para Lucas Beathyate.`;

  console.log(`Enviando ejemplo del mail de las 10 AM a ${TO_EMAIL}...`);
  const res = await sendBrevo(TO_EMAIL, subject, html, plainText);
  console.log('✅ Enviado con éxito a lucasb@ua.com.uy:', res);
})();
