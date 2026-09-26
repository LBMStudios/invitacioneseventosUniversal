const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../firebase/public/galeria.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const match = html.match(/const GALLERY_ITEMS = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('Error: no se encontró GALLERY_ITEMS en galeria.html');
  process.exit(1);
}

const originalItems = JSON.parse(match[1]);

// Lista de IDs indicada por el usuario para eliminar por estar repetidas:
const toRemoveStr = '1,3,4,7,9,10,11,13,14,15,17,18,21,23,24,25,27,29,28,31,35,36,37,39,41,42,43,46,48,49,50,51,54,55,57,59,58,61,63,65,67,68,70,72,74,77,80,82,84,86,87,88,90,93,95,98,99,101,102,103,104,106,108,111,114,116,118,119,121,123,125,126,128,120';
const toRemoveSet = new Set(toRemoveStr.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n)));

const filtered = originalItems.filter(item => !toRemoveSet.has(item.id));
const renumbered = filtered.map((item, idx) => ({
  id: idx + 1,
  filename: item.filename,
  src: item.src,
  thumb: item.thumb,
  w: item.w,
  h: item.h,
  web: item.web,
  originalId: item.id
}));

console.log(`Originales: ${originalItems.length}`);
console.log(`Eliminadas: ${toRemoveSet.size}`);
console.log(`Restantes seleccionadas: ${renumbered.length}`);

const newJson = JSON.stringify(renumbered, null, 2);
html = html.replace(/const GALLERY_ITEMS = \[[\s\S]*?\];/, 'const GALLERY_ITEMS = ' + newJson + ';');
html = html.replace(/id="photoCountBadge">130 Fotos HD<\/span>/, `id="photoCountBadge">${renumbered.length} Fotos HD</span>`);
html = html.replace(/\/\/ Colección de fotos oficiales del evento \(130 fotos HD\)/, `// Colección de fotos oficiales del evento (${renumbered.length} fotos HD seleccionadas)`);

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('galeria.html actualizado con éxito con las 56 fotos curadas.');
