const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';
const TARGET_EMAIL = 'lucasb@ua.com.uy';

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function sendBrevo(toEmail, subject, htmlBody, plainText, tag) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject,
      htmlContent: htmlBody,
      textContent: plainText,
      replyTo: { email: SENDER_EMAIL },
      tags: [tag],
      headers: {
        'X-Mailin-custom': 'UA-Preview',
        'List-Unsubscribe': `<mailto:${SENDER_EMAIL}?subject=Unsubscribe>`
      }
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
        if (res.statusCode === 201 || res.statusCode === 200) resolve(data);
        else reject(new Error(`Brevo ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// 1. PREVIEW RECORDATORIO
function getReminderPreview() {
  const code = 'UA-DEMO01';
  const fn = 'Lucas';
  const invUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
  
  const subject = `[PREVIEW] Lucas, ¡faltan pocos días! Confirmá tu lugar en la función especial de cine`;
  
  const htmlBody = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center">
<table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #ee1f73;border-radius:20px;overflow:hidden;">
<tr><td style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(238,31,115,0.3);">
<div style="font-size:18px;font-weight:900;color:#ffffff;">UNIVERSAL ASSISTANCE</div>
<div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>
<tr><td style="padding:28px 24px;background-color:#0b2149;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e1b4b;border:2px solid #ee1f73;border-radius:12px;margin-bottom:20px;">
<tr><td style="padding:16px;text-align:center;">
<div style="font-size:12px;font-weight:900;color:#ee1f73;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">⏰ ¡FALTAN POCOS DÍAS!</div>
<div style="font-size:14px;font-weight:800;color:#ffffff;line-height:1.4;">Hola <span style="color:#38bdf8;">${fn}</span>, aún no registramos tu respuesta para la Avant Premiere de <strong style="color:#ffffff;">Coyote vs. Acme</strong>.</div>
</td></tr></table>
<div style="font-size:13px;color:#cbd5e1;line-height:1.5;margin-bottom:20px;text-align:center;">
Queremos asegurarnos de contar con tu presencia. Te pedimos por favor confirmar tus lugares a la brevedad para reservar tus entradas oficiales.
</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:14px;">
<div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">DATOS DE TU INVITACIÓN</div>
<div style="font-size:15px;font-weight:900;color:#ffffff;">Jueves 27 de Agosto · 20:00 hs</div>
<div style="font-size:12px;color:#cbd5e1;margin-top:2px;">Movie Montevideo Shopping (Llegada 19:30 hs)</div>
<div style="font-size:11px;color:#38bdf8;margin-top:6px;font-weight:700;">Código Personal: <strong>${code}</strong></div>
</td></tr></table>
<table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 20px auto;">
<tr><td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.5);">
<a href="${invUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;border-radius:999px;">Confirmar Mi Asistencia Ahora ➔</a>
</td></tr></table>
</td></tr></table></td></tr></table>
</body></html>`;

  const plainText = `PREVIEW RECORDATORIO:\nHola ${fn}, ¡faltan pocos días para el evento! Confirmá aquí: ${invUrl}`;
  return { subject, htmlBody, plainText };
}

// 2. PREVIEW AGRADECIMIENTO
function getThankYouPreview() {
  const fn = 'Lucas';
  const photosUrl = 'https://ua-eventos-uy.web.app/galeria-fotos';
  
  const subject = `[PREVIEW] Lucas, ¡gracias por acompañarnos! · Universal Assistance`;
  
  const htmlBody = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#071938;padding:24px 8px;">
<tr><td align="center">
<table role="presentation" class="card" width="480" align="center" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;overflow:hidden;">
<tr><td style="padding:20px 24px;background-color:#071938;border-bottom:1px solid rgba(56,189,248,0.3);">
<div style="font-size:18px;font-weight:900;color:#ffffff;">UNIVERSAL ASSISTANCE</div>
<div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-top:2px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
</td></tr>
<tr><td style="padding:28px 24px;background-color:#0b2149;text-align:center;">
<div style="font-size:12px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">AVANT PREMIERE EXCLUSIVA</div>
<h1 style="margin:0 0 16px 0;color:#ffffff;font-size:26px;font-weight:900;line-height:1.2;text-transform:uppercase;">¡GRACIAS POR ACOMPAÑARNOS!</h1>
<div style="font-size:14px;color:#cbd5e1;line-height:1.6;margin-bottom:24px;text-align:center;">
Hola <strong style="color:#ffffff;">${fn}</strong>, fue un verdadero placer contar con tu presencia en nuestra función especial de <strong>Coyote vs. Acme</strong> en Movie Montevideo Shopping.<br><br>
Esperamos que hayas disfrutado la velada. Ya tenemos listas las fotografías oficiales de la noche.
</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#16356e;border:1px solid #38bdf8;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:16px;text-align:center;">
<div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">📸 GALERÍA OFICIAL DE FOTOS</div>
<div style="font-size:13px;color:#ffffff;line-height:1.4;">Accedé al álbum digital para revivir los mejores momentos del evento y descargar tus fotos.</div>
</td></tr></table>
<table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 24px auto;">
<tr><td align="center" style="background-color:#ee1f73;border-radius:999px;box-shadow:0 4px 16px rgba(238,31,115,0.5);">
<a href="${photosUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;border-radius:999px;">Ver y Descargar Fotos 📸</a>
</td></tr></table>
</td></tr></table></td></tr></table>
</body></html>`;

  const plainText = `PREVIEW AGRADECIMIENTO:\nHola ${fn}, ¡gracias por acompañarnos! Fotos aquí: ${photosUrl}`;
  return { subject, htmlBody, plainText };
}

async function main() {
  console.log(`🚀 ENVIANDO PREVIEWS A ${TARGET_EMAIL}...`);
  
  // 1. Recordatorio
  const r = getReminderPreview();
  await sendBrevo(TARGET_EMAIL, r.subject, r.htmlBody, r.plainText, 'preview-recordatorio');
  console.log('✅ Preview 1 enviada: Recordatorio para Pendientes');

  // Pausa
  await new Promise(res => setTimeout(res, 2000));

  // 2. Agradecimiento
  const t = getThankYouPreview();
  await sendBrevo(TARGET_EMAIL, t.subject, t.htmlBody, t.plainText, 'preview-agradecimiento');
  console.log('✅ Preview 2 enviada: Agradecimiento Post-Evento');

  console.log('\n✨ ¡Ambas vistas previas fueron enviadas a tu casilla lucasb@ua.com.uy!');
}

main().catch(console.error);
