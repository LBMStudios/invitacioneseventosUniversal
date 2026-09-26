const fs = require('fs');

const rawText = `
[13:23, 18/8/2026] Ana Laura Britos: Agustin Luna
 29022772 Int. 129
 aluna@sevens.com.uy
Bruno Bulloni
 29022772 Int. 117
 bbulloni@sevens.com.uy
Fabián García
 29022772 Int. 114
 fgarcia@sevens.com.uy
Guillermo Lopez
 29022772 Int. 125
 glopez@sevens.com.uy
Guillermo Varela
 29022772 Int. 112
 gvarela@sevens.com.uy
Joaquin Ordoñez
 29022772 Int. 135
 jordonez@sevens.com.uy
Juan Manuel Otasu
 29022772 Int. 118
 jmotasu@sevens.com.uy
Martin Correa
 29022772 Int. 136
 mcorrea@sevens.com.uy
Renzo Abbate
 29022772 Int. 123
 rabbate@sevens.com.uy
Rodrigo Garciarena
 29022772 Int. 122
 rgarciarena@sevens.com.uy
Sebastian Abreu
 29022772 Int. 124
 sabreu@sevens.com.uy
[13:24, 18/8/2026] Ana Laura Britos: Andrés Oyarbide
 29022772 Int. 182
 aoyarbide@sevens.com.uy
Federico Rosselli
 29022772 Int. 108
 frosselli@sevens.com.uy
Gerardo Cairoli
 29022772 Int. 145
 gcairoli@sevens.com.uy
Pablo Zanet
 29022772 Int. 119
 pzanet@sevens.com.uy
[13:25, 18/8/2026] Ana Laura Britos: Federico Blankleider
 29022772 Int. 130
 fblankleider@sevens.com.uy
[13:25, 18/8/2026] Ana Laura Britos: Catherin Bouzan
 29022772 Int. 107
 cbouzan@sevens.com.uy
[13:26, 18/8/2026] Ana Laura Britos: Natalia Hernández
 29022772 Int. 144
 nhernandez@sevens.com.uy
[13:26, 18/8/2026] Ana Laura Britos: Claudio Dorner
 29022772 Int. 115
 cdorner@sevens.com.uy
Sergio Tournier
 29022772 Int. 116
 stournier@sevens.com.uy
[13:31, 18/8/2026] Ana Laura Britos: Emiliano Broggi
 29022772 Int. 141
 ebroggi@sevens.com.uy
Fabian Jaime
 29022772 Int. 161
 fjaime@sevens.com.uy
Fabian Stipo
 29022772 Int. 105
 fstipo@sevens.com.uy
Florencia Rivero
 29022772 Int. 131
 frivero@sevens.com.uy
Gustavo Tournier
 29022772 Int. 113
 gtournier@sevens.com.uy
Lorena Acosta
 29022772 Int. 143
 lacosta@sevens.com.uy
Mateo Pagani
 29022772 Int. 162
 mpagani@sevens.com.uy
Nicolas Seoane
 29022772 Int. 133
 nseoane@sevens.com.uy
Virginia Zegarra
 29022772 Int. 142
 vzegarra@sevens.com.uy
Walter Fernandez
 29022772 Int. 140
 wfernandez@sevens.com.uy
[13:33, 18/8/2026] Ana Laura Britos: Emiliano Broggi
 29022772 Int. 141
 ebroggi@sevens.com.uy
Fabian Jaime
 29022772 Int. 161
 fjaime@sevens.com.uy
Fabian Stipo
 29022772 Int. 105
 fstipo@sevens.com.uy
Florencia Rivero
 29022772 Int. 131
 frivero@sevens.com.uy
Gustavo Tournier
 29022772 Int. 113
 gtournier@sevens.com.uy
Lorena Acosta
 29022772 Int. 143
 lacosta@sevens.com.uy
Mateo Pagani
 29022772 Int. 162
 mpagani@sevens.com.uy
Nicolas Seoane
 29022772 Int. 133
 nseoane@sevens.com.uy
Virginia Zegarra
 29022772 Int. 142
 vzegarra@sevens.com.uy
Walter Fernandez
 29022772 Int. 140
 wfernandez@sevens.com.uy
[13:35, 18/8/2026] Ana Laura Britos: Gabriela Vera
 29022772 Int. 120
 gvera@sevens.com.uy
Melina Barboza
 29022772 Int. 152
 mbarboza@sevens.com.uy
Milagros Costa
 29022772 Int. 153
 mcosta@sevens.com.uy
Sebastián Álvarez
 29022772 Int. 157
 salvarez@sevens.com.uy
[13:36, 18/8/2026] Ana Laura Britos: Cintia Correa
 29022772 Int. 150
 ccorrea@sevens.com.uy
Florencia Pombo
 29022772 Int. 134
 fpombo@sevens.com.uy
[13:36, 18/8/2026] Ana Laura Britos: Agustín Marquez
 29022772 Int. 179
 amarquez@sevens.com.uy
Aldana Bideau
 29022772 Int. 137
 abideau@sevens.com.uy
[13:38, 18/8/2026] Ana Laura Britos: Bettina Vitola
 29022772 Int. 139
 bvitola@sevens.com.uy
Lucia Tur
 29022772 Int. 158
 ltur@sevens.com.uy
Rodrigo Fontana
 29022772 Int. 151
 rfontana@sevens.com.uy
`;

const lines = rawText
  .split('\n')
  .map(l => l.replace(/\[\d+:\d+,\s*[\d\/]+\]\s*[^:]+:\s*/, '').trim())
  .filter(Boolean);

const list = [];
let i = 0;
while (i < lines.length) {
  const name = lines[i];
  let phone = '';
  let email = '';
  
  if (i + 1 < lines.length && (lines[i+1].includes('29022772') || lines[i+1].includes('Int.'))) {
    phone = '29022772';
    i++;
  }
  if (i + 1 < lines.length && lines[i+1].includes('@')) {
    email = lines[i+1];
    i++;
  }
  if (name && email) {
    list.push({ name, phone, email });
  }
  i++;
}

// Deduplicate
const unique = [];
const seen = new Set();
for (const p of list) {
  const k = p.email.toLowerCase();
  if (!seen.has(k)) {
    seen.add(k);
    unique.push(p);
  }
}

console.log('Total contactos únicos encontrados:', unique.length);
unique.forEach((u, idx) => {
  console.log(`${idx + 1}. ${u.name} | Tel: ${u.phone} | Email: ${u.email}`);
});

fs.writeFileSync('scripts/sevens_parsed.json', JSON.stringify(unique, null, 2), 'utf8');
