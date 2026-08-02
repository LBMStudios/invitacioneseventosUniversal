# Universal Assistance · Eventos 2026 (Coyote vs. Acme)

Sistema integral de gestión de eventos: envío de invitaciones personalizadas por mail, landing page interactiva con confirmación de asistencia (RSVP) y aplicación web de control de accesos (Check-in QR en puerta).

---

## 🧩 Módulos del Sistema

### 📩 1. Envío de Invitaciones y Backend (`apps-script/`)
- **Ubicación**: [`apps-script/`](./apps-script/)
- **Descripción**: Módulo servidor alojado en Google Apps Script que conecta con Google Sheets.
- **Archivos clave**:
  - `Código.gs`: Genera los códigos de invitación únicos (`UA-xxx`), procesa las respuestas RSVP, construye y envía los correos electrónicos HTML personalizados con código QR adjunto.
  - `Admin.html`: Interfaz administrativa integrada en la planilla para el envío masivo o probatorio de invitaciones.

### 💌 2. Invitación Digital / Landing Page (`firebase/public/index.html`)
- **Ubicación**: [`firebase/public/index.html`](./firebase/public/index.html)
- **Descripción**: Sitio web interactivo para los invitados.
- **Archivos clave**:
  - `app.js`: Procesa la invitación desde la URL (`?i=UA-DEMO-001`), despliega los datos personalizados del invitado y registra la confirmación de asistencia (RSVP).
  - `styles.css`: Estilos visuales con la identidad corporativa de Universal Assistance (celeste/lila), diseño responsive (mobile, tablet, desktop) y animaciones.

### 📱 3. App Web de Escaneo / Check-in QR (`firebase/public/checkin.html`)
- **Ubicación**: [`firebase/public/checkin.html`](./firebase/public/checkin.html)
- **Descripción**: Aplicación web optimizada para el personal en la entrada del evento.
- **Archivos clave**:
  - `checkin.js` + `qrcode.min.js`: Utiliza la cámara del dispositivo móvil/tablet para escanear el código QR presentado por el invitado, validando el ingreso en tiempo real contra la base de datos de Google Sheets y registrando el horario de acceso.

### 📊 4. Portal Admin Web (`firebase/public/admin.html`)
- **Ubicación**: [`firebase/public/admin.html`](./firebase/public/admin.html)
- **Descripción**: Dashboard de monitoreo web para consultar el listado de asistentes, confirmaciones de asistencia y métricas en tiempo real.

---

## 📐 Estructura del Repositorio

```text
UAInvitacón/
├── apps-script/                   # Backend en Google Apps Script
│   ├── .clasp.json                # Configuración de Clasp para sincronización
│   ├── appsscript.json            # Manifest del proyecto Apps Script
│   ├── Admin.html                 # Panel Admin integrado en GAS
│   └── Código.gs                  # Lógica del backend y servidor de correo
├── firebase/                      # Aplicación Web Frontend (Firebase Hosting)
│   ├── .firebaserc                # Proyecto Firebase vinculado (ua-eventos-uy)
│   ├── firebase.json              # Configuración de Hosting y rutas
│   └── public/                    # Archivos estáticos públicos
│       ├── index.html             # Landing Page / Invitación digital
│       ├── admin.html             # Portal Admin Web
│       ├── checkin.html           # App de Escaneo Check-in QR
│       ├── checkin.js             # Lógica del escáner y validación de QR
│       ├── app.js                 # Lógica interactiva RSVP y parallax
│       ├── styles.css             # Estilos globales y responsive
│       ├── manifest.json          # PWA Manifest
│       └── assets/                # Imágenes y recursos gráficos del evento
├── docs/                          # Documentación del proyecto
│   ├── INSTRUCCIONES_GOOGLE_SHEETS.md # Guía operativa para planilla de invitados
│   ├── CONTROL_DE_CALIDAD.md      # Lista de verificación de QA
│   ├── history/                   # Historial de versiones y notas históricas
│   └── previews/                  # Previsualizaciones e imágenes del sistema
├── data/                          # Ejemplos y datos de prueba (.csv)
├── PUBLICAR_CAMBIOS.bat           # Script automatizado de despliegue (GAS + Firebase)
└── README.md                      # Documentación principal
```

---

## 🚀 Despliegue

### 1. Despliegue Automatizado (Recomendado)
Ejecutar el script `PUBLICAR_CAMBIOS.bat` en la raíz del proyecto. Este script:
1. Sincroniza y despliega el código backend en Google Apps Script mediante `clasp`.
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

## 📚 Documentación Adicional
- 📖 [Instrucciones Google Sheets](./docs/INSTRUCCIONES_GOOGLE_SHEETS.md)
- ✅ [Control de Calidad (QA)](./docs/CONTROL_DE_CALIDAD.md)
