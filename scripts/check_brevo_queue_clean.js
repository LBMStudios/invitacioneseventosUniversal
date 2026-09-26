const https = require('https');

const BREVO_API_KEY = 'BREVO_API_KEY_BLOCKED_AND_DISABLED';

function checkScheduled() {
  const req = https.request({
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/emailCampaigns?status=queued,suspended,in_process',
    method: 'GET',
    headers: {
      'api-key': BREVO_API_KEY,
      'Accept': 'application/json'
    }
  }, res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      console.log('Campaigns in queue:', data);
    });
  });
  req.on('error', console.error);
  req.end();
}

checkScheduled();
