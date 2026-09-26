# Universal Assistance Â· Eventos 2026 (Coyote vs. Acme)

Sistema integral de gestiÃ³n de eventos: envÃ­o de invitaciones personalizadas por mail, landing page interactiva con confirmaciÃ³n de asistencia (RSVP) y aplicaciÃ³n web de control de accesos (Check-in QR en puerta).

---

## ð§© MÃ³dulos del Sistema

### ð© 1. EnvÃ­o de Invitaciones y Backend (`apps-script/`)
- **UbicaciÃ³n**: [`apps-script/`](./apps-script/)
- **DescripciÃ³n**: MÃ³dulo servidor alojado en Google Apps Script que conecta con Google Sheets.
- **Archivos clave**:
  - `CÃ³digo.gs`: Genera los cÃ³digos de invitaciÃ³n Ãºúnicos (`UA-xxx`), procesa las respuestas RSVP, construye y envÃ­a los correos electrÃ³únicos HTML personalizados con cÃ³digo QR adjunto.
  - `Admin.html`: Interfaz administrativa integrada en la planilla para el envÃ­o masivo o probatorio de invitaciones.

### ð 2. InvitaciÃ³n Digital / Landing Page (`firebase/public/index.html`)
- **UbicaciÃ³n**: [`firebase/public/index.html`](./firebase/public/index.html)
- **DescripciÃ³n**: Sitio web interactivo para los invitados.
- **Archivos clave**:
  - `app.js`: Procesa la invitaciÃ³n desde la URL (`?i=UA-DEMO-001`), despliega los datos personalizados del invitado y registra la confirmaciÃ³n de asistencia (RSVP).
  - `styles.css`: Estilos visuales con la identidad corporativa de Universal Assistance (celeste/lila), diseÃ±o responsive (mobile, tablet, desktop) y animaciones.

### ð± 3. App Web de Escaneo / Check-in QR (`firebase/public/checkin.html`)
- **UbicaciÃ³n**: [`firebase/public/checkin.html`](./firebase/public/checkin.html)
- **DescripciÃ³n**: AplicaciÃ³n web optimizada para el personal en la entrada del evento.
- **Archivos clave**:
  - `checkin.js` + `qrcode.min.js`: Utiliza la cÃ¡mara del dispositivo mÃ³vil/tablet para escanear el cÃ³digo QR presentado por el invitado, validando el ingreso en tiempo real contra la base de datos de Google Sheets y registrando el horario de acceso.

### ð 4. Portal Admin Web (`firebase/public/admin.html`)
- **UbicaciÃ³n**: [`firebase/public/admin.html`](./firebase/public/admin.html)
- **DescripciÃ³n**: Dashboard de monitoreo web para consultar el listado de asistentes, confirmaciones de asistencia y mÃ©tricas en tiempo real.

---

## ð Estructura del Repositorio

```text
UAInvitacÃ³n/
âââ apps-script/                   # Backend en Google Apps Script
â   âââ .clasp.json                # ConfiguraciÃ³n de Clasp para sincronizaciÃ³n
â   âââ appsscript.json            # Manifest del proyecto Apps Script
â   âââ Admin.html                 # Panel Admin integrado en GAS
â   âââ CÃ³digo.gs                  # LÃ³gica del backend y servidor de correo
âââ firebase/                      # AplicaciÃ³n Web Frontend (Firebase Hosting)
â   âââ .firebaserc                # Proyecto Firebase vinculado (ua-eventos-uy)
â   âââ firebase.json              # ConfiguraciÃ³n de Hosting y rutas
â   âââ public/                    # Archivos estÃ¡ticos pÃºblicos
â       âââ index.html             # Landing Page / InvitaciÃ³n digital
â       âââ admin.html             # Portal Admin Web
â       âââ checkin.html           # App de Escaneo Check-in QR
â       âââ checkin.js             # LÃ³gica del escÃ¡ner y validaciÃ³n de QR
â       âââ app.js                 # LÃ³gica interactiva RSVP y parallax
â       âââ styles.css             # Estilos globales y responsive
â       âââ manifest.json          # PWA Manifest
â       âââ assets/                # ImÃ¡genes y recursos grÃ¡ficos del evento
âââ docs/                          # DocumentaciÃ³n del proyecto
â   âââ INSTRUCCIONES_GOOGLE_SHEETS.md # GuÃ­a operativa para planilla de invitados
â   âââ CONTROL_DE_CALIDAD.md      # Lista de verificaciÃ³n de QA
â   âââ history/                   # Historial de versiones y notas histÃ³ricas
â   âââ previews/                  # Previsualizaciones e imÃ¡genes del sistema
âââ data/                          # Ejemplos y datos de prueba (.csv)
âââ PUBLICAR_CAMBIOS.bat           # Script automatizado de despliegue (GAS + Firebase)
âââ README.md                      # DocumentaciÃ³n principal
```

---

## ð Despliegue

### 1. Despliegue Automatizado (Recomendado)
Ejecutar el script `PUBLICAR_CAMBIOS.bat` en la raÃ­z del proyecto. Este script:
1. Sincroniza y despliega el cÃ³digo backend en Google Apps Script mediante `clasp`.
2. Publica los cambios del frontend en Firebase Hosting.

### 2. Despliegue Manual

#### Backend (Apps Script):
```powershell
cd apps-script
clasp push --force
clasp deploy -i "AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba" --description "Publicacion manual"
```

#### Frontend (Firebase Hosting):
```powershell
cd firebase
firebase deploy --only hosting --project ua-eventos-uy
```

---

## ð DocumentaciÃ³n Adicional
- ð [Instrucciones Google Sheets](./docs/INSTRUCCIONES_GOOGLE_SHEETS.md)
- â [Control de Calidad (QA)](./docs/CONTROL_DE_CALIDAD.md)
