# V20 · Avión integrado

Esta versión mantiene la lógica funcional de la V19 y modifica únicamente la escena visual superior:

- avión integrado mediante máscara gradual, sin bloque rectangular visible;
- halo y cielo coherentes con el fondo celeste/lila;
- nubes suaves detrás del avión;
- ruta de vuelo y marcador de Montevideo Shopping;
- parallax existente conservado;
- adaptación específica para desktop, tablet y celular.

## Publicación

Desde la carpeta `firebase`:

```powershell
firebase deploy --only hosting --project ua-eventos-uy
```

## Prueba

`https://ua-eventos-uy.web.app/coyote-vs-acme?i=UA-DEMO-001&test=1&v=20`
