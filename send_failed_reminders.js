/**
 * Reenvío de recordatorios a invitados con emails múltiples concatenados.
 */
const https = require('https');
const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';
const SENDER_EMAIL = 'lucasb@ua.com.uy';
const LANDING_URL  = 'https://ua-eventos-uy.web.app/coyote-vs-acme';
const WEBAPP_URL   = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function firstName(n) { return String(n||'Invitado').trim().split(/\s+/)[0]; }

function buildEmail(guestName, code) {
  const fn = firstName(guestName);
  const invUrl = `${LANDING_URL}?i=${encodeURIComponent(code)}`;
  const subject = `${fn}, ¡faltan pocos días! Confirmá tu lugar en la función especial de cine`;
  const html = require('fs').readFileSync('send_reminder_template.html','utf8')
    .replace(/\{\{fn\}\}/g, esc(fn))
    .replace(/\{\{code\}\}/g, esc(code))
    .replace(/\{\{invUrl\}\}/g, esc(invUrl));
  const plain = `Hola ${fn},\n\nFaltan pocos dias. Confirma: ${invUrl}`;
  return { subject, html, plain };
}

function sendBrevo(toEmail, subject, html, plain) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ sender:{name:'Universal Assistance',email:SENDER_EMAIL}, to:[{email:toEmail}], subject, htmlContent:html, textContent:plain, replyTo:{email:SENDER_EMAIL}, tags:['recordatorio-pendientes-cine'] });
    const req = https.request({ hostname:'api.brevo.com', path:'/v3/smtp/email', method:'POST', headers:{'api-key':BREVO_API_KEY,'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)} }, res => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>{ if(res.statusCode===201||res.statusCode===200) resolve(d); else reject(new Error(`Brevo ${res.statusCode}: ${d}`)); });
    });
    req.on('error',reject); req.write(payload); req.end();
  });
}

async function main() {
  const res = await fetch(`${WEBAPP_URL}?action=adminList`);
  const data = await res.json();
  const guests = data.guests || [];
  const targets = guests.filter(g => {
    const e = (g.email||'').trim();
    const s = String(g.status||'').trim();
    return (!s||s==='Pendiente') && (e.includes(',')||e.includes(';'));
  });
  console.log(`Encontrados con emails multiples: ${targets.length}`);
  let sent=0, errors=0;
  for (const g of targets) {
    const emails = g.email.split(/[,;]/).map(e=>e.trim().toLowerCase()).filter(e=>e.includes('@')&&e.length>5);
    if (!emails.length) { console.log(`${g.name}: sin email valido`); continue; }
    const firstEmail = emails[0];
    console.log(`\n${g.name} | Emails: ${emails.join(' | ')}`);
    process.stdout.write(`→ Enviando a ${firstEmail}... `);
    try {
      const payload = JSON.stringify({ sender:{name:'Universal Assistance',email:SENDER_EMAIL}, to:[{email:firstEmail}], subject:`${firstName(g.name)}, ¡faltan pocos días! Confirmá tu lugar en la función especial de cine`, htmlContent:`<p>Hola ${esc(firstName(g.name))}, confirma tu asistencia: <a href="${LANDING_URL}?i=${encodeURIComponent(g.code)}">${LANDING_URL}?i=${encodeURIComponent(g.code)}</a></p>`, textContent:`Hola ${firstName(g.name)}, confirma: ${LANDING_URL}?i=${encodeURIComponent(g.code)}`, replyTo:{email:SENDER_EMAIL}, tags:['recordatorio-pendientes-cine'] });
      await new Promise((resolve,reject)=>{
        const req=https.request({hostname:'api.brevo.com',path:'/v3/smtp/email',method:'POST',headers:{'api-key':BREVO_API_KEY,'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{if(res.statusCode===201||res.statusCode===200)resolve(d);else reject(new Error(`${res.statusCode}: ${d}`));});});
        req.on('error',reject);req.write(payload);req.end();
      });
      console.log('OK'); sent++;
      try { await fetch(`${WEBAPP_URL}?action=markSent&code=${encodeURIComponent(g.code)}&email=${encodeURIComponent(firstEmail)}`); } catch(_){}
    } catch(e) { console.log(`ERROR: ${e.message}`); errors++; }
    await new Promise(r=>setTimeout(r,2500));
  }
  console.log(`\nRESULTADO: ${sent} enviados, ${errors} errores`);
}
main().catch(console.error);
