const fs = require('fs');

const html = fs.readFileSync('c:/Users/Lucas Rossi/Downloads/UAInvitacón/firebase/public/galeria.html', 'utf-8');
const currentItems = JSON.parse(html.match(/const GALLERY_ITEMS = (\[[\s\S]*?\]);/)[1]);

console.log('--- SI EL USUARIO SE REFIERE A LAS ORIGINALES (1..130) ---');
const orig30 = currentItems.find(it => it.originalId === 30);
const orig34 = currentItems.find(it => it.originalId === 34);
const orig56 = currentItems.find(it => it.originalId === 56);
console.log('Original 30 (hoy id=' + orig30?.id + '): ' + orig30?.filename + ' - ' + orig30?.src);
console.log('Original 34 (hoy id=' + orig34?.id + '): ' + orig34?.filename + ' - ' + orig34?.src);
console.log('Original 56 (hoy id=' + orig56?.id + '): ' + orig56?.filename + ' - ' + orig56?.src);

console.log('\n--- SI EL USUARIO SE REFIERE A LAS ACTUALES (1..56) ---');
const cur30 = currentItems.find(it => it.id === 30);
const cur34 = currentItems.find(it => it.id === 34);
const cur56 = currentItems.find(it => it.id === 56);
console.log('Actual 30 (era original #' + cur30?.originalId + '): ' + cur30?.filename + ' - ' + cur30?.src);
console.log('Actual 34 (era original #' + cur34?.originalId + '): ' + cur34?.filename + ' - ' + cur34?.src);
console.log('Actual 56 (era original #' + cur56?.originalId + '): ' + cur56?.filename + ' - ' + cur56?.src);
