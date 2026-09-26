const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlPath = path.resolve(__dirname, '../firebase/public/galeria.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const match = html.match(/const GALLERY_ITEMS = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('Error: no se encontró GALLERY_ITEMS');
  process.exit(1);
}

let items = JSON.parse(match[1]);
console.log('Items antes de eliminar la placa:', items.length);

// Filtrar la placa de cierre (id 54 o con filename Agradecimiento o photo_054)
items = items.filter(it => !it.filename.includes('Agradecimiento') && !it.src.includes('photo_054'));

// Renumerar correlativamente del 1 al 53
items = items.map((it, idx) => ({
  ...it,
  id: idx + 1
}));

console.log('Items después de eliminar la placa:', items.length);

const newJson = JSON.stringify(items, null, 2);
html = html.replace(/const GALLERY_ITEMS = \[[\s\S]*?\];/, 'const GALLERY_ITEMS = ' + newJson + ';');
html = html.replace(/id="photoCountBadge">\d+ Fotos HD<\/span>/, `id="photoCountBadge">${items.length} Fotos HD</span>`);
html = html.replace(/\/\/ Colección de fotos oficiales del evento \(\d+ fotos HD seleccionadas\)/, `// Colección de fotos oficiales del evento (${items.length} fotos HD seleccionadas)`);

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('galeria.html restaurado a 53 fotos puras.');

// Eliminar archivos físicos de la placa
const toDelete = [
  '../firebase/public/assets/galeria/hd/photo_054.png',
  '../firebase/public/assets/galeria/web/web_054.png',
  '../firebase/public/assets/galeria/thumbs/thumb_054.png',
  '../scripts/placa_cierre.html',
  '../firebase/public/assets/coyote-clean-title.png'
];
toDelete.forEach(rel => {
  const p = path.resolve(__dirname, rel);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

// Reconstruir ZIP con solo las 53 fotos reales
const tempDir = path.resolve(__dirname, '../temp_album_hd');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

console.log(`Copiando ${items.length} fotos HD a carpeta temporal...`);
items.forEach((it, idx) => {
  const srcFile = path.resolve(__dirname, '../firebase/public' + it.src);
  const destName = `Universal_Assistance_${String(idx + 1).padStart(3, '0')}_${it.filename}`;
  const destFile = path.join(tempDir, destName);
  fs.copyFileSync(srcFile, destFile);
});

const zipDest = path.resolve(__dirname, '../firebase/public/assets/galeria/Album_Universal_Assistance_Coyote_vs_Acme_HD.zip');
if (fs.existsSync(zipDest)) {
  fs.unlinkSync(zipDest);
}

console.log('Comprimiendo archivo ZIP con PowerShell...');
execSync(`powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipDest}' -CompressionLevel Optimal"`, { stdio: 'inherit' });

console.log('Limpiando archivos temporales...');
fs.rmSync(tempDir, { recursive: true, force: true });

const sizeMB = (fs.statSync(zipDest).size / 1024 / 1024).toFixed(2);
console.log(`¡ZIP actualizado con éxito! Peso: ${sizeMB} MB con exactamente ${items.length} fotos reales.`);
