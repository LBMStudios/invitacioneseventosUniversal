const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const uaLogoSvg = fs.readFileSync(path.resolve(__dirname, '../firebase/public/assets/logo-ua-zurich.svg'), 'utf-8');
const movieLogoSvg = fs.readFileSync(path.resolve(__dirname, '../firebase/public/assets/logo-movie-white.svg'), 'utf-8');
const coyoteTtBase64 = fs.readFileSync(path.resolve(__dirname, '../firebase/public/assets/coyote-clean-title.png')).toString('base64');
const popcornBase64 = fs.readFileSync(path.resolve(__dirname, '../firebase/public/assets/coyote-popcorn.png')).toString('base64');

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 2048px;
      height: 1365px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #020817;
      color: #ffffff;
    }
    .placa-wrapper {
      position: relative;
      width: 2048px;
      height: 1365px;
      padding: 70px 90px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: 
        radial-gradient(circle at 88% 18%, rgba(238, 31, 115, 0.35) 0%, transparent 45%),
        radial-gradient(circle at 12% 82%, rgba(56, 189, 248, 0.3) 0%, transparent 45%),
        radial-gradient(circle at 50% 50%, rgba(11, 33, 73, 0.95) 0%, #020817 100%);
    }

    /* Marco perimetral luminoso */
    .placa-border {
      position: absolute;
      inset: 35px;
      border: 2px solid rgba(56, 189, 248, 0.4);
      border-radius: 36px;
      box-shadow: 
        inset 0 0 80px rgba(0, 0, 0, 0.8),
        0 0 60px rgba(56, 189, 248, 0.2);
      pointer-events: none;
    }
    .placa-border::before {
      content: '';
      position: absolute;
      top: -2px;
      left: 20%;
      right: 20%;
      height: 4px;
      background: linear-gradient(90deg, transparent, #38bdf8, #ee1f73, transparent);
      box-shadow: 0 0 24px #38bdf8;
    }
    .placa-border::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 25%;
      right: 25%;
      height: 4px;
      background: linear-gradient(90deg, transparent, #ee1f73, #38bdf8, transparent);
      box-shadow: 0 0 24px #ee1f73;
    }

    /* HEADER */
    .placa-header {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 30px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    .logo-ua-box svg {
      height: 52px;
      width: auto;
      filter: drop-shadow(0 4px 14px rgba(0,0,0,0.6));
    }
    .header-center-tag {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(7, 25, 56, 0.85);
      border: 1.5px solid rgba(56, 189, 248, 0.4);
      padding: 10px 26px;
      border-radius: 999px;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #38bdf8;
      box-shadow: 0 4px 20px rgba(56, 189, 248, 0.2);
    }
    .logo-movie-box svg {
      height: 48px;
      width: auto;
      filter: drop-shadow(0 4px 14px rgba(0,0,0,0.6));
    }

    /* BODY */
    .placa-body {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 1460px;
      margin: 0 auto;
    }

    .movie-tt-img {
      height: 120px;
      width: auto;
      object-fit: contain;
      margin-bottom: 32px;
      filter: drop-shadow(0 10px 30px rgba(0,0,0,0.8)) drop-shadow(0 0 25px rgba(245, 158, 11, 0.4));
    }

    .main-title {
      font-family: 'Outfit', sans-serif;
      font-size: 76px;
      font-weight: 900;
      line-height: 1.05;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin-bottom: 24px;
      text-shadow: 0 6px 30px rgba(0, 0, 0, 0.9);
    }
    .main-title span.grad-text {
      background: linear-gradient(135deg, #38bdf8 0%, #00f2fe 50%, #ff3b8d 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 4px 20px rgba(56, 189, 248, 0.5));
    }

    .sub-text {
      font-size: 28px;
      font-weight: 600;
      color: #cbd5e1;
      line-height: 1.5;
      max-width: 1100px;
      margin-bottom: 42px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.6);
    }

    .cta-pill {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      background: linear-gradient(135deg, #ee1f73 0%, #d91b65 100%);
      border: 2px solid rgba(255, 255, 255, 0.4);
      padding: 18px 52px;
      border-radius: 999px;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #ffffff;
      box-shadow: 0 10px 40px rgba(238, 31, 115, 0.6), 0 0 30px rgba(238, 31, 115, 0.4);
    }

    /* FOOTER */
    .placa-footer {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 26px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      font-size: 18px;
      font-weight: 700;
      color: #94a3b8;
    }
    .footer-slogan {
      color: #38bdf8;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .footer-web {
      color: #ffffff;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="placa-wrapper">
    <div class="placa-border"></div>

    <!-- HEADER -->
    <header class="placa-header">
      <div class="logo-ua-box">
        ${uaLogoSvg}
      </div>
      <div class="header-center-tag">
        🎬 Avant Premiere Exclusiva
      </div>
      <div class="logo-movie-box">
        ${movieLogoSvg}
      </div>
    </header>

    <!-- BODY -->
    <main class="placa-body">
      <img src="data:image/png;base64,${coyoteTtBase64}" class="movie-tt-img" alt="Coyote vs. Acme">

      <h1 class="main-title">
        ¡Gracias por ser parte<br>
        de <span class="grad-text">nuestro evento</span>!
      </h1>

      <p class="sub-text">
        Fue un placer inmenso compartir juntos esta función especial de cine.<br>
        Esperamos que hayas disfrutado cada momento tanto como nosotros.
      </p>

      <div class="cta-pill">
        ✨ ¡Te esperamos en los próximos! ✨
      </div>
    </main>

    <!-- FOOTER -->
    <footer class="placa-footer">
      <div>Universal Assistance · Uruguay</div>
      <div class="footer-slogan">Tu viaje es tu viaje. Nosotros lo protegemos.</div>
      <div class="footer-web">universalassistance.com</div>
    </footer>
  </div>
</body>
</html>`;

const templatePath = path.resolve(__dirname, 'placa_cierre.html');
fs.writeFileSync(templatePath, htmlContent, 'utf-8');
console.log('Template HTML creado en:', templatePath);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserBin = fs.existsSync(chromePath) ? chromePath : edgePath;

const outHd = path.resolve(__dirname, '../firebase/public/assets/galeria/hd/photo_054.png');
const outWeb = path.resolve(__dirname, '../firebase/public/assets/galeria/web/web_054.png');
const outThumb = path.resolve(__dirname, '../firebase/public/assets/galeria/thumbs/thumb_054.png');

console.log('Generando imagen 2048x1365 con Headless Browser...');
execSync(`"${browserBin}" --headless --disable-gpu --force-device-scale-factor=1 --window-size=2048,1365 --screenshot="${outHd}" "file:///${templatePath.replace(/\\\\/g, '/')}"`);

// Generar copias para web y thumbs
fs.copyFileSync(outHd, outWeb);
fs.copyFileSync(outHd, outThumb);

console.log('¡Placa de cierre HD generada con éxito!');
console.log('HD:', fs.existsSync(outHd), (fs.statSync(outHd).size / 1024).toFixed(1) + ' KB');
