const fs = require('fs');

const adminSrc = fs.readFileSync('apps-script/Admin.html', 'utf8');

// Replace any Apps Script template tags if any, or adjust for standalone web hosting
fs.writeFileSync('firebase/public/admin.html', adminSrc, 'utf8');
console.log('Copied apps-script/Admin.html to firebase/public/admin.html');
