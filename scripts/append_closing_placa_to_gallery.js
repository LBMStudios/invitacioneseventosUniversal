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

const items = JSON.parse(match[1]);
console.log('Items antes de agregar placa:', items.length);

// Evitar duplicar si ya existe
if (!items.some(it => it.id === 54 || it.filename.includes('Agradecimiento'))) {
  items.push({
    id: items.length + 1,
    filename: 'Universal_Assistance_Agradecimiento.png',
    src: '/assets/galeria/hd/photo_054.png',
    thumb: '/assets/galeria/thumbs/thumb_054.png',
    w: 2048,
    h: 1365,
    web: '/assets/galeria/web/web_054.png',
    originalId: 999
  });
}

console.log('Items con placa de cierre:', items.length);

const newJson = JSON.stringify(items, null, 2);
html = html.replace(/const GALLERY_ITEMS = \[[\s\S]*?\];/, 'const GALLERY_ITEMS = ' + newJson + ';');
html = html.replace(/id="photoCountBadge">\d+ Fotos HD<\/span>/, `id="photoCountBadge">${items.length} Fotos HD</span>`);
html = html.replace(/\/\/ Colección de fotos oficiales del evento \(\d+ fotos HD seleccionadas\)/, `// Colección de fotos oficiales del evento (${items.length} fotos HD seleccionadas)`);

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('galeria.html actualizado con la placa de cierre.');

// Reconstruir ZIP para incluir la placa
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
console.log(`¡ZIP actualizado con éxito! Peso: ${sizeMB} MB con ${items.length} fotos incluyendo la placa de cierre.`);
