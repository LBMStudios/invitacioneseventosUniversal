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
        
        // Filter SEMM & SEMM CALL pending guests
        const semmPending = list.filter(g => {
          const agency = (g.agency || '').toUpperCase();
          const channel = (g.channel || '').toUpperCase();
          const referent = (g.referent || '').toUpperCase();
          const email = (g.email || '').toLowerCase();
          const isSemm = agency.includes('SEMM') || channel.includes('SEMM') || referent.includes('SEMM') || email.includes('semm');
          const isPending = (g.status || 'Pendiente').toLowerCase().includes('pendiente');
          return isSemm && isPending;
        });

        console.log(`Total invitados SEMM / SEMM CALL pendientes: ${semmPending.length}`);

        const exportRows = semmPending.map((g, idx) => ({
          '#': idx + 1,
          'Código VIP': g.code,
          'Nombre': g.name,
          'Email': g.email,
          'Teléfono': g.phone || '',
          'Empresa': g.agency || 'SEMM',
          'Cupos': Number(g.totalSeats) || 2,
          'Estado Envío': g.mailStatus || 'Pendiente de envío',
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
          { wch: 8 },
          { wch: 26 },
          { wch: 65 }
        ];
        xlsx.utils.book_append_sheet(wb, ws, 'SEMM_Pendientes');
        xlsx.writeFile(wb, 'SEMM_Invitados_Pendientes.xlsx');

        // 2. Guardar CSV (.csv)
        const csvHeader = ['#', 'Código VIP', 'Nombre', 'Email', 'Teléfono', 'Empresa', 'Cupos', 'Estado Envío', 'Link Invitación'].map(h => `"${h}"`).join(';');
        const csvLines = exportRows.map(r => [
          r['#'],
          `"${r['Código VIP']}"`,
          `"${r['Nombre']}"`,
          `"${r['Email']}"`,
          `"${r['Teléfono']}"`,
          `"${r['Empresa']}"`,
          `"${r['Cupos']}"`,
          `"${r['Estado Envío']}"`,
          `"${r['Link Invitación']}"`
        ].join(';'));
        fs.writeFileSync('SEMM_Invitados_Pendientes.csv', [csvHeader, ...csvLines].join('\n'), 'utf8');

        console.log('\n--- DETALLE DE INVITADOS SEMM / SEMM CALL PENDIENTES ---');
        exportRows.forEach(r => {
          console.log(`${r['#']}. [${r['Empresa']}] ${r['Nombre']} (${r['Email'] || 'Sin email'}) | Código: ${r['Código VIP']} | Cupos: ${r['Cupos']} | Envío: ${r['Estado Envío']}`);
          console.log(`   Link: ${r['Link Invitación']}`);
        });

      } catch (e) {
        console.error('Error:', e.message);
      }
    });
  }).on('error', err => console.error('Request error:', err));
}

fetchUrl(scriptUrl);
