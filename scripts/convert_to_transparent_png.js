const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const PNG = require('pngjs').PNG;

const brainDir = 'C:/Users/Lucas Rossi/.gemini/antigravity-ide/brain/bd60fad8-e8be-462f-8676-5fffe88377ff';
const targetDir = 'firebase/public/assets';

function makeTransparentPNG(jpegPath, outputPath) {
  const jpegData = fs.readFileSync(jpegPath);
  const rawData = jpeg.decode(jpegData, { useTolerant: true }); // width, height, data (RGBA buffer)
  
  const png = new PNG({
    width: rawData.width,
    height: rawData.height
  });

  const len = rawData.width * rawData.height * 4;

  for (let i = 0; i < len; i += 4) {
    const r = rawData.data[i];
    const g = rawData.data[i + 1];
    const b = rawData.data[i + 2];

    // Detectar el patrón cuadriculado (blanco/gris) o el fondo azul marino #071938
    const isWhiteGrid = (r > 225 && g > 225 && b > 225);
    const isGrayGrid = (Math.abs(r - g) < 8 && Math.abs(g - b) < 8 && r > 170 && r < 215);

    // Fondo azul marino #071938 (r:7, g:25, b:56)
    const isDarkBg = (Math.abs(r - 7) + Math.abs(g - 25) + Math.abs(b - 56) < 50);

    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;

    if (isWhiteGrid || isGrayGrid || isDarkBg) {
      png.data[i + 3] = 0; // Transparencia total
    } else {
      png.data[i + 3] = 255; // Píxel del personaje visible
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✨ Creado PNG con transparencia verdadera en: ${outputPath}`);
}

async function main() {
  const files = fs.readdirSync(brainDir);
  
  for (const f of files) {
    if (f.startsWith('coyote_roadrunner_art')) {
      makeTransparentPNG(path.join(brainDir, f), path.join(targetDir, 'coyote-roadrunner.png'));
    }
    if (f.startsWith('coyote_acme_box')) {
      makeTransparentPNG(path.join(brainDir, f), path.join(targetDir, 'coyote-popcorn.png'));
    }
  }
}

main().catch(console.error);
