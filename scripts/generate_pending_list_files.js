const https = require('https');
const fs = require('fs');
const path = require('path');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getJSON(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('Obteniendo lista de invitados desde la base live...');
  const data = await getJSON(WEBAPP_URL + '?action=adminList');
  const guests = data.guests || [];

  const pending = guests.filter(g => (g.status || '').toLowerCase() === 'pendiente');

  console.log(`Total invitados pendientes: ${pending.length}`);

  // 1. Guardar CSV (UTF-8 con BOM para apertura perfecta en Excel)
  const headers = ['Código', 'Nombre', 'Email', 'Teléfono', 'Agencia / Empresa', 'Canal', 'Referente UA', 'Cupos Asignados', 'Link Invitación Digital', 'Estado de Envío'];
  
  const csvRows = pending.map(g => [
    g.code || '',
    g.name || '',
    g.email || '',
    g.phone || '',
    g.agency || '',
    g.channel || '',
    g.referent || '',
    g.totalSeats || 2,
    g.link || `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}`,
    g.mailStatus || 'Pendiente de envío'
  ]);

  const csvContent = '\uFEFF' + [headers.join(';')].concat(
    csvRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
  ).join('\r\n');

  const csvPath = path.resolve(__dirname, '..', 'Lista_Invitados_Pendientes.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  console.log(`✅ CSV generado: ${csvPath}`);

  // 2. Intentar generar XLSX si la librería xlsx está disponible
  try {
    const xlsx = require('xlsx');
    const wsData = [headers, ...csvRows];
    const ws = xlsx.utils.aoa_to_sheet(wsData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Pendientes');
    const xlsxPath = path.resolve(__dirname, '..', 'Lista_Invitados_Pendientes.xlsx');
    xlsx.writeFile(wb, xlsxPath);
    console.log(`✅ Excel XLSX generado: ${xlsxPath}`);
  } catch (err) {
    console.log('Librería xlsx no disponible, archivo CSV generado con compatibilidad total para Excel.');
  }

  // 3. Guardar JSON
  const jsonPath = path.resolve(__dirname, '..', 'Lista_Invitados_Pendientes.json');
  fs.writeFileSync(jsonPath, JSON.stringify(pending, null, 2), 'utf-8');
  console.log(`✅ JSON generado: ${jsonPath}`);
})();
