const fs = require('fs');
const https = require('https');

const rows = JSON.parse(fs.readFileSync('master_rows.json', 'utf8'));

const payload = JSON.stringify(rows);

const options = {
  hostname: 'script.google.com',
  path: '/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=restoreMasterDatabase',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log(`Restaurando ${rows.length} invitados completos a Google Sheets...`);

function sendPost(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location);
        const redOpts = {
          hostname: redirectUrl.hostname,
          path: redirectUrl.pathname + redirectUrl.search,
          method: 'GET'
        };
        https.get(redOpts, (redRes) => {
          let data = '';
          redRes.on('data', chunk => data += chunk);
          redRes.on('end', () => resolve(data));
        }).on('error', reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const result = await sendPost(options, payload);
    console.log('Resultado restauración:', result);
  } catch(e) {
    console.error('Error al restaurar:', e);
  }
})();
