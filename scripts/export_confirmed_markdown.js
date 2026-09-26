const https = require('https');
const fs = require('fs');
const path = require('path');

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

async function run() {
  console.log('Obteniendo lista de invitados desde Google Sheets...');
  const raw = await fetchUrl(`${WEBAPP_URL}?action=adminList&callback=cb&_=${Date.now()}`);
  const jsonStr = raw.replace(/^cb\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(jsonStr);
  const guests = data.guests || [];

  const confirmed = guests.filter(g => (g.status || '').trim().toLowerCase().includes('confirmad'));
  confirmed.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));

  let totalSeats = 0;
  let mdContent = `# 🎬 Lista Oficial de Invitados Confirmados · Coyote vs. Acme
**Universal Assistance Uruguay · Movie Montevideo Shopping**  
**Fecha:** Jueves 27 de Agosto · 19:30 hs Recepción | 20:00 hs Función  
**Capacidad Total Confirmada:** ${confirmed.length} pases titulares · 

| # | Titular | Butacas | Acompañante(s) | Canal / Empresa | Código | Link Directo de Entrada VIP |
|---|---|:---:|---|---|:---:|---|
`;

  confirmed.forEach((g, idx) => {
    const seats = Number(g.totalSeats) || 1;
    totalSeats += seats;
    const comp = (g.companionName || '').trim() || (seats > 1 ? 'Sin nombre especificado' : '—');
    const agency = (g.agency || '').trim() || (g.channel || 'DIRECTO');
    const link = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${g.code}`;
    mdContent += `| ${idx + 1} | **${g.name}** | **${seats}** | ${comp} | ${agency} | \`${g.code}\` | [🎟️ Ver Pase VIP](${link}) |\n`;
  });

  mdContent = mdContent.replace('**Capacidad Total Confirmada:** ' + confirmed.length + ' pases titulares · ', `**Capacidad Total Confirmada:** ${confirmed.length} pases titulares · **${totalSeats} butacas ocupadas**\n\n`);

  const artifactPath = path.resolve('C:/Users/Lucas Rossi/.gemini/antigravity-ide/brain/561e7ae2-4ae8-4053-a551-554b7cc28e50/lista_confirmados_con_links.md');
  fs.writeFileSync(artifactPath, mdContent, 'utf8');
  fs.writeFileSync('lista_confirmados_con_links.md', mdContent, 'utf8');

  console.log(`✅ Archivo generado con éxito: ${confirmed.length} pases | ${totalSeats} butacas.`);
}

run().catch(console.error);
