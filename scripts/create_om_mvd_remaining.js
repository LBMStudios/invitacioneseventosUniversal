const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const remainingMvd = [
  'Santiago Cirilli',
  'Bernardo Meyer',
  'Elisa Ayres',
  'Enrique Roldan',
  'Matias Gomez',
  'Michel Sanchez'
];

async function callApi(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  const res = await fetch(fullUrl);
  return await res.json();
}

async function main() {
  for (let i = 0; i < remainingMvd.length; i++) {
    const name = remainingMvd[i];
    console.log(`[${i+1}/${remainingMvd.length}] Creando "${name}" (OM Travel Montevideo)...`);
    const addRes = await callApi('addGuest', { name: name, email: '' });
    if (addRes.code) {
      await callApi('updateGuest', {
        code: addRes.code,
        name: name,
        email: '',
        phone: '',
        agency: 'OM Travel Montevideo',
        channel: 'AGENCIA',
        referent: 'AB',
        stage: 'Envío Manual',
        totalSeats: 2,
        status: 'Pendiente'
      });
      console.log(`  -> Creado con éxito: ${addRes.code}`);
    }
  }

  console.log('\nSincronizando todo el sistema...');
  await callApi('actualizarTodo', {});
  console.log('¡Completado!');
}

main().catch(console.error);
