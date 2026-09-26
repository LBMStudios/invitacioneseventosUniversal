const fs = require('fs');
const https = require('https');

https.get('https://www.coyotevsacme.com/home/', (res) => {
  let html = '';
  res.on('data', (d) => html += d);
  res.on('end', () => {
    console.log('HTML size:', html.length);
    const matches = html.match(/https:\/\/[^"'\s]+\.(png|jpg|jpeg|webp|svg|gif)/gi) || [];
    const unique = [...new Set(matches)];
    console.log('Images found in HTML:', unique);
    
    // Save list to file
    fs.writeFileSync('coyote_assets.json', JSON.stringify(unique, null, 2));
  });
});
