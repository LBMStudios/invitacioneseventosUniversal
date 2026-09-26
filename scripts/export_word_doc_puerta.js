const fs = require('fs');
const path = require('path');
const https = require('https');
const XLSX = require('xlsx');

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
  console.log('🔄 Generando lista de puerta (orden alfabético)...');
  const raw = await fetchUrl('https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList&callback=cb');
  const cleanJson = raw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(cleanJson);
  const allGuests = data.guests || [];

  const isConfirmed = (s) => {
    if (!s) return false;
    const str = s.toLowerCase().trim();
    return str === 'confirmado' || str.includes('vip') || str === 'sí' || str === 'si';
  };

  // Filtrar y ordenar ALFABÉTICAMENTE por nombre
  const confirmed = allGuests
    .filter(g => isConfirmed(g.status))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));

  let totalSeats = 0;

  const tableRowsHtml = confirmed.map((g, index) => {
    const seats = Number(g.totalSeats || 1);
    totalSeats += seats;
    const compText = g.companionName || (seats > 1 ? 'Acompañante Confirmado' : '—');
    const isEven = index % 2 === 1;
    const bgRow = isEven ? '#f8fafc' : '#ffffff';

    return `
      <tr style="background-color: ${bgRow};">
        <td style="padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #64748b; font-size: 11px;">${index + 1}</td>
        <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #071938; font-size: 13px;">${g.name}</td>
        <td style="padding: 7px 10px; border: 1px solid #cbd5e1; color: #1e293b; font-size: 12px;">${compText}</td>
        <td style="padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: 900; color: #ee1f73; font-size: 14px;">${seats}</td>
        <td style="padding: 7px 8px; border: 1px solid #cbd5e1; font-family: Consolas, monospace; font-size: 11px; color: #475569; text-align: center;">${g.code}</td>
        <td style="padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center; width: 60px;">
          <div style="width: 22px; height: 22px; border: 2px solid #94a3b8; border-radius: 4px; margin: 0 auto;"></div>
        </td>
      </tr>
    `;
  }).join('');

  const wordHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>Planilla de Ingreso a Sala - Coyote vs Acme</title>
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
        margin: 1.2cm 1.2cm 1.2cm 1.2cm;
        mso-header-margin: 0.8cm;
        mso-footer-margin: 0.8cm;
      }
      div.Section1 { page: Section1; }
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #0f172a;
        margin: 0; padding: 0;
      }
      .header-bar {
        background-color: #071938;
        padding: 14px 20px;
        border-radius: 8px;
        color: #ffffff;
        margin-bottom: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header-title {
        font-size: 18px;
        font-weight: 900;
        color: #ffffff;
        margin: 0;
      }
      .header-sub {
        font-size: 11px;
        color: #38bdf8;
        font-weight: 600;
        margin-top: 2px;
      }
      .main-table {
        width: 100%;
        border-collapse: collapse;
      }
      .main-table th {
        background-color: #071938;
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        padding: 8px 6px;
        border: 1px solid #071938;
      }
    </style>
  </head>
  <body>
    <div class="Section1">
      
      <div class="header-bar">
        <div>
          <div style="font-size: 9px; font-weight: 900; color: #ee1f73; text-transform: uppercase; letter-spacing: 1px;">UNIVERSAL ASSISTANCE · PLANILLA DE PUERTA / ACREDITACIÓN</div>
          <h1 class="header-title">🎬 Control de Ingreso a Sala (Orden Alfabético)</h1>
          <div class="header-sub">Función: Coyote vs. Acme · Movie Mvd Shopping (Sala 2) · Jueves 27/08 19:30 hs · <strong>Total: ${totalSeats} Butacas (${confirmed.length} Pases)</strong></div>
        </div>
      </div>

      <table class="main-table">
        <thead>
          <tr>
            <th style="width: 4%;">#</th>
            <th style="width: 32%;">Nombre del Titular</th>
            <th style="width: 36%;">Acompañante(s)</th>
            <th style="width: 10%;">Butacas</th>
            <th style="width: 12%;">Código</th>
            <th style="width: 6%;">Check</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 14px; font-size: 10px; color: #94a3b8; text-align: center;">
        Planilla Oficial de Acreditación · Movie Montevideo Shopping · Sala 2 (Capacidad: 299 Butacas)
      </div>

    </div>
  </body>
  </html>
  `;

  const docPath = path.join(__dirname, '..', 'Lista_Puerta_Ingreso_Coyote_vs_Acme_2026.doc');
  fs.writeFileSync(docPath, wordHtml, 'utf8');
  console.log(`📄 Documento Word de Puerta generado: ${docPath}`);

  // Generar también versión Excel limpia de Puerta
  const excelRows = confirmed.map((g, idx) => ({
    'N°': idx + 1,
    'Nombre del Titular': g.name,
    'Acompañante(s)': g.companionName || (Number(g.totalSeats || 1) > 1 ? 'Acompañante Confirmado' : 'Sin acompañante'),
    'Butacas': Number(g.totalSeats || 1),
    'Código': g.code,
    'Ingreso (Check)': ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelRows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 36 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Planilla de Puerta');
  const xlsxPath = path.join(__dirname, '..', 'Lista_Puerta_Ingreso_Coyote_vs_Acme_2026.xlsx');
  XLSX.writeFile(wb, xlsxPath);
  console.log(`📄 Archivo Excel de Puerta generado: ${xlsxPath}`);
}

main().catch(console.error);
