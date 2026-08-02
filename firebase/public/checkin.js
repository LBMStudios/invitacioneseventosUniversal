// ═══════════════════════════════════════════════════════════════════════
// ACREDITACIÓN Y CONTROL DE INGRESO · UNIVERSAL ASSISTANCE CINE 2026
// ═══════════════════════════════════════════════════════════════════════

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

let html5QrCodeInstance = null;
let availableCameras = [];
let currentCameraIndex = 0;
let isTorchOn = false;
let allConfirmedGuests = [];
let guestMapByCode = new Map();
let currentSelectedGuest = null;
let currentFilterTab = 'confirmed'; // Por defecto muestra solo los confirmados
let filterTimeout = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

document.addEventListener('DOMContentLoaded', initCheckin);

function initCheckin() {
  initQrScanner();
  bindEvents();
  loadDoorList();

  // Sincronización automática de puerta cada 10 segundos
  setInterval(loadDoorList, 10000);
}

function bindEvents() {
  $('#btnSearch').addEventListener('click', handleSearch);
  $('#searchInput').addEventListener('input', handleLiveFilterDebounced);
  $('#searchInput').addEventListener('keyup', e => {
    if (e.key === 'Enter') handleSearch();
  });

  $('#btnConfirmIngress').addEventListener('click', confirmIngress);
  if ($('#btnUndoIngress')) $('#btnUndoIngress').addEventListener('click', undoIngress);
  if ($('#btnToggleFlash')) $('#btnToggleFlash').addEventListener('click', toggleFlash);

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

function rebuildGuestMap() {
  guestMapByCode.clear();
  allConfirmedGuests.forEach(g => {
    if (g.code) guestMapByCode.set(g.code.toLowerCase().trim(), g);
  });
}

function handleLiveFilterDebounced() {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(applyCurrentFilters, 150);
}

function applyCurrentFilters() {
  const query = $('#searchInput').value.trim().toLowerCase();
  
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
      g.name.toLowerCase().includes(query) ||
      g.code.toLowerCase().includes(query) ||
      (g.companionName && g.companionName.toLowerCase().includes(query))
    );
  }

  renderGuestList(list);
}

async function initQrScanner() {
  if (typeof Html5Qrcode === 'undefined') return;

  try {
    const cameras = await Html5Qrcode.getCameras();
    if (cameras && cameras.length > 0) {
      availableCameras = cameras;
      const toggleBtn = $('#btnToggleCamera');
      if (toggleBtn && availableCameras.length > 1) {
        toggleBtn.classList.remove('hidden');
        toggleBtn.onclick = switchCamera;
      }
      startCameraWithId(availableCameras[0].id);
    } else {
      startCameraFacingEnvironment();
    }
  } catch (_) {
    startCameraFacingEnvironment();
  }
}

function checkFlashSupport() {
  const flashBtn = $('#btnToggleFlash');
  if (!flashBtn || !html5QrCodeInstance) return;

  try {
    // Verificar si las capacidades del track de video admiten linterna (torch)
    const capabilities = html5QrCodeInstance.getRunningTrackCapabilities?.();
    if (capabilities && capabilities.torch) {
      flashBtn.classList.remove('hidden');
    } else {
      // Mostrar por defecto en móviles
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
  if (!html5QrCodeInstance) return;
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

function startCameraFacingEnvironment() {
  if (html5QrCodeInstance) {
    try { html5QrCodeInstance.stop(); } catch (_) {}
  }
  html5QrCodeInstance = new Html5Qrcode("qr-reader");
  const config = { fps: 15, qrbox: { width: 220, height: 220 } };

  html5QrCodeInstance.start(
    { facingMode: "environment" },
    config,
    onQrCodeSuccess,
    onQrCodeError
  ).then(() => {
    checkFlashSupport();
  }).catch(err => {
    console.warn("Cámara no disponible o denegada:", err);
    $('#qr-reader').innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;font-size:12px;">📷 Cámara inactiva o denegada. Usá la búsqueda manual por código o nombre abajo.</div>';
  });
}

async function startCameraWithId(cameraId) {
  if (html5QrCodeInstance) {
    try { await html5QrCodeInstance.stop(); } catch (_) {}
  }
  html5QrCodeInstance = new Html5Qrcode("qr-reader");
  const config = { fps: 15, qrbox: { width: 220, height: 220 } };

  html5QrCodeInstance.start(
    cameraId,
    config,
    onQrCodeSuccess,
    onQrCodeError
  ).then(() => {
    checkFlashSupport();
  }).catch(err => {
    console.warn("Error al iniciar cámara especificada:", err);
    startCameraFacingEnvironment();
  });
}

async function switchCamera() {
  if (!availableCameras || availableCameras.length <= 1) return;
  currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
  await startCameraWithId(availableCameras[currentCameraIndex].id);
}

function onQrCodeSuccess(decodedText) {
  let code = decodedText.trim();
  
  // Extraer parámetro ?i=UA-XXX de la URL del QR si viene completa
  if (code.includes('?i=')) {
    try {
      const url = new URL(code);
      code = url.searchParams.get('i') || code;
    } catch (_) {
      const match = code.match(/[\?&]i=([^&]+)/);
      if (match) code = match[1];
    }
  }

  $('#searchInput').value = code;
  processCodeValidation(code);
}

function onQrCodeError(errorMessage) {
  // Ignorar errores continuos de búsqueda vacía
}

function handleSearch() {
  const query = $('#searchInput').value.trim();
  if (!query) return;
  processCodeValidation(query);
}

function processCodeValidation(query) {
  const cleanQuery = query.toLowerCase().trim();

  const guest = allConfirmedGuests.find(g =>
    g.code.toLowerCase() === cleanQuery ||
    g.name.toLowerCase() === cleanQuery ||
    g.name.toLowerCase().includes(cleanQuery)
  );

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

async function loadDoorList() {
  try {
    const response = await fetch(`${BACKEND_URL}?action=guestListCheckin&_=${Date.now()}`);
    const data = await response.json();

    if (data && data.ok && Array.isArray(data.guests)) {
      allConfirmedGuests = data.guests;
      rebuildGuestMap();
    } else {
      if (!allConfirmedGuests.length) useFallbackGuests();
    }
  } catch (err) {
    if (!allConfirmedGuests.length) useFallbackGuests();
  }

  updateStats();
  applyCurrentFilters();
}

function useFallbackGuests() {
  allConfirmedGuests = [
    { code: 'UA-001', name: 'Lucas Beathayte', status: 'Confirmado', seats: 2, companionName: 'Acompañante VIP', checkedIn: false },
    { code: 'UA-002', name: 'María Pérez', status: 'Confirmado', seats: 1, companionName: '', checkedIn: false },
    { code: 'UA-003', name: 'Carlos Rodríguez', status: 'Pendiente', seats: 1, companionName: '', checkedIn: false }
  ];
  rebuildGuestMap();
}

function updateStats() {
  const confirmedGuests = allConfirmedGuests.filter(g => isConfirmedStatus_(g.status));
  const totalSeatsConfirmed = confirmedGuests.reduce((acc, g) => acc + (g.seats || 1), 0);
  const checkedInSeats = allConfirmedGuests.filter(g => g.checkedIn).reduce((acc, g) => acc + (g.seats || 1), 0);
  const pendingSeats = Math.max(0, totalSeatsConfirmed - checkedInSeats);

  $('#statTotalConfirmed').textContent = totalSeatsConfirmed;
  $('#statCheckedIn').textContent = checkedInSeats;
  $('#statPending').textContent = pendingSeats;

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
          <div class="guest-item__code">${g.code} &middot; ${g.seats || 1} entrada${(g.seats||1) > 1 ? 's' : ''}</div>
        </div>
        <div>
          <span class="status-tag ${statusClass}">${statusText}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════
// SONIDOS SINTETIZADOS WEB AUDIO API & RETROALIMENTACIÓN HÁPTICA
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
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12);

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
// REGISTRO Y ACREDITACIÓN VIP DIRECTA EN PUERTA
// ═══════════════════════════════════════════════════════════════════════

function openVipModal() {
  $('#vipNameInput').value = '';
  $('#vipCompanionSelect').value = 'no';
  $('#vipCompanionNameInput').value = '';
  $('#vipCompanionNameGroup').classList.add('hidden');
  $('#vipModal').classList.remove('hidden');
}

function closeVipModal() {
  $('#vipModal').classList.add('hidden');
}

function toggleVipCompanionInput() {
  const isYes = $('#vipCompanionSelect').value === 'yes';
  if (isYes) {
    $('#vipCompanionNameGroup').classList.remove('hidden');
  } else {
    $('#vipCompanionNameGroup').classList.add('hidden');
  }
}

async function handleVipSubmit() {
  const name = $('#vipNameInput').value.trim();
  if (!name) {
    alert('Ingresá el nombre completo del invitado VIP.');
    return;
  }

  const bringsCompanion = $('#vipCompanionSelect').value === 'yes';
  const companionName = bringsCompanion ? $('#vipCompanionNameInput').value.trim() : '';
  if (bringsCompanion && !companionName) {
    alert('Ingresá el nombre del acompañante.');
    return;
  }

  const seats = bringsCompanion ? 2 : 1;
  const vipCode = `UA-VIP-${Math.floor(1000 + Math.random() * 9000)}`;
  const nowTimeString = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) + ' hs';

  const newVipGuest = {
    code: vipCode,
    name: name,
    email: '',
    phone: '',
    status: 'Confirmado (VIP)',
    hasCompanion: bringsCompanion,
    companionName: companionName,
    seats: seats,
    checkedIn: true,
    checkinTime: nowTimeString
  };

  allConfirmedGuests.unshift(newVipGuest);
  updateStats();
  applyCurrentFilters();

  const vipUrl = `${BACKEND_URL}?action=addVipDoor&name=${encodeURIComponent(name)}&companionName=${encodeURIComponent(companionName)}&seats=${seats}`;
  fetch(vipUrl, { method: 'POST', mode: 'no-cors' }).catch(_ => {});

  closeVipModal();
  playSuccessSound();
  showGuestResultCard(newVipGuest);
}

function exportGuestListCsv() {
  if (!allConfirmedGuests.length) {
    alert('No hay asistentes cargados para exportar.');
    return;
  }

  const headers = ['Codigo', 'Invitado', 'Estado Respuesta', 'Estado Ingreso', 'Hora Ingreso', 'Entradas', 'Acompanante'];
  const rows = allConfirmedGuests.map(g => [
    `"${g.code || ''}"`,
    `"${g.name || ''}"`,
    `"${g.status || ''}"`,
    `"${g.checkedIn ? 'Ingresó' : 'Por Llegar'}"`,
    `"${g.checkinTime || ''}"`,
    g.seats || 1,
    `"${g.companionName || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `acreditacion_movie_universal_assistance_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
