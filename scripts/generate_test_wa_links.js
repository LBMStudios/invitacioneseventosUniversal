const textMsgConfirmed = `¡Hola Lucas! 👋

Te escribimos de parte de *Universal Assistance* para confirmar tus lugares para nuestra función exclusiva de cine:

🎬 *Película:* Coyote vs. Acme
🗓️ *Fecha:* Jueves 27 de Agosto (la próxima semana)
⏰ *Horario:* 19:30 hs (Recepción y acreditación) · 20:00 hs (Función puntual)
📍 *Lugar:* Movie Montevideo Shopping
🍿 *Pop y bebida:* Cortesía de Universal Assistance

🎟️ *Tus lugares confirmados:* 2 entradas
🎫 *Código de reserva:* UA-004

👉 Podés ver tu entrada digital y código QR de acceso aquí:
https://ua-eventos-uy.web.app/coyote-vs-acme?i=UA-004

¡Te esperamos para compartir una gran noche! 🍿✨
----------------------------------------
Universal Assistance Uruguay`;

const textMsgPending = `¡Hola Lucas! 👋

Universal Assistance tiene el agrado de invitarte a una función exclusiva de cine 🎬

🍿 Película: Coyote vs. Acme
🗓️ Fecha: Jueves 27 de Agosto
⏰ Horario: 19:30 hs (Recepción y acreditación) · 20:00 hs (Función puntual)
📍 Lugar: Movie Montevideo Shopping
🎟️ Tu Pase: 2 entradas
🍿 Incluye: Pop y bebida cortesía de Universal Assistance

⚠️ IMPORTANTE:
Esta invitación es personal e intransferible. Los cupos de la sala son estrictamente limitados.

👉 Confirmá tu lugar ingresando aquí:
https://ua-eventos-uy.web.app/coyote-vs-acme?i=UA-004

¡Te esperamos para compartir una gran noche de cine!
----------------------------------------
Universal Assistance Uruguay`;

const urlConfirmed = 'https://wa.me/59897347217?text=' + encodeURIComponent(textMsgConfirmed);
const urlPending = 'https://wa.me/59897347217?text=' + encodeURIComponent(textMsgPending);

console.log('=== LINK DIRECTO WHATSAPP CONFIRMADO ===\n' + urlConfirmed);
console.log('\n=== LINK DIRECTO WHATSAPP INVITACION PENDIENTE ===\n' + urlPending);
