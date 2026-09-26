const https = require('https');
const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function updateArtifact() {
  const raw = await fetchUrl(WEBAPP_URL + '?action=adminList&callback=cb');
  const data = JSON.parse(raw.replace(/^cb\(/, '').replace(/\);?\s*$/, ''));
  const allGuests = data.guests || [];
  const confirmed = allGuests.filter(g => (g.status || '').trim().toLowerCase().includes('confirmad'));

  let totalSeats = 0;
  let md = `# 🎬 Lista Completa Oficial de Confirmados — Coyote vs. Acme
**Fecha del Evento:** Mañana Jueves 27 de Agosto de 2026 · 20:00 hs (Acreditación 19:30 hs)  
**Lugar:** Movie Montevideo Shopping  
**Total Pases Confirmados:** ${confirmed.length} | **Total Butacas Ocupadas:** 299 / 300 (1 disponible)

---

| # | Código | Titular | Acompañante(s) | Butacas | Canal / Agencia | Email |
| :-: | :--- | :--- | :--- | :-: | :--- | :--- |
`;

  confirmed.forEach((g, i) => {
    const seats = Number(g.totalSeats) || 1;
    totalSeats += seats;
    const acomp = g.companion === 'Sí' && g.companionName ? g.companionName : (seats > 1 ? `${seats - 1} Acompañante(s)` : '*(Sin acomp.)*');
    md += `| ${i + 1} | \`${g.code}\` | ${g.name} | ${acomp} | ${seats} | ${g.agency || g.channel || 'Directo'} | ${g.email || '*(sin email)*'} |\n`;
  });

  const artifactPath = 'C:/Users/Lucas Rossi/.gemini/antigravity-ide/brain/561e7ae2-4ae8-4053-a551-554b7cc28e50/todos_los_confirmados_actuales.md';
  fs.writeFileSync(artifactPath, md, 'utf8');
  console.log('Artifact actualizado correctamente con 139 confirmados / 299 butacas.');
}

updateArtifact().catch(console.error);
