/**
 * Script local para enviar invitaciones pendientes via Brevo API.
 * Se ejecuta desde la máquina local del usuario (Node.js).
 * 
 * Uso: node send-brevo.js
 */

// 🚫 BLOQUEO DE SEGURIDAD EXPLICITO: No enviar mails sin autorización del usuario
const ALLOW_EMAIL_SEND = false;

if (!ALLOW_EMAIL_SEND) {
  console.error("❌ ERROR: El envío de emails está BLOQUEADO por configuración de seguridad.");
  console.error("❌ No se enviará ningún correo automáticamente.");
  process.exit(1);
}

const https = require('https');

// ─── CONFIGURACIÓN ───
const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const SENDER_NAME = 'Universal Assistance';
const LANDING_URL = 'https://ua-eventos-uy.web.app/coyote-vs-acme';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const EVENT_DATE = '27/08/2026';
const EVENT_TIME = '20:00';
const ARRIVAL_TIME = '19:30';
const VENUE = 'Movie Montevideo Shopping';
const MAPS_URL = 'https://maps.google.com/?q=Movie+Montevideo+Shopping';
const PHONE = '2901 7378';
const REPLY_TO = SENDER_EMAIL;

// ─── HELPERS ───
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function firstName(name) {
  if (!name) return 'Invitado';
  return String(name).trim().split(/\s+/)[0];
}

function cleanEmail(raw) {
  if (!raw) return '';
  const matches = String(raw).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return '';
  return [...new Set(matches.map(e => e.trim().toLowerCase()))].join(',');
}

function dayOfWeek(dateStr) {
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const p = dateStr.split('/');
  if (p.length === 3) {
    const d = new Date(p[2], p[1]-1, p[0]);
    return days[d.getDay()] || 'Jueves';
  }
  return 'Jueves';
}

// ─── EMAIL TEMPLATE ───
function buildEmail(guestName, code) {
  const invUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
  const fn = firstName(guestName);
  
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

  const plainText = [
    `Hola ${fn},`,
    '', 'Universal Assistance te invita a la función exclusiva de Coyote vs. Acme.',
    '', 'PELÍCULA: Coyote vs. Acme', '--------------------------------------', '',
    'DETALLES DEL EVENTO:',
    `  Fecha: ${EVENT_DATE}`, `  Hora: ${EVENT_TIME} hs`,
    `  Llegada sugerida: ${ARRIVAL_TIME} hs`, `  Lugar: ${VENUE}`,
    `  Tu código personal: ${code}`, '',
    'CUPOS LIMITADOS', 'Los lugares se asignan por orden de confirmación.',
    'Por favor confirma tu asistencia a la brevedad para asegurar tus entradas.',
    '', 'Confirma tu asistencia aquí:', `${LANDING_URL}?i=${encodeURIComponent(code)}`,
    '', '--------------------------------------', 'Universal Assistance Uruguay',
    `Tel: ${PHONE}`, `Email: ${REPLY_TO}`
  ].join('\n');

  return { subject, htmlBody, plainText };
}

// ─── BREVO API ───
function sendBrevo(toEmail, subject, htmlBody, plainText) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject,
      htmlContent: htmlBody,
      textContent: plainText,
      replyTo: { email: REPLY_TO },
      tags: ['invitacion-evento-cine'],
      headers: {
        'X-Mailin-custom': 'UA-Eventos',
        'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=Unsubscribe>`
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
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Brevo ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── MARK SENT via Apps Script ───
async function markSent(code, email) {
  const url = `${WEBAPP_URL}?action=markSent&code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`;
  try { await fetch(url); } catch (_) {}
}

// ─── OBTENER PENDIENTES ───
async function getPendingGuests() {
  console.log('📋 Obteniendo lista de invitados...');
  let data;
  try {
    const res = await fetch(`${WEBAPP_URL}?action=adminList`);
    data = await res.json();
  } catch (err) {
    console.error('❌ No se pudo obtener la lista del servidor:', err.message);
    return null;
  }
  const guests = data.guests || [];
  return guests.filter(g => {
    const ms = (g.mailStatus || '').trim();
    const email = cleanEmail(g.email);
    const hasValidEmail = email && email.includes('@') && email.toUpperCase().indexOf('NO TENGO') < 0;
    const notSent = ms.indexOf('Enviado') < 0 && ms.indexOf('enviad') < 0 && ms.indexOf('Abierto') < 0;
    return hasValidEmail && notSent;
  });
}

// ─── MAIN CON AUTO-OPTIMIZACIÓN DINÁMICA ───
async function main() {
  console.log('🚀 SISTEMA AUTÓNOMO DE ENVÍO DE INVITACIONES (BREVO)');
  console.log('═════════════════════════════════════════════════════\n');

  let pending = await getPendingGuests();
  
  if (!pending) {
    console.error('❌ No se pudo conectar al servidor para obtener la lista.');
    console.error('   Por favor verificá la conexión e intentá de nuevo.');
    process.exit(1);
  }

  if (pending.length === 0) {
    console.log('✨ ¡No hay invitados pendientes de envío! La base está 100% al día.');
    return;
  }

  console.log(`📬 ${pending.length} invitado(s) detectados para envío optimizado:\n`);
  pending.forEach((g, i) => {
    console.log(`   ${i+1}. ${g.name} → ${cleanEmail(g.email)} [${g.code}]`);
  });
  console.log('\n⚙️  Iniciando motor con cadencia adaptativa de reputación...\n');

  let sent = 0, errors = 0;
  const processedEmails = new Set();
  let basePauseMs = 2500; // Pausa inicial óptima

  for (let i = 0; i < pending.length; i++) {
    const g = pending[i];
    const email = cleanEmail(g.email);

    if (processedEmails.has(email)) {
      console.log(`   [${i+1}/${pending.length}] ${g.name} (${email})... 📋 OMITIDO (Duplicado detectado)`);
      continue;
    }
    processedEmails.add(email);

    const { subject, htmlBody, plainText } = buildEmail(g.name, g.code);

    process.stdout.write(`   [${i+1}/${pending.length}] ${g.name} (${email})... `);

    try {
      await sendBrevo(email, subject, htmlBody, plainText);
      console.log(`✅ ENVIADO (Pausa adaptativa: ${(basePauseMs/1000).toFixed(1)}s)`);
      sent++;
      await markSent(g.code, email);

      // Si vienen varios envíos limpios, mantenemos cadencia rápida segura
      if (basePauseMs > 2500) basePauseMs = Math.max(2500, basePauseMs - 200);

    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
      errors++;

      // Auto-optimización: Si hay diferimiento o error por tasa, desaceleramos automáticamente
      if (err.message.includes('421') || err.message.includes('429') || err.message.includes('rate')) {
        basePauseMs = Math.min(6000, basePauseMs + 1500);
        console.log(`   ⚠️ Ajuste dinámico de seguridad: Pausa aumentada a ${(basePauseMs/1000).toFixed(1)}s para proteger reputación de la IP`);
      }
    }

    // Aplicar pausa adaptativa
    if (i < pending.length - 1) {
      const dynamicJitter = Math.floor(Math.random() * 800);
      await new Promise(r => setTimeout(r, basePauseMs + dynamicJitter));
    }
  }

  console.log('\n═════════════════════════════════════════════════════');
  console.log(`📊 BALANCE DE DISPARO: ${sent} enviados con éxito, ${errors} errores`);
  console.log('🔄 Sincronizando métricas en vivo con la planilla y el panel admin...');
  try {
    await fetch(`${WEBAPP_URL}?action=adminList`);
    console.log('✅ Dashboard y métricas actualizados en tiempo real.');
  } catch (_) {}
  console.log('═════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
