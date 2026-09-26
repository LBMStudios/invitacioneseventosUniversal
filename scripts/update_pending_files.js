const fs = require('fs');
const https = require('https');
const xlsx = require('xlsx');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function exportFreshPending() {
  const res = await fetchUrl(WEBAPP_URL);
  const list = res.guests || [];
  
  const pending = list.filter(g => (g.status || 'Pendiente') === 'Pendiente');
  console.log(`Total pendientes en base: ${pending.length}`);

  const exportRows = pending.map((g, idx) => ({
    'Código': g.code,
    'Nombre': g.name,
    'Email': g.email || '',
    'Teléfono': g.phone || '',
    'Agencia / Empresa': g.agency || '',
    'Canal': g.channel || '',
    'Referente UA': g.referent || '',
    'Cupos Asignados': Number(g.totalSeats) || 2,
    'Link Invitación Digital': g.link || ('https://ua-eventos-uy.web.app/coyote-vs-acme?i=' + g.code),
    'Estado de Envío': g.mailStatus || 'Pendiente de envío'
  }));

  // XLSX
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(exportRows);
  xlsx.utils.book_append_sheet(wb, ws, 'Pendientes');
  xlsx.writeFile(wb, 'Lista_Invitados_Pendientes.xlsx');

  // CSV
  const header = ['Código', 'Nombre', 'Email', 'Teléfono', 'Agencia / Empresa', 'Canal', 'Referente UA', 'Cupos Asignados', 'Link Invitación Digital', 'Estado de Envío'].map(h => h).join(';');
  const lines = exportRows.map(r => [
    `"${r['Código']}"`,
    `"${r['Nombre']}"`,
    `"${r['Email']}"`,
    `"${r['Teléfono']}"`,
    `"${r['Agencia / Empresa']}"`,
    `"${r['Canal']}"`,
    `"${r['Referente UA']}"`,
    `"${r['Cupos Asignados']}"`,
    `"${r['Link Invitación Digital']}"`,
    `"${r['Estado de Envío']}"`
  ].join(';'));
  fs.writeFileSync('Lista_Invitados_Pendientes.csv', [header, ...lines].join('\n'), 'utf8');
  console.log('✅ Lista_Invitados_Pendientes.csv y .xlsx actualizados.');
}

exportFreshPending();
