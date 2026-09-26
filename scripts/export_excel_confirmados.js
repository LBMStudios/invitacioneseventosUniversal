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
  console.log('🔄 Descargando lista actualizada de confirmados desde Google Apps Script...');
  const raw = await fetchUrl('https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList&callback=cb');
  const cleanJson = raw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(cleanJson);
  const allGuests = data.guests || [];

  const isConfirmed = (s) => {
    if (!s) return false;
    const str = s.toLowerCase().trim();
    return str === 'confirmado' || str.includes('vip') || str === 'sí' || str === 'si';
  };

  const confirmedGuests = allGuests.filter(g => isConfirmed(g.status));
  console.log(`✅ ${confirmedGuests.length} pases confirmados encontrados.`);

  let totalSeats = 0;
  const rows = confirmedGuests.map((g, index) => {
    const seats = Number(g.totalSeats || 1);
    totalSeats += seats;
    const directLink = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}`;

    return {
      'N°': index + 1,
      'Código Invitación': g.code,
      'Titular / Invitado': g.name,
      'Butacas Asignadas': seats,
      'Acompañante(s)': g.companionName || (seats > 1 ? 'Acompañante Confirmado' : 'Sin acompañante'),
      'Agencia / Empresa': g.agency || 'Universal Assistance',
      'Referente UA': g.referent || '',
      'Email': g.email || '',
      'Teléfono': g.phone || '',
      'Estado': 'Confirmado',
      'Fecha de Registro': g.responseDate || 'Pre-asignado',
      'Link Pase Digital': directLink
    };
  });

  console.log(`🎟️ Total Butacas en Sala: ${totalSeats}`);

  // 1. Crear libro Excel XLSX
  const wb = XLSX.utils.book_new();

  // Hoja 1: Lista Detallada
  const ws = XLSX.utils.json_to_sheet(rows);

  // Ajustar anchos de columnas
  ws['!cols'] = [
    { wch: 6 },  // N°
    { wch: 16 }, // Código
    { wch: 28 }, // Titular
    { wch: 18 }, // Butacas
    { wch: 32 }, // Acompañante
    { wch: 24 }, // Agencia
    { wch: 18 }, // Referente
    { wch: 30 }, // Email
    { wch: 16 }, // Teléfono
    { wch: 14 }, // Estado
    { wch: 22 }, // Fecha
    { wch: 65 }  // Link
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Confirmados Coyote vs Acme');

  // Hoja 2: Resumen del Evento
  const summaryRows = [
    { 'Métrica': 'Evento', 'Valor': 'Función Especial Coyote vs. Acme - Universal Assistance' },
    { 'Métrica': 'Lugar', 'Valor': 'Movie Montevideo Shopping - Sala 2' },
    { 'Métrica': 'Fecha y Hora', 'Valor': 'Jueves 27 de Agosto de 2026 - 19:30 hs' },
    { 'Métrica': 'Total Pases Confirmados', 'Valor': confirmedGuests.length },
    { 'Métrica': 'Total Butacas Ocupadas', 'Valor': totalSeats },
    { 'Métrica': 'Capacidad de Sala', 'Valor': 299 },
    { 'Métrica': 'Ocupación', 'Valor': '100%' },
    { 'Métrica': 'Fecha de Generación del Reporte', 'Valor': new Date().toLocaleString('es-UY') }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen de Sala');

  const xlsxPath = path.join(__dirname, '..', 'Lista_Confirmados_Coyote_vs_Acme_2026.xlsx');
  const csvPath = path.join(__dirname, '..', 'Lista_Confirmados_Coyote_vs_Acme_2026.csv');

  XLSX.writeFile(wb, xlsxPath);
  console.log(`📄 Archivo Excel generado: ${xlsxPath}`);

  // 2. Crear archivo CSV con BOM UTF-8 para compatibilidad directa con Excel en español
  const csvContent = XLSX.utils.sheet_to_csv(ws);
  fs.writeFileSync(csvPath, '\ufeff' + csvContent, 'utf8');
  console.log(`📄 Archivo CSV generado: ${csvPath}`);
}

main().catch(console.error);
