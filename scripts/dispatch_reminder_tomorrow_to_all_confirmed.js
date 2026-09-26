const https = require('https');
const fs = require('fs');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const SUBJECT = `Nos vemos mañana jueves 27 de Agosto · Función Coyote vs. Acme`;

function generateHtml(guest) {
  const guestName = guest.name || 'Invitado/a';
  const code = guest.code;
  const companionName = guest.companionName || '';
  const totalSeats = Number(guest.totalSeats) || 1;
  const passUrl = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${code}`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SUBJECT}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .card { width: 100% !important; border-radius: 16px !important; }
      .pad { padding: 20px 16px !important; }
      .title { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ¡Todo listo para mañana! Tené a mano tu Pase VIP y código de acceso para ingresar a la sala.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" class="card" width="500" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:500px;width:100%;background-color:#0b2149;border:2px solid #ee1f73;border-radius:20px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <tr>
            <td class="pad" style="padding:22px 28px;background-color:#071938;border-bottom:1px solid rgba(238,31,115,0.3);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:18px;font-weight:900;color:#ffffff;letter-spacing:1px;">UNIVERSAL ASSISTANCE</div>
                    <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
                  </td>
                  <td align="right">
                    <span style="background:rgba(238,31,115,0.2);border:1px solid #ee1f73;color:#ff4d8d;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;">CONFIRMADO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="pad" style="padding:28px 28px;background-color:#0b2149;">
              
              <!-- Announcement Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e1b4b;border:2px solid #ee1f73;border-radius:14px;margin-bottom:22px;">
                <tr>
                  <td style="padding:18px;text-align:center;">
                    <div style="font-size:12px;font-weight:900;color:#ee1f73;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">🎬 ¡NOS VEMOS MAÑANA!</div>
                    <div style="font-size:18px;font-weight:900;color:#ffffff;line-height:1.3;">Jueves 27 de Agosto</div>
                    <div style="font-size:13px;color:#38bdf8;font-weight:700;margin-top:4px;">Función Especial Exclusiva: Coyote vs. Acme</div>
                  </td>
                </tr>
              </table>

              <div style="font-size:15px;color:#ffffff;line-height:1.6;margin-bottom:14px;">
                Hola <strong style="color:#38bdf8;">${guestName}</strong>,
              </div>

              <div style="font-size:14px;color:#cbd5e1;line-height:1.6;margin-bottom:22px;">
                ¡Ya está todo listo para recibirte mañana! Te recordamos tener a mano tu <strong>Pase VIP Digital</strong> o tu <strong>código de invitación</strong> al momento de ingresar a la sala para agilizar la acreditación.
              </div>

              <!-- Ticket Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#112a59;border:1px solid #38bdf8;border-radius:14px;margin-bottom:20px;">
                <tr>
                  <td style="padding:18px;">
                    <div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">🎟️ DETALLES DE TU ENTRADA</div>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;color:#ffffff;">
                      <tr>
                        <td style="padding:4px 0;color:#94a3b8;width:110px;">Titular:</td>
                        <td style="padding:4px 0;font-weight:700;color:#ffffff;">${guestName}</td>
                      </tr>
                      ${totalSeats >= 2 && companionName ? `
                      <tr>
                        <td style="padding:4px 0;color:#94a3b8;">Acompañante:</td>
                        <td style="padding:4px 0;font-weight:700;color:#ffffff;">${companionName}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding:4px 0;color:#94a3b8;">Lugares:</td>
                        <td style="padding:4px 0;font-weight:700;color:#4ade80;">${totalSeats} ${totalSeats === 1 ? 'Entrada' : 'Entradas'}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#94a3b8;">Horario:</td>
                        <td style="padding:4px 0;font-weight:700;color:#ffffff;">20:00 hs <span style="font-size:11px;color:#38bdf8;">(Acreditación desde 19:30 hs)</span></td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#94a3b8;">Lugar:</td>
                        <td style="padding:4px 0;font-weight:700;color:#ffffff;">Movie Montevideo Shopping</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#94a3b8;">Código:</td>
                        <td style="padding:4px 0;font-weight:900;color:#ee1f73;letter-spacing:1px;">${code}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 22px auto;">
                <tr>
                  <td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 6px 20px rgba(238,31,115,0.45);">
                    <a href="${passUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;border-radius:999px;letter-spacing:0.5px;">
                      📱 Ver mi Pase VIP y Código QR ➔
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Tip de ingreso -->
              <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:12px 16px;text-align:center;margin-bottom:18px;">
                <div style="font-size:12px;color:#cbd5e1;line-height:1.4;">
                  💡 <strong>Tip de ingreso:</strong> Podés mostrar el código QR directamente desde la pantalla de tu celular en el acceso a la sala.
                </div>
              </div>

              <!-- RECUADRO DESTACADO: AVISO SI NO PUEDEN ASISTIR -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:rgba(238,31,115,0.12);border:1.5px dashed #ee1f73;border-radius:12px;margin-bottom:10px;">
                <tr>
                  <td style="padding:16px;text-align:center;">
                    <div style="font-size:13px;font-weight:800;color:#ff4d8d;margin-bottom:6px;">
                      ⚠️ ¿Tuviste algún imprevisto y no vas a poder asistir?
                    </div>
                    <div style="font-size:12px;color:#e2e8f0;line-height:1.5;">
                      Como los cupos de la sala están 100% agotados, <strong>te pedimos por favor que nos respondas a este correo cuanto antes</strong> si no podés concurrir. De esa manera podremos reasignar tus lugares a los invitados que están en <strong>Lista de Espera</strong>.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 24px;background-color:#071938;text-align:center;border-top:1px solid rgba(56,189,248,0.3);">
              <div style="font-weight:900;font-size:12px;color:#ffffff;letter-spacing:0.5px;">UNIVERSAL ASSISTANCE URUGUAY</div>
              <div style="font-size:11px;color:#38bdf8;margin-top:4px;font-weight:700;">
                Tel: 2901 7378 &nbsp;|&nbsp;
                <a href="mailto:lucasb@ua.com.uy" style="color:#ffffff;text-decoration:underline;">lucasb@ua.com.uy</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function sendBrevoEmail(guest) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: guest.email, name: guest.name }],
      subject: SUBJECT,
      htmlContent: generateHtml(guest)
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
        const success = res.statusCode === 200 || res.statusCode === 201;
        resolve({
          email: guest.email,
          name: guest.name,
          code: guest.code,
          statusCode: res.statusCode,
          success,
          response: body
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        email: guest.email,
        name: guest.name,
        code: guest.code,
        statusCode: 0,
        success: false,
        error: err.message
      });
    });

    req.write(postData);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function dispatchAllConfirmed() {
  console.log('====================================================');
  console.log('DESPACHO DE RECORDATORIO: JUEVES 27 DE AGOSTO');
  console.log('DESTINATARIOS: EXCLUSIVAMENTE CONFIRMADOS');
  console.log('====================================================\n');

  if (!fs.existsSync('confirmed_dispatch_list.json')) {
    console.error('No se encontró confirmed_dispatch_list.json');
    process.exit(1);
  }

  const listData = JSON.parse(fs.readFileSync('confirmed_dispatch_list.json', 'utf8'));
  const recipients = listData.recipients || [];

  console.log(`Total confirmados a despachar: ${recipients.length}\n`);

  const results = [];
  let sentCount = 0;
  let errorCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    const guest = recipients[i];
    process.stdout.write(`[${i + 1}/${recipients.length}] Enviando a ${guest.name} <${guest.email}> (${guest.code})... `);

    const res = await sendBrevoEmail(guest);
    results.push(res);

    if (res.success) {
      sentCount++;
      console.log(`✅ OK`);
    } else {
      errorCount++;
      console.log(`❌ ERROR (${res.statusCode}): ${res.response || res.error}`);
    }

    // Pequeño delay de 120ms entre envíos para cumplir rate limit de Brevo
    await sleep(120);
  }

  console.log('\n====================================================');
  console.log('RESUMEN FINAL DE DESPACHO');
  console.log('====================================================');
  console.log(`  ✅ Exitosos: ${sentCount}`);
  console.log(`  ❌ Errores: ${errorCount}`);
  console.log(`  Total Procesados: ${results.length}`);

  fs.writeFileSync('dispatch_report_reminder_tomorrow.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    total: results.length,
    sentCount,
    errorCount,
    results
  }, null, 2));

  console.log('\nReporte detallado guardado en dispatch_report_reminder_tomorrow.json');
}

dispatchAllConfirmed().catch(console.error);
