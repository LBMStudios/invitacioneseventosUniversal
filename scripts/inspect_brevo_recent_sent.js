const https = require('https');
const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';

function brevoGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      path,
      method: 'GET',
      headers: {
        'api-key': BREVO_API_KEY,
        'accept': 'application/json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(d); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Consultando últimos eventos de emails enviados en Brevo...');
  const logs = await brevoGet('/v3/smtp/emails?limit=40&sort=desc');
  
  const emails = logs.transactionalEmails || [];
  console.log(`Total emails obtenidos: ${emails.length}`);

  const summary = {};
  emails.forEach(e => {
    const sub = e.subject || '(Sin Asunto)';
    summary[sub] = (summary[sub] || 0) + 1;
  });

  console.log('\n--- RESUMEN POR ASUNTO ---');
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n--- DETALLE DE ÚLTIMOS 20 ENVIOS ---');
  emails.slice(0, 20).forEach((e, idx) => {
    console.log(`${idx + 1}. [${e.date}] A: ${e.email} | Asunto: "${e.subject}"`);
  });
}

main().catch(console.error);
