const fs = require('fs');
const https = require('https');
const xlsx = require('xlsx');

const scriptUrl = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec?action=adminList';

function fetchUrl(url) {
  https.get(url, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return fetchUrl(res.headers.location);
    }
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const list = json.guests || [];
        
        // Filter COSEM pending guests
        const cosemPending = list.filter(g => {
          const agency = (g.agency || '').toUpperCase();
          const channel = (g.channel || '').toUpperCase();
          const referent = (g.referent || '').toUpperCase();
          const email = (g.email || '').toLowerCase();
          const isCosem = agency.includes('COSEM') || channel.includes('COSEM') || referent.includes('COSEM') || email.includes('cosem');
          const isPending = (g.status || 'Pendiente').toLowerCase().includes('pendiente');
          return isCosem && isPending;
        });

        console.log(`Total invitados COSEM pendientes encontrados: ${cosemPending.length}`);

        const exportRows = cosemPending.map((g, idx) => ({
          '#': idx + 1,
          'Código VIP': g.code,
          'Nombre': g.name,
          'Email': g.email,
          'Teléfono': g.phone || '',
          'Empresa': g.agency || 'COSEM',
          'Cupos Asignados': Number(g.totalSeats) || 2,
          'Estado': g.status,
          'Estado de Envío': g.mailStatus || 'Pendiente de envío',
          'Link Invitación': g.link || ('https://ua-eventos-uy.web.app/coyote-vs-acme?i=' + g.code)
        }));

        // 1. Guardar Excel (.xlsx)
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(exportRows);
        ws['!cols'] = [
          { wch: 4 },
          { wch: 14 },
          { wch: 25 },
          { wch: 32 },
          { wch: 16 },
          { wch: 14 },
          { wch: 16 },
          { wch: 12 },
          { wch: 26 },
          { wch: 65 }
        ];
        xlsx.utils.book_append_sheet(wb, ws, 'COSEM_Pendientes');
        xlsx.writeFile(wb, 'COSEM_Invitados_Pendientes.xlsx');

        // 2. Guardar CSV (.csv)
        const csvHeader = ['#', 'Código VIP', 'Nombre', 'Email', 'Teléfono', 'Empresa', 'Cupos Asignados', 'Estado', 'Estado de Envío', 'Link Invitación'].map(h => `"${h}"`).join(';');
        const csvLines = exportRows.map(r => [
          r['#'],
          `"${r['Código VIP']}"`,
          `"${r['Nombre']}"`,
          `"${r['Email']}"`,
          `"${r['Teléfono']}"`,
          `"${r['Empresa']}"`,
          `"${r['Cupos Asignados']}"`,
          `"${r['Estado']}"`,
          `"${r['Estado de Envío']}"`,
          `"${r['Link Invitación']}"`
        ].join(';'));
        fs.writeFileSync('COSEM_Invitados_Pendientes.csv', [csvHeader, ...csvLines].join('\n'), 'utf8');

        // 3. Guardar JSON (.json)
        fs.writeFileSync('COSEM_Invitados_Pendientes.json', JSON.stringify(exportRows, null, 2), 'utf8');

        console.log('Archivos generados con éxito:');
        console.log('- COSEM_Invitados_Pendientes.xlsx');
        console.log('- COSEM_Invitados_Pendientes.csv');
        console.log('- COSEM_Invitados_Pendientes.json');

        console.log('\n--- DETALLE DE INVITADOS COSEM PENDIENTES ---');
        exportRows.forEach(r => {
          console.log(`${r['#']}. ${r['Nombre']} (${r['Email'] || 'Sin email'}) | Código: ${r['Código VIP']} | Cupos: ${r['Cupos Asignados']} | Envío: ${r['Estado de Envío']}`);
          console.log(`   Link: ${r['Link Invitación']}`);
        });

      } catch (e) {
        console.error('Error:', e.message);
      }
    });
  }).on('error', err => console.error('Request error:', err));
}

fetchUrl(scriptUrl);
