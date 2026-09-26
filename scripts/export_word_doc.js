const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchUrl(u) {
  return new Promise((resolve, reject) => {
    https.get(u, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔄 Descargando datos para el documento de Word...');
  const raw = await fetchUrl('https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList&callback=cb');
  const cleanJson = raw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(cleanJson);
  const allGuests = data.guests || [];

  const isConfirmed = (s) => {
    if (!s) return false;
    const str = s.toLowerCase().trim();
    return str === 'confirmado' || str.includes('vip') || str === 'sí' || str === 'si';
  };

  const confirmed = allGuests.filter(g => isConfirmed(g.status));
  let totalSeats = 0;

  const tableRowsHtml = confirmed.map((g, index) => {
    const seats = Number(g.totalSeats || 1);
    totalSeats += seats;
    const directLink = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}`;
    const compText = g.companionName || (seats > 1 ? 'Acompañante Confirmado' : '—');
    const agencyText = g.agency || 'Universal Assistance';
    const referentText = g.referent || '—';
    const emailText = g.email || '—';
    const isEven = index % 2 === 1;
    const bgRow = isEven ? '#f8fafc' : '#ffffff';

    return `
      <tr style="background-color: ${bgRow};">
        <td style="padding: 8px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #475569; font-size: 11px;">${index + 1}</td>
        <td style="padding: 8px 6px; border: 1px solid #cbd5e1; font-family: Consolas, monospace; font-size: 11px; font-weight: bold; color: #0f172a;">${g.code}</td>
        <td style="padding: 8px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #071938; font-size: 12px;">${g.name}</td>
        <td style="padding: 8px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: 900; color: #ee1f73; font-size: 13px;">${seats}</td>
        <td style="padding: 8px 8px; border: 1px solid #cbd5e1; color: #334155; font-size: 11px;">${compText}</td>
        <td style="padding: 8px 8px; border: 1px solid #cbd5e1; color: #475569; font-size: 11px; font-weight: 600;">${agencyText}</td>
        <td style="padding: 8px 6px; border: 1px solid #cbd5e1; color: #64748b; font-size: 11px; text-align: center;">${referentText}</td>
        <td style="padding: 8px 6px; border: 1px solid #cbd5e1; color: #0284c7; font-size: 10px;">${emailText}</td>
        <td style="padding: 8px 6px; border: 1px solid #cbd5e1; text-align: center;">
          <a href="${directLink}" style="color: #ee1f73; text-decoration: none; font-weight: bold; font-size: 11px;">Ver Pase 🎟️</a>
        </td>
      </tr>
    `;
  }).join('');

  const wordHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Lista Oficial de Confirmados - Coyote vs Acme</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page Section1 {
        size: 21.59cm 27.94cm;
        margin: 1.5cm 1.5cm 1.5cm 1.5cm;
        mso-header-margin: 1.0cm;
        mso-footer-margin: 1.0cm;
        mso-paper-source: 0;
      }
      div.Section1 { page: Section1; }
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #1e293b;
        margin: 0;
        padding: 0;
      }
      .header-box {
        background-color: #071938;
        padding: 20px 24px;
        border-radius: 10px;
        color: #ffffff;
        margin-bottom: 20px;
      }
      .header-title {
        font-size: 22px;
        font-weight: 900;
        color: #ffffff;
        margin: 0 0 6px 0;
        letter-spacing: 0.5px;
      }
      .header-subtitle {
        font-size: 13px;
        color: #38bdf8;
        font-weight: bold;
        margin: 0;
      }
      .stats-table {
        width: 100%;
        margin-bottom: 22px;
        border-collapse: collapse;
      }
      .stats-card {
        background-color: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 12px 16px;
        text-align: center;
      }
      .stats-num {
        font-size: 20px;
        font-weight: 900;
        color: #ee1f73;
        margin-bottom: 2px;
      }
      .stats-label {
        font-size: 11px;
        font-weight: bold;
        color: #64748b;
        text-transform: uppercase;
      }
      .main-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      .main-table th {
        background-color: #071938;
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        padding: 10px 6px;
        border: 1px solid #071938;
        letter-spacing: 0.5px;
      }
      .footer-note {
        margin-top: 24px;
        font-size: 11px;
        color: #94a3b8;
        text-align: center;
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
      }
    </style>
  </head>
  <body>
    <div class="Section1">
      
      <!-- ENCABEZADO INSTITUCIONAL -->
      <div class="header-box">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 10px; font-weight: 900; color: #ee1f73; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">UNIVERSAL ASSISTANCE · EVENTO CORPORATIVO</div>
            <h1 class="header-title">🎬 Lista Oficial de Asistentes Confirmados</h1>
            <p class="header-subtitle">Función Especial Privada: Coyote vs. Acme · Movie Montevideo Shopping</p>
          </div>
        </div>
      </div>

      <!-- MÉTRICAS CLAVE -->
      <table class="stats-table" style="width: 100%;">
        <tr>
          <td style="width: 25%; padding: 4px;">
            <div class="stats-card">
              <div class="stats-num">${confirmed.length}</div>
              <div class="stats-label">Pases Confirmados</div>
            </div>
          </td>
          <td style="width: 25%; padding: 4px;">
            <div class="stats-card">
              <div class="stats-num">${totalSeats}</div>
              <div class="stats-label">Butacas Asignadas</div>
            </div>
          </td>
          <td style="width: 25%; padding: 4px;">
            <div class="stats-card">
              <div class="stats-num" style="color: #0284c7;">299</div>
              <div class="stats-label">Capacidad de Sala</div>
            </div>
          </td>
          <td style="width: 25%; padding: 4px;">
            <div class="stats-card">
              <div class="stats-num" style="color: #16a34a;">100%</div>
              <div class="stats-label">Ocupación Total</div>
            </div>
          </td>
        </tr>
      </table>

      <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; font-weight: bold;">
        📅 Fecha y Hora de la Función: <strong>Jueves 27 de Agosto de 2026 · 19:30 hs</strong> &nbsp;|&nbsp; 📍 Lugar: <strong>Movie Montevideo Shopping (Sala 2)</strong>
      </div>

      <!-- TABLA DETALLADA DE ASISTENTES -->
      <table class="main-table">
        <thead>
          <tr>
            <th style="width: 4%;">#</th>
            <th style="width: 11%;">Código</th>
            <th style="width: 20%;">Titular</th>
            <th style="width: 6%;">Butacas</th>
            <th style="width: 20%;">Acompañante(s)</th>
            <th style="width: 15%;">Agencia / Empresa</th>
            <th style="width: 6%;">Ref.</th>
            <th style="width: 12%;">Email</th>
            <th style="width: 6%;">Pase</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="footer-note">
        Documento generado automáticamente por el Sistema de Acreditaciones de Universal Assistance Uruguay · ${new Date().toLocaleString('es-UY')}
      </div>

    </div>
  </body>
  </html>
  `;

  const docPath = path.join(__dirname, '..', 'Lista_Confirmados_Coyote_vs_Acme_2026.doc');
  fs.writeFileSync(docPath, wordHtml, 'utf8');
  console.log(`📄 Documento Word generado exitosamente: ${docPath}`);
}

main().catch(console.error);
