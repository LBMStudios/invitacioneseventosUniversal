const fs = require('fs');

const byAgency = JSON.parse(fs.readFileSync('./scripts/pending_by_agency.json', 'utf8'));

// Normalizar nombres de agencia
const normalized = {};

Object.entries(byAgency).forEach(([ag, guests]) => {
  let groupKey = ag.trim();
  const up = groupKey.toUpperCase();

  if (up.includes('SEVENS')) groupKey = 'Sevens';
  else if (up.includes('AZUL')) groupKey = 'Azul Viajes';
  else if (up.includes('MELITOUR')) groupKey = 'Melitour';
  else if (up.includes('JORGE') || up === 'JM') groupKey = 'Jorge Martínez';
  else if (up.includes('TRAVELOZ') || up.includes('DESTINICO')) groupKey = 'Traveloz / Destinico';
  else if (up.includes('LIBERTY')) groupKey = 'Liberty';
  else if (up.includes('MERCURIO')) groupKey = 'Mercurio Viajes';
  else if (up.includes('ESPAÑOLA') || up.includes('ASESP')) groupKey = 'Asociación Española';
  else if (up.includes('CASMU')) groupKey = 'CASMU';
  else if (up.includes('COSEM')) groupKey = 'COSEM';
  else if (up.includes('SEMM')) groupKey = 'SEMM';
  else if (up.includes('EVANGELICO')) groupKey = 'Hospital Evangélico';
  else if (up.includes('AMERICANO')) groupKey = 'Seguro Americano';
  else if (up.includes('SBI')) groupKey = 'SBI Seguros';
  else if (up.includes('ITAU')) groupKey = 'Banco Itaú';
  else if (up.includes('SANTANDER')) groupKey = 'Santander';
  else if (up.includes('BBVA')) groupKey = 'BBVA';
  else if (up.includes('RUMBOS')) groupKey = 'Rumbos';
  else if (up.includes('V Y T') || up.includes('V&T')) groupKey = 'V y T';
  else if (up.includes('ACTIVE')) groupKey = 'Active Travel';
  else if (up.includes('OCA')) groupKey = 'OCA';
  else if (up.includes('SUMMUM')) groupKey = 'Summum';
  else if (up.includes('BATISTA')) groupKey = 'Batista Viajes';
  else if (up.includes('BIOERIX')) groupKey = 'Bioerix';
  else if (up.includes('TRYOLABS')) groupKey = 'Tryolabs';

  if (!normalized[groupKey]) normalized[groupKey] = [];
  normalized[groupKey].push(...guests);
});

let output = '';

Object.keys(normalized).sort().forEach(group => {
  const list = normalized[group];
  // Eliminar duplicados de código si los hubiera
  const seen = new Set();
  const uniqueList = list.filter(g => {
    if (seen.has(g.code)) return false;
    seen.add(g.code);
    return true;
  });

  output += `\n### 🏢 ${group}\n`;
  uniqueList.forEach(g => {
    const seats = g.totalSeats || 2;
    output += `🎬 **${g.name}** (${seats} accesos)\n👉 https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}\n\n`;
  });
  output += `📌 *Recordarles que tienen tiempo para confirmar hasta el Jueves 20 de Agosto.*\n---\n`;
});

fs.writeFileSync('./scripts/whatsapp_by_company.txt', output, 'utf8');
console.log('Generado whatsapp_by_company.txt');
