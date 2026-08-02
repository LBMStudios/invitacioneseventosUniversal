# Universal Assistance · Responsive V9

Esta versión conserva la lógica de RSVP de V8 y ajusta únicamente presentación responsive.

## Breakpoints revisados

- Escritorio amplio: 1180 px o más
- Notebook/tablet horizontal: 980–1179 px
- Tablet: 641–979 px
- Celular: 390–640 px
- Celular angosto: 320–389 px
- Celular horizontal con poca altura

## Ajustes principales

- Sin desbordamiento horizontal desde 320 px.
- Header compacto y CTA adaptativo.
- Ticket apilado debajo del contenido en tablet y celular.
- Formulario antes que el resumen en tablet para reducir scroll innecesario.
- Botones de ancho completo y texto multilínea en celular.
- Nombre, código y lugar admiten textos largos sin romper el layout.
- Campos con 16 px en celular para evitar zoom automático en iPhone.
- Avión, nubes y ruta reducidos en pantallas chicas.
- Estados confirmado/no asiste conservan el mismo comportamiento de V8.

## Publicación

Abrir una terminal dentro de `firebase` y ejecutar:

```powershell
firebase deploy --only hosting --project ua-eventos-uy
```

Después abrir la landing con `&v=9` y recargar sin caché.
