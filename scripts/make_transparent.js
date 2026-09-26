const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

const brainDir = 'C:/Users/Lucas Rossi/.gemini/antigravity-ide/brain/bd60fad8-e8be-462f-8676-5fffe88377ff';
const targetDir = 'firebase/public/assets';

function processImage(srcFile, destFile) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(srcFile)
      .pipe(new PNG({ filterType: 4 }))
      .on('parsed', function() {
        // Color a remover: #071938 (r:7, g:25, b:56) y tonos cercanos de fondo azul o retícula
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const idx = (this.width * y + x) << 2;
            const r = this.data[idx];
            const g = this.data[idx + 1];
            const b = this.data[idx + 2];

            // Si el píxel es el fondo azul #071938 o similar (distancia cromática baja)
            const dr = Math.abs(r - 7);
            const dg = Math.abs(g - 25);
            const db = Math.abs(b - 56);

            // O si es la retícula gris/blanca artificial (r,g,b todos similares y > 180 o > 230)
            const isCheckerboardWhite = (r > 240 && g > 240 && b > 240);
            const isCheckerboardGray = (Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && r > 180 && r < 220);

            if ((dr + dg + db < 45) || isCheckerboardWhite || isCheckerboardGray) {
              this.data[idx + 3] = 0; // Transparencia total
            }
          }
        }

        this.pack()
          .pipe(fs.createWriteStream(destFile))
          .on('finish', () => {
            console.log('✅ Creado PNG 100% transparente:', destFile);
            resolve();
          });
      })
      .on('error', reject);
  });
}

async function main() {
  const files = fs.readdirSync(brainDir);
  
  for (const f of files) {
    if (f.startsWith('coyote_roadrunner_dark')) {
      await processImage(path.join(brainDir, f), path.join(targetDir, 'coyote-roadrunner.png'));
    }
    if (f.startsWith('coyote_popcorn_dark')) {
      await processImage(path.join(brainDir, f), path.join(targetDir, 'coyote-popcorn.png'));
    }
  }
}

main().catch(console.error);
