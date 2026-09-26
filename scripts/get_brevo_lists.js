const https = require('https');
const fs = require('fs');

const BREVO_API_KEY = 'BREVO_API_KEY_DISABLED_BY_USER';

function brevoGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  console.log('1. Consultando todas las listas en Brevo...');
  const listsRes = await brevoGet('/v3/contacts/lists?limit=50&offset=0');
  console.log('Listas encontradas en Brevo:');
  console.log(JSON.stringify(listsRes, null, 2));

  const lists = listsRes.lists || [];
  fs.writeFileSync('./scripts/brevo_lists.json', JSON.stringify(lists, null, 2));
})();
