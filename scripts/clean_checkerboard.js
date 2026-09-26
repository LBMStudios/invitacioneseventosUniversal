const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function cleanImage(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(inputPath)
      .pipe(new PNG())
      .on('parsed', function () {
        const width = this.width;
        const height = this.height;
        const data = this.data;

        // BFS flood fill starting from outer transparent/checkerboard pixels
        const visited = new Uint8Array(width * height);
        const queue = [];

        // Check if a pixel is part of the fake grey/white checkerboard
        function isCheckerboardOrTransparent(x, y) {
          const idx = (y * width + x) << 2;
          const a = data[idx + 3];
          if (a === 0) return true;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
          const brightness = (r + g + b) / 3;

          // Fake checkerboard in these AI images are light greys/whites with low saturation
          // e.g. RGB(216, 216, 216), RGB(240, 240, 240), RGB(200, 200, 200)
          if (maxDiff < 20 && brightness > 155) {
            return true;
          }

          // Dark grid lines or faint grid borders in checkerboard
          if (maxDiff < 18 && brightness > 130 && (x < 150 || x > width - 150 || y < 150 || y > height - 150)) {
            return true;
          }

          return false;
        }

        // Initialize queue with all 4 outer borders
        for (let x = 0; x < width; x++) {
          queue.push((0 * width + x));
          queue.push(((height - 1) * width + x));
          visited[x] = 1;
          visited[(height - 1) * width + x] = 1;
        }
        for (let y = 0; y < height; y++) {
          queue.push((y * width + 0));
          queue.push((y * width + (width - 1)));
          visited[y * width] = 1;
          visited[y * width + (width - 1)] = 1;
        }

        let head = 0;
        while (head < queue.length) {
          const pos = queue[head++];
          const x = pos % width;
          const y = Math.floor(pos / width);

          if (isCheckerboardOrTransparent(x, y)) {
            // Clear pixel to pure transparent
            const idx = (y * width + x) << 2;
            data[idx] = 0;
            data[idx + 1] = 0;
            data[idx + 2] = 0;
            data[idx + 3] = 0;

            // Enqueue 4 neighbors
            const neighbors = [
              { nx: x + 1, ny: y },
              { nx: x - 1, ny: y },
              { nx: x, ny: y + 1 },
              { nx: x, ny: y - 1 }
            ];

            for (const { nx, ny } of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nPos = ny * width + nx;
                if (!visited[nPos]) {
                  visited[nPos] = 1;
                  if (isCheckerboardOrTransparent(nx, ny)) {
                    queue.push(nPos);
                  }
                }
              }
            }
          }
        }

        this.pack().pipe(fs.createWriteStream(outputPath)).on('finish', resolve).on('error', reject);
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('🧹 Limpiando artefactos de cuadrícula en imágenes...');

  const img1 = path.join(__dirname, '..', 'firebase', 'public', 'assets', 'coyote-popcorn.png');
  const img2 = path.join(__dirname, '..', 'firebase', 'public', 'assets', 'coyote-roadrunner.png');

  await cleanImage(img1, img1);
  console.log('✅ coyote-popcorn.png limpiado.');

  await cleanImage(img2, img2);
  console.log('✅ coyote-roadrunner.png limpiado.');
}

main().catch(console.error);
