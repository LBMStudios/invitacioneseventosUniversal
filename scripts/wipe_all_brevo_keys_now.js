const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname),
  path.join(__dirname, '..'),
  'C:\\Users\\Lucas Rossi\\.gemini\\antigravity-ide\\brain\\561e7ae2-4ae8-4053-a551-554b7cc28e50\\scratch'
];

let replacedCount = 0;

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      cleanDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.json') || entry.name.endsWith('.gs') || entry.name.endsWith('.txt'))) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (/xkeysib-[a-zA-Z0-9-]+/.test(content)) {
          content = content.replace(/xkeysib-[a-zA-Z0-9-]+/g, 'BREVO_API_KEY_BLOCKED_AND_DISABLED');
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`🔒 Clave bloqueada y neutralizada en: ${entry.name}`);
          replacedCount++;
        }
      } catch (e) {}
    }
  }
}

targetDirs.forEach(cleanDir);
console.log(`\n✅ PROTOCOLO FINALIZADO: Se neutralizaron ${replacedCount} referencias de API Keys.`);
