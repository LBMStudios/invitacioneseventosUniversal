const fs = require('fs');
const xlsx = require('xlsx');

const list = JSON.parse(fs.readFileSync('live_guests_dump.json', 'utf8'));

const casmuConfirmed = list.filter(g => {
  const s = JSON.stringify(g).toUpperCase();
  return s.includes('CASMU') && (g.status || '').toLowerCase().includes('confirmad');
});

const exportRows = casmuConfirmed.map((g, idx) => ({
  '#': idx + 1,
  'Código VIP': g.code,
  'Titular': g.name,
  'Email': g.email,
  'Celular': g.phone || '-',
  'Acompañante': g.companionName || '(Sin acompañante)',
  'Butacas': Number(g.totalSeats) || 2,
  'Fecha Confirmación': g.responseDate || 'Registrado',
  'Link Pase VIP': g.link || ('https://ua-eventos-uy.web.app/coyote-vs-acme?i=' + g.code)
}));

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(exportRows);
ws['!cols'] = [
  { wch: 4 },
  { wch: 14 },
  { wch: 24 },
  { wch: 28 },
  { wch: 14 },
  { wch: 24 },
  { wch: 10 },
  { wch: 22 },
  { wch: 65 }
];
xlsx.utils.book_append_sheet(wb, ws, 'CASMU_Confirmados');
xlsx.writeFile(wb, 'CASMU_Invitados_Confirmados.xlsx');

console.log('CASMU_Invitados_Confirmados.xlsx generado con éxito');
