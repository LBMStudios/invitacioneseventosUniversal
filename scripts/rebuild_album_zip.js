const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlPath = path.resolve(__dirname, '../firebase/public/galeria.html');
const html = fs.readFileSync(htmlPath, 'utf-8');
const items = JSON.parse(html.match(/const GALLERY_ITEMS = (\[[\s\S]*?\]);/)[1]);

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
console.log(`¡ZIP actualizado con éxito! Nuevo peso: ${sizeMB} MB con las 56 fotos curadas.`);
