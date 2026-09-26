const fs = require('fs');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

async function callApi(action, params) {
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const fullUrl = WEBAPP_URL + '?action=' + encodeURIComponent(action) + '&' + query;
  const res = await fetch(fullUrl);
  return await res.json();
}

async function main() {
  console.log('Creando a Renatta Almeida (LIBERTY, 2 accesos)...');
  const addRes = await callApi('addGuest', { name: 'Renatta Almeida', email: '' });
  if (addRes.code) {
    await callApi('updateGuest', {
      code: addRes.code,
      name: 'Renatta Almeida',
      email: '',
      phone: '',
      agency: 'LIBERTY',
      channel: 'AGENCIA',
      referent: 'AB',
      stage: 'Envío Manual',
      totalSeats: 2,
      status: 'Pendiente'
    });
    console.log(`✅ Creada Renatta Almeida: ${addRes.code}`);
    console.log(`👉 Link: https://ua-eventos-uy.web.app/coyote-vs-acme?i=${addRes.code}`);
  }
}

main().catch(console.error);
