const fs = require('fs');

const content = fs.readFileSync('Brevo_Lista_Agencias_Organizada.csv', 'utf8');
const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

let countWithPhone = 0;
const contactsWithPhone = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
  const values = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index === regex.lastIndex) regex.lastIndex++;
    values.push((match[1] !== undefined ? match[1] : match[2] || '').trim());
  }
  const name = values[0] || '';
  const agency = values[1] || '';
  const email = values[2] || '';
  const phone = values[3] || '';

  if (phone && phone.replace(/\D/g, '').length >= 8) {
    countWithPhone++;
    contactsWithPhone.push({ name, agency, email, phone });
  }
}

console.log(`📱 Total contactos en el archivo de Brevo con teléfono: ${countWithPhone} de ${lines.length - 1}`);
console.log('\nListado completo de contactos con WhatsApp en Brevo:');
contactsWithPhone.forEach((c, idx) => {
  console.log(`${idx + 1}. ${c.name} (${c.agency}) -> ${c.phone} [${c.email || 'Sin email'}]`);
});
