# 🎬 Universal Assistance · Case Study Video (Remotion)
### Producido por LBM Studios con Remotion

Este proyecto genera de forma programática con código React el **Video Case publicitario** del evento exclusivo de Universal Assistance.

---

## 🚀 Comandos de Uso

Dentro de la carpeta `remotion-case`:

### 1. Previsualizar en Vivo en Remotion Studio
Abre el reproductor interactivo con línea de tiempo, scrubber cuadro a cuadro y selector de composiciones:
```bash
npm start
```
*(Se abrirá automáticamente en tu navegador web en `http://localhost:3000`)*

---

### 2. Renderizar a Video MP4 (16:9 Landscape)
Exporta el video en alta resolución (1920x1080 @ 30fps) listo para YouTube, presentaciones o televisión:
```bash
npm run build
```
*(El archivo final se guardará en `out/case-study.mp4`)*

---

### 3. Renderizar a Video Vertical (9:16 Reels / TikTok)
Exporta el video en formato vertical (1080x1920) optimizado para Instagram Reels, TikTok y YouTube Shorts:
```bash
npm run build:vertical
```
*(El archivo final se guardará en `out/case-study-vertical.mp4`)*

---

## 🎨 Estructura del Proyecto Remotion

```text
remotion-case/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                     # Entry point de Remotion
│   ├── Root.tsx                     # Registro de composiciones (Horizontal y Vertical)
│   ├── constants.ts                 # Tokens cromáticos UA, duraciones y FPS
│   ├── CaseStudyVideo.tsx           # Composición Master 16:9
│   ├── CaseStudyVerticalVideo.tsx   # Composición Vertical 9:16
│   └── components/
│       ├── BrandBackground.tsx      # Fondo dinámico con orbes de luz y rejilla tech
│       ├── IntroSequence.tsx        # Presentación LBM Studios x Universal Assistance
│       ├── ChallengeSequence.tsx    # El problema vs la visión
│       ├── PreviaTechSequence.tsx   # Plataforma, RSVP y e-tickets con QR
│       ├── OnSiteTechSequence.tsx   # Check-in en tiempo real, 0 demoras y sala
│       ├── MediaPRSequence.tsx      # Canal 4 (Informativo Central) + Digital Host
│       ├── MetricsSequence.tsx      # Métricas (+240 asistentes, < 3s, prime time)
│       └── OutroSequence.tsx        # Slogan oficial y créditos de agencia
```
