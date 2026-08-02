# Universal Assistance · Invitación V10

Esta versión mejora únicamente diseño y animación. No modifica la lógica de RSVP ni el backend.

## Cambios visuales
- Paleta UA reforzada: azul institucional, celeste, lila y magenta.
- Encabezado más corporativo y contraste mejorado.
- Animaciones de entrada al hacer scroll.
- Avión y ruta con movimiento más fluido.
- Brillos sutiles en CTA, alerta y ticket.
- Ticket con profundidad y movimiento leve en escritorio.
- Estados hover y focus más consistentes.
- Respeta `prefers-reduced-motion`.

## Publicación
Desde la carpeta `firebase`:

```powershell
firebase deploy --only hosting --project ua-eventos-uy
```

No es necesario actualizar Apps Script para esta versión.
