const https = require('https');

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getJSON(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

(async () => {
  const msg = `¡Hola Lucas! 👋

Te escribimos para realizar una aclaración importante respecto al correo de recordatorio enviado hoy:

Queremos confirmarte que la función especial de cine de Coyote vs. Acme se realizará el JUEVES 27 DE AGOSTO (la próxima semana), y no mañana.

DETALLES CONFIRMADOS:
🗓️ Fecha: Jueves 27 de Agosto de 2026
⏰ Horario: 19:30 hs (Recepción y acreditación) · 20:00 hs (Función puntual)
📍 Lugar: Movie Montevideo Shopping
🍿 Pop y bebida cortesía de Universal Assistance

Tus lugares ya se encuentran 100% reservados y asegurados con tu código UA-001.

¡Te esperamos para compartir una gran noche de cine!
Equipo de Universal Assistance Uruguay`;

  console.log('Enviando correo de prueba a lucasbeathyate@gmail.com...');
  const res = await getJSON(WEBAPP_URL + `?action=sendClarification&targetKey=lucas_test&msg=${encodeURIComponent(msg)}`);
  console.log('Resultado del envío:', res);
})();
