const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function buildEmail(guestName, code) {
  const invUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
  const fn = guestName.trim().split(/\s+/)[0];
  const subject = `${fn}, tenés una invitación especial · Universal Assistance`;
  
  const htmlBody = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#071938;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
<div style="padding:28px 24px;max-width:480px;margin:20px auto;background-color:#0b2149;border:2px solid #38bdf8;border-radius:20px;">
  <div style="font-size:18px;font-weight:900;color:#ffffff;margin-bottom:4px;">UNIVERSAL ASSISTANCE</div>
  <div style="font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.8px;margin-bottom:20px;">A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO</div>
  <div style="font-size:13px;color:#cbd5e1;margin-bottom:6px;">Hola <strong style="color:#ffffff;">${esc(guestName)}</strong>,</div>
  <p style="font-size:14px;line-height:1.5;color:#ffffff;">Te invitamos a una función exclusiva de cine para ver <strong style="color:#38bdf8;">COYOTE VS ACME</strong>.</p>
  <div style="background:#16356e;padding:14px;border-radius:12px;border:1px solid #38bdf8;margin:18px 0;">
    <div style="font-size:12px;color:#38bdf8;font-weight:bold;">DETALLES DEL EVENTO:</div>
    <div style="font-size:13px;color:#fff;margin-top:4px;">📅 Jueves 27/08/2026 · 20:00 hs (Llegada 19:30 hs)</div>
    <div style="font-size:13px;color:#fff;margin-top:2px;">📍 Movie Montevideo Shopping</div>
    <div style="font-size:12px;color:#cbd5e1;margin-top:6px;">Código personal: <strong style="color:#38bdf8;">${esc(code)}</strong></div>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="${esc(invUrl)}" style="background-color:#ee1f73;color:#ffffff;padding:14px 32px;text-decoration:none;font-weight:bold;font-size:15px;border-radius:30px;display:inline-block;box-shadow:0 4px 16px rgba(238,31,115,0.4);">Confirmar mi Asistencia</a>
  </div>
  <div style="font-size:11px;color:#94a3b8;text-align:center;margin-top:16px;">
    ⚠️ Cupos limitados: Se asignan por orden de confirmación.
  </div>
</div>
</body></html>`;

  const plainText = `Hola ${guestName},\nTe invitamos a la función exclusiva de COYOTE VS ACME.\nFecha: Jueves 27/08/2026 · 20:00 hs (Llegada 19:30 hs)\nLugar: Movie Montevideo Shopping\nConfirmá tu asistencia en: ${invUrl}\nCódigo: ${code}`;

  return { subject, htmlBody, plainText };
}

function sendBrevo(toEmail, subject, htmlBody, plainText) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject,
      htmlContent: htmlBody,
      textContent: plainText,
      replyTo: { email: SENDER_EMAIL }
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
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function httpGet(u) {
  return new Promise((resolve, reject) => {
    https.get(u, res => {
      if (res.statusCode >= 300 && res.headers.location) return resolve(httpGet(res.headers.location));
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function sendDirect(name, email, code) {
  console.log(`🚀 Enviando a ${name} <${email}> [${code}]...`);
  const { subject, htmlBody, plainText } = buildEmail(name, code);
  const res = await sendBrevo(email, subject, htmlBody, plainText);
  console.log('  📬 Respuesta Brevo:', res);
  await httpGet(`${WEBAPP_URL}?action=markSent&code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`);
  console.log('  ✅ Marcado enviado en spreadsheet.');
}

async function main() {
  await sendDirect('Jorgelina', 'jorgelina@mercurioviajes.com.uy', 'UA-F81908EB-J');
  await sendDirect('Tatiana', 'tatiana@mercurioviajes.com.uy', 'UA-F81908EB-T');
}

main().catch(console.error);
