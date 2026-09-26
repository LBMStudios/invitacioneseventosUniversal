# UA CINEMA EXPERIENCE & FULL-LIFECYCLE TICKETING
### TICKETING, REAL-TIME QR ACCREDITATION & BREVO TRANSACTIONAL ENGINE
`UNIVERSAL ASSISTANCE (A COMPANY OF ZURICH)` · `LBM STUDIOS ARCHIVE 02/06`

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ CASE STUDY: 02/06                                                       │
│ PROJECT:    UA CINEMA EXPERIENCE & TICKETING PLATFORM                   │
│ CLIENT:     UNIVERSAL ASSISTANCE (A COMPANY OF ZURICH)                  │
│ EVENT:      CORPORATE CINEMA PREMIERE — COYOTE VS. ACME                 │
│ ROLE:       CREATIVE TECHNOLOGIST & EVENT SYSTEMS ARCHITECT             │
│ STACK:      FIREBASE · GOOGLE APPS SCRIPT · BREVO ENGINE · REMOTION     │
│ STATUS:     PRODUCTION VERIFIED (FULL IN-SITU ACCESS GOVERNANCE)        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 01 // OVERVIEW & EVENT ARCHITECTURE

A mission-critical event management and guest accreditation platform developed for **Universal Assistance (A company of ZURICH)** for corporate premiere activations (including *Coyote vs. Acme*).

The ecosystem governs the full event lifecycle:
1. **Dynamic Invitation Engine:** Personalized invitations generated dynamically per corporate tier (VIPs, Travel Agencies, Brokers, Internal Stakeholders).
2. **Interactive RSVP Landing:** High-impact responsive digital ticket with real-time capacity counter and dynamic seat locking.
3. **Omnichannel Delivery:** Programmatic transactional email delivery via Brevo with embedded cryptographic QR codes and calendar attachments.
4. **In-Situ Access Control:** Mobile web scanner application validating entrance QR codes in milliseconds with offline-tolerant synchronization and duplicate entry prevention.
5. **Programmatic Video Documentation:** Remotion React video engine generating automated case study visual reels directly from event metadata.

```
[ GUEST REGISTRY ] ──▶ [ BREVO DISPATCH ] ──▶ [ DIGITAL TICKET (RSVP) ]
   (Sheets / DB)         (Unique QR Pass)         (Firebase Web)
                                                        │
                                                        ▼
[ REMOTION REEL ] ◀── [ REAL-TIME METRICS ] ◀── [ QR SCANNER (DOOR) ]
  (Video Engine)          (Live Admin)             (Access Control)
```

---

## 02 // TECHNICAL MATRIX

| Dimension | Specification |
|:---|:---|
| **Frontend Runtime** | Vanilla ES6+ Web Components / Firebase Hosting (`ua-eventos-uy`) |
| **Backend & Registry** | Google Apps Script (Clasp toolchain) + Google Sheets Data Lake |
| **Email Infrastructure** | Brevo REST API v3 (DKIM/SPF aligned transactional delivery) |
| **Access Verification** | HTML5 Camera Stream + ZXing / QR Decoder in web worker |
| **Video Automation** | Remotion (React-based programmatic MP4 rendering) |
| **Security & Privacy** | SHA-hashed guest tokens, zero public PII exposure, push protection |

---

## 03 // CORE SUBSYSTEMS

### 1. Backend & Data Lake (`apps-script/`)
- Generates non-guessable alphanumeric reservation codes (`UA-XXXX`).
- Enforces strict capacity limits per theatre room.
- Synchronizes check-in timestamps with sub-second accuracy to the central ledger.

### 2. Digital Invitation Portal (`firebase/public/index.html`)
- Ultra-fast client-side hydration resolving `?i=UA-TOKEN`.
- Universal Assistance corporate identity (Deep Navy, Zurich Blue, Cyan accents).
- High-contrast responsive typography optimized for mobile devices.

### 3. In-Situ Door Check-in Scanner (`firebase/public/checkin.html`)
- Low-latency camera viewfinder scanning guest QR codes at venue doors.
- Visual & haptic feedback for **Admitted** (Green), **Already Used** (Red Warning), and **Invalid Token**.
- Real-time attendee counter displaying current inside headcount.

### 4. Brevo Transactional Pipeline (`send-brevo.js`)
- Bulk dispatch with automated rate limiting and bounce management.
- Dynamic HTML email templates embedding attendee name, seats assigned, and custom QR asset.

### 5. Programmatic Case Reel (`remotion-case/`)
- Automated video pipeline rendering high-resolution motion graphic reels documenting attendance metrics and corporate sponsor branding.

---

## 04 // REPOSITORY STRUCTURE

```text
├── apps-script/                 # Clasp-managed Google Apps Script server
│   ├── appsscript.json          # Deployment manifest
│   ├── Código.gs                # Server logic & invitation generation
│   └── Admin.html               # Planilla-integrated management modal
├── firebase/                    # Static Web Application (Firebase Hosting)
│   ├── public/
│   │   ├── index.html           # Guest RSVP & personalized digital ticket
│   │   ├── checkin.html         # Camera QR scanner for door staff
│   │   ├── admin.html           # Live head-count monitoring dashboard
│   │   ├── app.js               # RSVP state machine
│   │   ├── checkin.js           # QR scanner worker & validation engine
│   │   └── styles.css           # Brand identity styles & responsive grid
│   └── firebase.json            # Hosting rules & edge headers
├── remotion-case/               # Programmatic video generation engine
├── scripts/                     # Cross-referencing, auditing & Brevo dispatchers
└── docs/                        # QA checklists & operator manuals
```

---

## 05 // DEPLOYMENT PROCEDURES

### Automated Deployment
Execute the deployment runner in the root directory:
```bash
./PUBLICAR_CAMBIOS.bat
```

### Manual Deployment
```bash
# 1. Push Apps Script Backend
cd apps-script
clasp push --force
clasp deploy --description "Production Release"

# 2. Deploy Firebase Frontend
cd ../firebase
firebase deploy --only hosting --project ua-eventos-uy
```

---

```text
© 2026 LBM STUDIOS // LUCAS BEATHYATE MASCHERINI. ALL RIGHTS RESERVED.
DEVELOPED FOR UNIVERSAL ASSISTANCE (A COMPANY OF ZURICH).
```