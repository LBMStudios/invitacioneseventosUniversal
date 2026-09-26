const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';

const EVENT_DATE = '27/08/2026';
const EVENT_TIME = '20:00';
const ARRIVAL_TIME = '19:30';
const VENUE = 'Movie Montevideo Shopping';
const MAPS_URL = 'https://maps.google.com/?q=Movie+Montevideo+Shopping';
const PHONE = '2901 7378';

function buildEmail(guestName, code) {
  const invUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
  const fn = guestName.trim().split(/\s+/)[0] || 'Lucas';
  
  const subject = `Universal Assistance te invita a la función exclusiva de Coyote vs. Acme`;
  
  const htmlBody = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#040f26;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#040f26;padding:24px 8px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background-color:#071938;border-radius:18px;overflow:hidden;border:1px solid #1a3668;box-shadow:0 18px 40px rgba(0,0,0,0.55);" cellspacing="0" cellpadding="0" border="0">
        
        <!-- HEADER / LOGO -->
        <tr>
          <td align="center" style="background:linear-gradient(135deg, #071938 0%, #0a2552 100%);padding:28px 24px 20px;border-bottom:1px solid #163260;">
            <img src="https://ua-eventos-uy.web.app/assets/logo-ua-white.png" alt="Universal Assistance" width="180" style="display:block;border:0;max-width:180px;height:auto;margin:0 auto 12px;" />
            <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#38bdf8;font-weight:700;">FUNCI&Oacute;N EXCLUSIVA &middot; MOVIE MONTEVIDEO SHOPPING</div>
          </td>
        </tr>

        <!-- HERO / POSTER BANNER -->
        <tr>
          <td align="center" style="padding:0;background-color:#020917;">
            <a href="${invUrl}" target="_blank" style="display:block;text-decoration:none;">
              <img src="https://ua-eventos-uy.web.app/assets/og-preview.png" alt="Coyote vs. Acme" width="580" style="display:block;width:100%;max-width:580px;height:auto;border:0;" />
            </a>
          </td>
        </tr>

        <!-- CONTENIDO PRINCIPAL -->
        <tr>
          <td style="padding:28px 28px 20px;color:#ffffff;text-align:center;">
            <div style="font-size:12px;font-weight:800;color:#f43f5e;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">INVITACI&Oacute;N ESPECIAL</div>
            <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:900;color:#ffffff;">
              &iexcl;HOLA, ${fn.toUpperCase()}!
            </h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#cbd5e1;">
              En <strong>Universal Assistance</strong> queremos invitarte a compartir una noche inolvidable en pantalla grande con la función exclusiva de <strong>Coyote vs. Acme</strong>.
            </p>
            <div style="display:inline-block;background:rgba(238,31,115,0.12);border:1px solid rgba(238,31,115,0.35);padding:6px 14px;border-radius:999px;font-size:12px;color:#fda4af;font-weight:700;margin-bottom:20px;">
              🎟️ Invitación personal e intransferible &middot; Pop y bebida incluidos
            </div>

            <!-- DETALLES DEL EVENTO -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0c224a;border:1px solid #1d427d;border-radius:14px;margin:0 0 24px;text-align:left;">
              <tr>
                <td style="padding:18px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#ffffff;">
                        <span style="font-size:18px;vertical-align:middle;margin-right:8px;">📅</span>
                        <strong>Fecha:</strong> Jueves ${EVENT_DATE}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#ffffff;">
                        <span style="font-size:18px;vertical-align:middle;margin-right:8px;">⏰</span>
                        <strong>Horario:</strong> ${ARRIVAL_TIME} hs Recepci&oacute;n y acreditaci&oacute;n &middot; <strong>${EVENT_TIME} hs Inicio puntual</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#ffffff;">
                        <span style="font-size:18px;vertical-align:middle;margin-right:8px;">📍</span>
                        <strong>Lugar:</strong> <a href="${MAPS_URL}" target="_blank" style="color:#38bdf8;text-decoration:underline;">${VENUE}</a> (Sala exclusiva)
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#ffffff;">
                        <span style="font-size:18px;vertical-align:middle;margin-right:8px;">🍿</span>
                        <strong>Beneficio:</strong> Pop y bebida incluidos de cortes&iacute;a
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- BOTON CTA -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 20px;">
              <tr>
                <td align="center" style="border-radius:999px;background:#ee1f73;box-shadow:0 8px 24px rgba(238,31,115,0.45);">
                  <a href="${invUrl}" target="_blank" style="display:inline-block;padding:15px 36px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:1px;border-radius:999px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                    Confirmar mi Asistencia &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.4;">
              &bull; <strong>CUPOS LIMITADOS</strong> &bull;<br/>
              Te solicitamos confirmar tu asistencia a la brevedad para reservar tu lugar y el de tu acompa&ntilde;ante.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#030b1c;padding:20px;text-align:center;border-top:1px solid #14274c;color:#64748b;font-size:11px;line-height:1.6;">
            Universal Assistance Uruguay &middot; Funci&oacute;n Exclusiva 2026<br/>
            C&oacute;digo de invitaci&oacute;n: <strong style="color:#94a3b8;">${code}</strong> &middot; Tel: ${PHONE}<br/>
            <span style="color:#475569;">Por consultas, respond&eacute; directamente a este correo.</span>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, htmlBody };
}

function sendBrevoEmail(toEmail, toName, subject, htmlContent) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail, name: toName }],
      replyTo: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: subject,
      htmlContent: htmlContent
    });

    const req = https.request({
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, messageId: json.messageId });
          } else {
            reject(new Error(`Brevo HTTP ${res.statusCode}: ${json.message || data}`));
          }
        } catch (e) {
          reject(new Error(`Error parsing response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTest() {
  const targetEmail = 'lucasbeathyate@gmail.com';
  const targetName = 'Lucas Beathyate';
  const testCode = 'UA-DEMO-TEST';

  console.log(`Enviando correo de prueba a: ${targetName} <${targetEmail}>...`);
  const emailData = buildEmail(targetName, testCode);

  try {
    const result = await sendBrevoEmail(targetEmail, targetName, emailData.subject, emailData.htmlBody);
    console.log('✅ Correo de prueba enviado con éxito!');
    console.log('ID del Mensaje Brevo:', result.messageId);
    console.log('Asunto:', emailData.subject);
  } catch (err) {
    console.error('❌ Error al enviar:', err.message);
  }
}

runTest();
