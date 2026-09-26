const fs = require('fs');
const https = require('https');

const code = fs.readFileSync('send-brevo.js', 'utf8');
const keyMatch = code.match(/xkeysib-[a-zA-Z0-9-]+/);
if (keyMatch) {
  const apiKey = keyMatch[0];
  const options = {
    hostname: 'api.brevo.com',
    path: '/v3/contacts?limit=50&sort=desc',
    method: 'GET',
    headers: {
      'api-key': apiKey,
      'accept': 'application/json'
    }
  };
  https.get(options, res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('Brevo count:', json.count);
        fs.writeFileSync('brevo_all_contacts.json', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Error:', e.message);
      }
    });
  });
}
