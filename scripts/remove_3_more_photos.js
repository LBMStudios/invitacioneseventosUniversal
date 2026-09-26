const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlPath = path.resolve(__dirname, '../firebase/public/galeria.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const match = html.match(/const GALLERY_ITEMS = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('Error: no se encontró GALLERY_ITEMS en galeria.html');
  process.exit(1);
}

const currentItems = JSON.parse(match[1]);
console.log(`Total actual: ${currentItems.length}`);

// Eliminar las fotos con ID actual 30, 34 y 56:
const toRemoveIds = new Set([30, 34, 56]);
const filtered = currentItems.filter(item => !toRemoveIds.has(item.id));

const renumbered = filtered.map((item, idx) => ({
  id: idx + 1,
  filename: item.filename,
  src: item.src,
  thumb: item.thumb,
  w: item.w,
  h: item.h,
  web: item.web,
  originalId: item.originalId || item.id
}));

console.log(`Total restante curado: ${renumbered.length}`);

const newJson = JSON.stringify(renumbered, null, 2);
html = html.replace(/const GALLERY_ITEMS = \[[\s\S]*?\];/, 'const GALLERY_ITEMS = ' + newJson + ';');
html = html.replace(/id="photoCountBadge">\d+ Fotos HD<\/span>/, `id="photoCountBadge">${renumbered.length} Fotos HD</span>`);
html = html.replace(/\/\/ Colección de fotos oficiales del evento \(\d+ fotos HD seleccionadas\)/, `// Colección de fotos oficiales del evento (${renumbered.length} fotos HD seleccionadas)`);

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('galeria.html actualizado a 53 fotos.');

// Reconstruir ZIP
const tempDir = path.resolve(__dirname, '../temp_album_hd');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

console.log(`Copiando ${renumbered.length} fotos HD a carpeta temporal...`);
renumbered.forEach((it, idx) => {
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
console.log(`¡ZIP actualizado con éxito! Peso: ${sizeMB} MB con las ${renumbered.length} fotos curadas.`);
