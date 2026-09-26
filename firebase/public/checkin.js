// ═══════════════════════════════════════════════════════════════════════
// ACREDITACIÓN Y CONTROL DE INGRESO · UNIVERSAL ASSISTANCE CINE 2026
// VERSIÓN ANDROID & IOS ULTRA-COMPATIBLE
// ═══════════════════════════════════════════════════════════════════════

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

let html5QrCodeInstance = null;
let isScannerRunning = false;
let availableCameras = [];
let currentCameraIndex = 0;
let isTorchOn = false;
let allConfirmedGuests = [];
let guestMapByCode = new Map();
let currentSelectedGuest = null;
let currentFilterTab = 'confirmed'; // Por defecto muestra confirmados
let filterTimeout = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

document.addEventListener('DOMContentLoaded', initCheckin);

function initCheckin() {
  bindEvents();
  loadDoorList();

  // Intentar iniciar escáner con retardo para permitir que el DOM renderice
  setTimeout(() => {
    startQrScanner();
  }, 300);

  // Sincronización multi-dispositivo en tiempo real cada 3.5 segundos
  setInterval(loadDoorList, 3500);
}

function bindEvents() {
  const btnSearch = $('#btnSearch');
  if (btnSearch) btnSearch.addEventListener('click', handleSearch);

  const searchInput = $('#searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleLiveFilterDebounced);
    searchInput.addEventListener('keyup', e => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  const btnConfirmIngress = $('#btnConfirmIngress');
  if (btnConfirmIngress) btnConfirmIngress.addEventListener('click', confirmIngress);

  const btnUndoIngress = $('#btnUndoIngress');
  if (btnUndoIngress) btnUndoIngress.addEventListener('click', undoIngress);

  const btnToggleFlash = $('#btnToggleFlash');
  if (btnToggleFlash) btnToggleFlash.addEventListener('click', toggleFlash);

  const btnStartCamManual = $('#btnStartCamManual');
  if (btnStartCamManual) btnStartCamManual.addEventListener('click', () => startQrScanner(true));

  // Modal VIP y Exportar CSV
  if ($('#btnOpenVipModal')) $('#btnOpenVipModal').addEventListener('click', openVipModal);
  if ($('#btnCloseVipModal')) $('#btnCloseVipModal').addEventListener('click', closeVipModal);
  if ($('#vipCompanionSelect')) $('#vipCompanionSelect').addEventListener('change', toggleVipCompanionInput);
  if ($('#btnSubmitVip')) $('#btnSubmitVip').addEventListener('click', handleVipSubmit);
  if ($('#btnExportCsv')) $('#btnExportCsv').addEventListener('click', exportGuestListCsv);

  // Tabs de filtro
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      const targetBtn = e.target.closest('.tab-btn') || e.target;
      targetBtn.classList.add('active');
      currentFilterTab = targetBtn.dataset.filter;
      applyCurrentFilters();
    });
  });
}

function isConfirmedStatus_(status) {
  if (!status) return false;
  const s = status.toLowerCase().trim();
  return s === 'confirmado' || s.includes('vip') || s === 'sí' || s === 'si';
}

const DEMO_TEST_GUESTS = [
  { code: 'UA-DEMO-001', name: 'Lucas Beathayte (Demo VIP)', status: 'Confirmado', seats: 2, companionName: 'Acompañante VIP', checkedIn: false },
  { code: 'UA-TEST-MUESTRA', name: 'Lucas Beathayte (Pase Muestra)', status: 'Confirmado', seats: 2, companionName: 'Acompañante VIP', checkedIn: false }
];

function rebuildGuestMap() {
  guestMapByCode.clear();
  DEMO_TEST_GUESTS.forEach(g => {
    guestMapByCode.set(g.code.toLowerCase(), g);
  });
  allConfirmedGuests.forEach(g => {
    if (g.code) guestMapByCode.set(g.code.toLowerCase().trim(), g);
  });
}

function handleLiveFilterDebounced() {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(applyCurrentFilters, 100);
}

function applyCurrentFilters() {
  const searchInput = $('#searchInput');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  
  let list = allConfirmedGuests;

  if (currentFilterTab === 'confirmed') {
    list = list.filter(g => isConfirmedStatus_(g.status));
  } else if (currentFilterTab === 'in') {
    list = list.filter(g => g.checkedIn);
  } else if (currentFilterTab === 'pending') {
    list = list.filter(g => isConfirmedStatus_(g.status) && !g.checkedIn);
  } else if (currentFilterTab === 'unconfirmed') {
    list = list.filter(g => !isConfirmedStatus_(g.status) && g.status.toLowerCase() !== 'no asiste');
  }

  if (query) {
    list = list.filter(g =>
      (g.name || '').toLowerCase().includes(query) ||
      (g.code || '').toLowerCase().includes(query) ||
      (g.companionName && g.companionName.toLowerCase().includes(query)) ||
      (g.agency && g.agency.toLowerCase().includes(query))
    );
  }

  renderGuestList(list);
}

// ═══════════════════════════════════════════════════════════════════════
// ESCÁNER DE CÁMARA QR ULTRA-COMPATIBLE CON ANDROID Y IPHONE
// ═══════════════════════════════════════════════════════════════════════

async function startQrScanner(userInitiated = false) {
  const container = document.getElementById('qr-reader');
  const camFallback = document.getElementById('camFallbackBox');
  if (!container || typeof Html5Qrcode === 'undefined') {
    if (camFallback) camFallback.classList.remove('hidden');
    return;
  }

  try {
    if (html5QrCodeInstance && isScannerRunning) {
      await html5QrCodeInstance.stop();
      isScannerRunning = false;
    }
  } catch (_) {}

  html5QrCodeInstance = new Html5Qrcode("qr-reader");

  const qrBoxSize = Math.min(window.innerWidth * 0.7, 240);

  const qrConfig = {
    fps: 15,
    qrbox: { width: qrBoxSize, height: qrBoxSize },
    aspectRatio: 1.0
  };

  // 1. Intentar cámara trasera en modo environment directo
  html5QrCodeInstance.start(
    { facingMode: "environment" },
    qrConfig,
    onQrCodeSuccess,
    onQrCodeError
  ).then(() => {
    isScannerRunning = true;
    if (camFallback) camFallback.classList.add('hidden');
    checkFlashSupport();
    initCameraList();
  }).catch(err => {
    console.warn("Fallo arranque modo environment, intentando lista de dispositivos:", err);
    
    // 2. Intentar buscar por ID de cámaras disponibles
    Html5Qrcode.getCameras().then(cameras => {
      if (cameras && cameras.length > 0) {
        availableCameras = cameras;
        const toggleBtn = $('#btnToggleCamera');
        if (toggleBtn && availableCameras.length > 1) {
          toggleBtn.classList.remove('hidden');
          toggleBtn.onclick = switchCamera;
        }

        let backIndex = cameras.findIndex(c => {
          const lbl = (c.label || '').toLowerCase();
          return lbl.includes('back') || lbl.includes('rear') || lbl.includes('trasera') || lbl.includes('environment');
        });
        if (backIndex === -1 && cameras.length > 1) backIndex = cameras.length - 1;
        currentCameraIndex = backIndex !== -1 ? backIndex : 0;

        return html5QrCodeInstance.start(
          cameras[currentCameraIndex].id,
          qrConfig,
          onQrCodeSuccess,
          onQrCodeError
        ).then(() => {
          isScannerRunning = true;
          if (camFallback) camFallback.classList.add('hidden');
          checkFlashSupport();
        });
      } else {
        throw new Error('No se encontraron cámaras');
      }
    }).catch(errFinal => {
      console.warn("Cámara no disponible o bloqueada por permisos:", errFinal);
      if (camFallback) camFallback.classList.remove('hidden');
    });
  });
}

function initCameraList() {
  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length > 1) {
      availableCameras = cameras;
      const toggleBtn = $('#btnToggleCamera');
      if (toggleBtn) {
        toggleBtn.classList.remove('hidden');
        toggleBtn.onclick = switchCamera;
      }
    }
  }).catch(() => {});
}

async function switchCamera() {
  if (!availableCameras || availableCameras.length <= 1 || !html5QrCodeInstance) return;
  currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
  
  try {
    if (isScannerRunning) {
      await html5QrCodeInstance.stop();
      isScannerRunning = false;
    }
    const qrBoxSize = Math.min(window.innerWidth * 0.7, 240);
    await html5QrCodeInstance.start(
      availableCameras[currentCameraIndex].id,
      { fps: 15, qrbox: { width: qrBoxSize, height: qrBoxSize } },
      onQrCodeSuccess,
      onQrCodeError
    );
    isScannerRunning = true;
    checkFlashSupport();
  } catch (err) {
    console.warn("Error al cambiar de cámara:", err);
  }
}

function checkFlashSupport() {
  const flashBtn = $('#btnToggleFlash');
  if (!flashBtn || !html5QrCodeInstance) return;

  try {
    const capabilities = html5QrCodeInstance.getRunningTrackCapabilities?.();
    if (capabilities && capabilities.torch) {
      flashBtn.classList.remove('hidden');
    } else {
      if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        flashBtn.classList.remove('hidden');
      }
    }
  } catch (_) {
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      flashBtn.classList.remove('hidden');
    }
  }
}

async function toggleFlash() {
  if (!html5QrCodeInstance || !isScannerRunning) return;
  isTorchOn = !isTorchOn;

  try {
    await html5QrCodeInstance.applyVideoConstraints({
      advanced: [{ torch: isTorchOn }]
    });
    const flashBtn = $('#btnToggleFlash');
    if (flashBtn) {
      flashBtn.classList.toggle('active-torch', isTorchOn);
      flashBtn.textContent = isTorchOn ? '⚡ Linterna ON' : '🔦 Flash';
    }
  } catch (err) {
    console.warn('Linterna no compatible en este dispositivo:', err);
    alert('La linterna/flash no está disponible en la cámara activa.');
    isTorchOn = false;
  }
}

function extractCodeFromInput(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';

  if (text.includes('demo=1') || text.toLowerCase() === 'demo') {
    return 'UA-DEMO-001';
  }
  if (text.includes('?i=') || text.includes('&i=')) {
    const match = text.match(/[\?&]i=([^&#]+)/);
    if (match) return decodeURIComponent(match[1]).trim();
  }
  if (text.includes('?code=') || text.includes('&code=')) {
    const match = text.match(/[\?&]code=([^&#]+)/);
    if (match) return decodeURIComponent(match[1]).trim();
  }
  if (text.startsWith('http')) {
    try {
      const u = new URL(text);
      const param = u.searchParams.get('i') || u.searchParams.get('code');
      if (param) return param.trim();
      if (u.searchParams.get('demo') === '1') return 'UA-DEMO-001';
    } catch (_) {}
  }
  const uaMatch = text.match(/UA-[A-Za-z0-9\-_]+/i);
  if (uaMatch) {
    return uaMatch[0].trim();
  }
  return text.replace(/['"\s]/g, '').trim();
}

function onQrCodeSuccess(decodedText) {
  const code = extractCodeFromInput(decodedText);
  const searchInput = $('#searchInput');
  if (searchInput) searchInput.value = code;
  processCodeValidation(code);
}

function onQrCodeError(errorMessage) {
  // Ignorar errores continuos de frame sin QR
}

function handleSearch() {
  const query = $('#searchInput').value.trim();
  if (!query) return;
  const code = extractCodeFromInput(query);
  processCodeValidation(code);
}

function processCodeValidation(query) {
  const extracted = extractCodeFromInput(query);
  const cleanQuery = (extracted || query).toLowerCase().trim();

  let guest = guestMapByCode.get(cleanQuery);
  if (!guest) {
    guest = allConfirmedGuests.find(g =>
      (g.code && g.code.toLowerCase() === cleanQuery) ||
      (g.name && g.name.toLowerCase() === cleanQuery) ||
      (g.name && g.name.toLowerCase().includes(cleanQuery))
    );
  }

  if (guest) {
    if (guest.checkedIn) {
      playWarningSound();
      triggerHapticFeedback([100, 50, 100]);
    } else if (isConfirmedStatus_(guest.status)) {
      playSuccessSound();
      triggerHapticFeedback([120]);
    } else {
      playWarningSound();
      triggerHapticFeedback([200]);
    }
    showGuestResultCard(guest);
  } else {
    playErrorSound();
    triggerHapticFeedback([300]);
    showInvalidCard(`No se encontró invitación para "${query}".`);
  }
}

function showGuestResultCard(guest) {
  currentSelectedGuest = guest;
  const card = $('#resultCard');
  const badge = $('#resultBadge');
  const nameNode = $('#resultGuestName');
  const seatsNode = $('#resultSeats');
  const detailsNode = $('#resultDetails');
  const btnBtn = $('#btnConfirmIngress');
  const undoBtn = $('#btnUndoIngress');

  card.classList.remove('hidden');
  btnBtn.classList.remove('hidden');
  nameNode.textContent = guest.name;

  const seats = guest.seats || 1;
  seatsNode.textContent = `Acceso para ${seats} persona${seats > 1 ? 's' : ''}`;

  let compText = guest.companionName ? `Acompañante: <strong>${guest.companionName}</strong>` : 'Individual (Sin acompañante)';
  detailsNode.innerHTML = `Código: <strong>${guest.code}</strong> &nbsp;|&nbsp; ${compText}`;

  if (guest.checkedIn) {
    const timeInfo = guest.checkinTime ? ` (${guest.checkinTime})` : '';
    badge.className = 'result-badge result-badge--used';
    badge.textContent = `⚠️ YA INGRESÓ A SALA${timeInfo}`;
    btnBtn.textContent = '✔ RE-CONFIRMAR INGRESO';
    btnBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    if (undoBtn) undoBtn.classList.remove('hidden');
  } else if (isConfirmedStatus_(guest.status)) {
    badge.className = 'result-badge result-badge--valid';
    badge.textContent = '✅ ACCESO VÁLIDO (CONFIRMADO)';
    btnBtn.textContent = '✅ CONFIRMAR INGRESO A SALA';
    btnBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    if (undoBtn) undoBtn.classList.add('hidden');
  } else if (guest.status.toLowerCase() === 'no asiste') {
    badge.className = 'result-badge result-badge--invalid';
    badge.textContent = '❌ EL INVITADO DECLINÓ ASISTENCIA';
    btnBtn.textContent = '⚠️ INGRESAR DE TODAS FORMAS (EXCEPCIÓN)';
    btnBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    if (undoBtn) undoBtn.classList.add('hidden');
  } else {
    badge.className = 'result-badge result-badge--used';
    badge.textContent = '⚠️ INVITACIÓN SIN CONFIRMAR (PENDIENTE)';
    btnBtn.textContent = '⚠️ CONFIRMAR E INGRESAR A SALA';
    btnBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    if (undoBtn) undoBtn.classList.add('hidden');
  }

  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showInvalidCard(message) {
  currentSelectedGuest = null;
  const card = $('#resultCard');
  const badge = $('#resultBadge');
  const nameNode = $('#resultGuestName');
  const seatsNode = $('#resultSeats');
  const detailsNode = $('#resultDetails');
  const btnBtn = $('#btnConfirmIngress');
  const undoBtn = $('#btnUndoIngress');

  card.classList.remove('hidden');
  badge.className = 'result-badge result-badge--invalid';
  badge.textContent = '❌ ENTRADA NO ENCONTRADA';
  nameNode.textContent = 'No Registrado';
  seatsNode.textContent = '';
  detailsNode.textContent = message;
  btnBtn.classList.add('hidden');
  if (undoBtn) undoBtn.classList.add('hidden');
}

async function confirmIngress() {
  if (!currentSelectedGuest) return;

  const btn = $('#btnConfirmIngress');
  btn.disabled = true;
  btn.textContent = 'Guardando en Google Sheets…';

  const guestCode = currentSelectedGuest.code;

  try {
    const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';
    currentSelectedGuest.checkedIn = true;
    currentSelectedGuest.checkinTime = nowTimeString;
    currentSelectedGuest.status = 'Confirmado';

    updateStats();
    applyCurrentFilters();

    // Guardar en Google Sheets vía Apps Script
    const markUrl = `${BACKEND_URL}?action=markIngress&code=${encodeURIComponent(guestCode)}`;
    fetch(markUrl, { method: 'POST', mode: 'no-cors' }).catch(err => console.warn('POST markIngress background:', err));

    playSuccessSound();
    triggerHapticFeedback([100, 50, 100]);
    showGuestResultCard(currentSelectedGuest);

  } catch (err) {
    alert('No se pudo guardar el registro: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

async function undoIngress() {
  if (!currentSelectedGuest) return;

  if (!confirm(`¿Deshacer el ingreso de ${currentSelectedGuest.name}? El estado volverá a "Por Llegar".`)) return;

  currentSelectedGuest.checkedIn = false;
  currentSelectedGuest.checkinTime = '';

  updateStats();
  applyCurrentFilters();

  const undoUrl = `${BACKEND_URL}?action=undoIngress&code=${encodeURIComponent(currentSelectedGuest.code)}`;
  fetch(undoUrl, { method: 'POST', mode: 'no-cors' }).catch(_ => {});

  playWarningSound();
  showGuestResultCard(currentSelectedGuest);
}

function fetchDoorListJsonp() {
  return new Promise((resolve, reject) => {
    const callbackName = `uaCheckinListCb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement('script');
    let finished = false;

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        delete window[callbackName];
        script.remove();
        reject(new Error('Timeout checkin list'));
      }
    }, 6000);

    window[callbackName] = payload => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
        resolve(payload);
      }
    };

    const url = new URL(BACKEND_URL);
    url.searchParams.set('action', 'guestListCheckin');
    url.searchParams.set('callback', callbackName);
    url.searchParams.set('_', Date.now().toString());
    script.src = url.toString();
    script.onerror = () => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
        reject(new Error('Error de red al cargar lista'));
      }
    };
    document.body.appendChild(script);
  });
}

async function loadDoorList() {
  // 1. Cargar instantáneamente de memoria local si existe
  const localCache = localStorage.getItem('ua_checkin_door_list');
  if (localCache && !allConfirmedGuests.length) {
    try {
      const parsed = JSON.parse(localCache);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allConfirmedGuests = parsed;
        rebuildGuestMap();
        updateStats();
        applyCurrentFilters();
      }
    } catch (_) {}
  }

  // 2. Intentar obtener la lista actualizada del servidor vía JSONP (sin bloqueo de CORS)
  try {
    const data = await fetchDoorListJsonp();
    if (data && data.ok && Array.isArray(data.guests) && data.guests.length > 0) {
      allConfirmedGuests = data.guests;
      rebuildGuestMap();
      try {
        localStorage.setItem('ua_checkin_door_list', JSON.stringify(data.guests));
      } catch (_) {}
    }
  } catch (err) {
    // Fallback: intentar fetch directo
    try {
      const response = await fetch(`${BACKEND_URL}?action=guestListCheckin&_=${Date.now()}`);
      const data = await response.json();
      if (data && data.ok && Array.isArray(data.guests)) {
        allConfirmedGuests = data.guests;
        rebuildGuestMap();
        try {
          localStorage.setItem('ua_checkin_door_list', JSON.stringify(data.guests));
        } catch (_) {}
      }
    } catch (_) {
      if (!allConfirmedGuests.length) loadEmbeddedFallbackGuests();
    }
  }

  updateStats();
  applyCurrentFilters();
}

function loadEmbeddedFallbackGuests() {
  // Fallback si no hay conexión
  try {
    const raw = localStorage.getItem('ua_checkin_door_list');
    if (raw) {
      allConfirmedGuests = JSON.parse(raw);
      rebuildGuestMap();
    }
  } catch (_) {}
}

function updateStats() {
  const confirmedGuests = allConfirmedGuests.filter(g => isConfirmedStatus_(g.status));
  const totalSeatsConfirmed = confirmedGuests.reduce((acc, g) => acc + (g.seats || 1), 0);
  const checkedInSeats = allConfirmedGuests.filter(g => g.checkedIn).reduce((acc, g) => acc + (g.seats || 1), 0);
  const pendingSeats = Math.max(0, totalSeatsConfirmed - checkedInSeats);

  const elTot = $('#statTotalConfirmed');
  const elIn = $('#statCheckedIn');
  const elPend = $('#statPending');

  if (elTot) elTot.textContent = totalSeatsConfirmed;
  if (elIn) elIn.textContent = checkedInSeats;
  if (elPend) elPend.textContent = pendingSeats;

  // Actualizar badges numéricos en los botones de pestaña
  const cntConfirmed = confirmedGuests.length;
  const cntIn = allConfirmedGuests.filter(g => g.checkedIn).length;
  const cntPending = allConfirmedGuests.filter(g => isConfirmedStatus_(g.status) && !g.checkedIn).length;
  const cntUnconfirmed = allConfirmedGuests.filter(g => !isConfirmedStatus_(g.status) && g.status.toLowerCase() !== 'no asiste').length;
  const cntAll = allConfirmedGuests.length;

  if ($('#badgeConfirmed')) $('#badgeConfirmed').textContent = cntConfirmed;
  if ($('#badgeIn')) $('#badgeIn').textContent = cntIn;
  if ($('#badgePending')) $('#badgePending').textContent = cntPending;
  if ($('#badgeUnconfirmed')) $('#badgeUnconfirmed').textContent = cntUnconfirmed;
  if ($('#badgeAll')) $('#badgeAll').textContent = cntAll;
}

function renderGuestList(guests) {
  const container = $('#guestListContainer');
  if (!container) return;

  if (!guests.length) {
    container.innerHTML = '<div style="font-size:12px;color:#94a3b8;text-align:center;padding:16px;">No se encontraron registros en este filtro.</div>';
    return;
  }

  container.innerHTML = guests.map(g => {
    let statusClass = 'status-tag--wait';
    let statusText = 'Por Llegar';

    if (g.checkedIn) {
      statusClass = 'status-tag--in';
      statusText = `En Sala ${g.checkinTime ? `(${g.checkinTime})` : ''}`;
    } else if (g.status.toLowerCase() === 'pendiente') {
      statusClass = 'status-tag--wait';
      statusText = 'Pendiente';
    } else if (g.status.toLowerCase() === 'no asiste') {
      statusClass = 'status-tag--declined';
      statusText = 'No Asiste';
    }

    return `
      <div class="guest-item" onclick="processCodeValidation('${g.code}')" style="cursor:pointer;">
        <div>
          <div class="guest-item__name">${g.name} ${g.companionName ? `<span style="font-size:11px;color:var(--cyan);">(+1: ${g.companionName})</span>` : ''}</div>
          <div class="guest-item__code">${g.code} &middot; ${g.seats || 1} entrada${(g.seats||1) > 1 ? 's' : ''} ${g.agency ? `&middot; ${g.agency}` : ''}</div>
        </div>
        <div>
          <span class="status-tag ${statusClass}">${statusText}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════
// SONIDOS Y RETROALIMENTACIÓN HÁPTICA
// ═══════════════════════════════════════════════════════════════════════

function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {}
}

function playWarningSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {}
}

function playErrorSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(330, ctx.currentTime);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
}

function triggerHapticFeedback(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (_) {}
  }
}

// ═══════════════════════════════════════════════════════════════════════
// REGISTRO DE INVITADOS VIP / FUERA DE LISTA EN PUERTA
// ═══════════════════════════════════════════════════════════════════════

function openVipModal() {
  $('#vipModal').classList.remove('hidden');
  $('#vipNameInput').value = '';
  $('#vipCompanionSelect').value = 'no';
  $('#vipCompanionNameInput').value = '';
  $('#vipCompanionNameGroup').classList.add('hidden');
  $('#vipNameInput').focus();
}

function closeVipModal() {
  $('#vipModal').classList.add('hidden');
}

function toggleVipCompanionInput(e) {
  const isYes = e.target.value === 'yes';
  $('#vipCompanionNameGroup').classList.toggle('hidden', !isYes);
}

async function handleVipSubmit() {
  const name = $('#vipNameInput').value.trim();
  if (!name) {
    alert('Por favor ingresá el nombre del invitado.');
    return;
  }

  const hasCompanion = $('#vipCompanionSelect').value === 'yes';
  const companionName = hasCompanion ? $('#vipCompanionNameInput').value.trim() : '';
  const totalSeats = hasCompanion ? 2 : 1;

  const btn = $('#btnSubmitVip');
  btn.disabled = true;
  btn.textContent = 'Acreditando en puerta…';

  try {
    const vipCode = 'UA-VIP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const nowTime = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

    const newGuest = {
      code: vipCode,
      name: `${name} (VIP Puerta)`,
      status: 'Confirmado',
      seats: totalSeats,
      companionName: companionName,
      checkedIn: true,
      checkinTime: nowTime,
      agency: 'Invitado Especial'
    };

    allConfirmedGuests.unshift(newGuest);
    rebuildGuestMap();
    updateStats();
    applyCurrentFilters();

    // Guardar en Google Sheets en segundo plano
    const addUrl = `${BACKEND_URL}?action=addVipDoor&name=${encodeURIComponent(name)}&seats=${totalSeats}&companion=${encodeURIComponent(companionName)}&code=${vipCode}`;
    fetch(addUrl, { method: 'POST', mode: 'no-cors' }).catch(_ => {});

    closeVipModal();
    playSuccessSound();
    triggerHapticFeedback([100, 100, 100]);
    showGuestResultCard(newGuest);

  } catch (err) {
    alert('Error al registrar VIP: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'REGISTRAR E INGRESAR A SALA';
  }
}

function exportGuestListCsv() {
  const csvRows = [
    ['Codigo', 'Nombre', 'Agencia', 'Estado', 'Butacas', 'Acompanante', 'Ingreso_Sala', 'Hora_Ingreso']
  ];

  allConfirmedGuests.forEach(g => {
    csvRows.push([
      `"${g.code || ''}"`,
      `"${(g.name || '').replace(/"/g, '""')}"`,
      `"${(g.agency || '').replace(/"/g, '""')}"`,
      `"${g.status || ''}"`,
      g.seats || 1,
      `"${(g.companionName || '').replace(/"/g, '""')}"`,
      g.checkedIn ? 'SI' : 'NO',
      `"${g.checkinTime || ''}"`
    ]);
  });

  const csvContent = '\uFEFF' + csvRows.map(r => r.join(';')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Acreditacion_Coyote_vs_Acme_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
