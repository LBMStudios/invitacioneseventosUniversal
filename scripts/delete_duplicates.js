const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

async function deleteCode(code) {
  console.log(`🗑️ Eliminando código duplicado: ${code}...`);
  const u = `${WEBAPP_URL}?action=deleteGuest&code=${encodeURIComponent(code)}`;
  const res = await fetch(u);
  const text = await res.text();
  console.log(`  Respuesta de la API (${code}):`, text.slice(0, 150));
}

async function main() {
  const codes = ['UA-96126462', 'UA-96126463', 'UA-96126464', 'UA-96126465'];
  for (const c of codes) {
    await deleteCode(c);
  }
  console.log('\n✨ Proceso de eliminación completado.');
}

main().catch(console.error);
