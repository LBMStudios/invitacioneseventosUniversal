const fs = require('fs');
const content = fs.readFileSync('apps-script/Código.gs', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('adminAddGuest') || line.includes('adminUpdateGuest') || line.includes('function addSecondBatch')) {
    console.log(`Line ${idx+1}: ${line}`);
  }
});
