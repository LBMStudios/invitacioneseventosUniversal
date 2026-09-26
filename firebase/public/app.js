const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const state = {
  guest: null,
  event: {
    name: 'Función especial Coyote vs. Acme',
    brand: 'Universal Assistance',
    date: '27/08/2026',
    time: '20:00',
    arrivalTime: '19:30',
    venue: 'Movie Montevideo Shopping',
    mapsUrl: 'https://maps.google.com/?q=Movie+Montevideo+Shopping',
    intro: 'Queremos compartir contigo una función especial.',
    confirmationMessage: 'Tu asistencia quedó registrada.',
    rsvpDeadline: 'Cupos Limitados'
  },
  code: new URLSearchParams(location.search).get('i') || '',
  submitting: false,
  testMode: new URLSearchParams(location.search).get('test') === '1'
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

document.addEventListener('DOMContentLoaded', init);

function init() {
  try { bindEvents(); } catch (_) {}
  try { initPlaneAnimation(); } catch (_) {}
  try { initParallaxAnimation(); } catch (_) {}
  try { initRevealAnimations(); } catch (_) {}
  try { initCountdown(); } catch (_) {}

  const params = new URLSearchParams(location.search);

  // Si no viene código en la URL, asignar por defecto UA-DEMO-001 para que la invitación siempre cargue
  if (!state.code) {
    state.code = 'UA-DEMO-001';
  }

  if (params.get('demo') === '1' || state.code === 'UA-DEMO-001' || state.code === 'UA-TEST-MUESTRA') {
    state.guest = {
      code: 'UA-DEMO-001',
      name: 'Lucas Beathyate',
      email: 'lucasb@ua.com.uy',
      phone: '099 123 456',
      status: 'Confirmado',
      hasCompanion: true,
      companionName: 'Acompañante VIP',
      totalSeats: 2,
      maxSeats: 2,
      responseDate: '26/08/2026 15:00:00'
    };
    state.event = {
      name: 'Función especial Coyote vs. Acme',
      brand: 'Universal Assistance',
      date: '27/08/2026',
      time: '20:00',
      arrivalTime: '19:30',
      venue: 'Movie Montevideo Shopping',
      mapsUrl: 'https://maps.google.com/?q=Movie+Montevideo+Shopping',
      intro: 'Queremos compartir contigo una función especial.',
      confirmationMessage: 'Tu asistencia quedó registrada.'
    };
    renderInvitation();
    return;
  }

  loadGuest(state.code);
}

function bindEvents() {
  $('#btnToggleEdit')?.addEventListener('click', toggleEditMode);
  $('#optionSingle')?.addEventListener('click', () => selectTicketOption('single'));
  $('#optionPair')?.addEventListener('click', () => selectTicketOption('pair'));
  $('#btnDecline')?.addEventListener('click', declineRsvp);
  $('#rsvpForm')?.addEventListener('submit', submitRsvp);
  $('#calendarButton')?.addEventListener('click', downloadCalendarFile);
  $('#downloadPassButton')?.addEventListener('click', downloadVipPass);
  $('#mapsButton')?.addEventListener('click', openMapsModal);
  $('#btnCloseMapsModal')?.addEventListener('click', closeMapsModal);
  $('#btnEditConfirmation')?.addEventListener('click', openEditForm);
  $('#waitlistForm')?.addEventListener('submit', submitWaitlist);
}

function openEditForm() {
  if (state.guest?.status === 'Expirado' || state.guest?.status === 'Bloqueado' || state.guest?.status === 'Cupos Agotados') return;
  $('#alreadyAnswered')?.classList.add('hidden');
  $('#confirmar')?.classList.remove('hidden');
  toggleCtas(true);

  const guest = state.guest;
  if (guest) {
    if ($('#formGuestName') && guest.name) $('#formGuestName').value = guest.name;
    if ($('#formEmail') && guest.email) $('#formEmail').value = guest.email;
    if ($('#formPhone') && guest.phone && guest.phone !== '099 123 456') $('#formPhone').value = guest.phone;

    const maxSeats = guest.maxSeats || guest.totalSeats || 2;
    if (maxSeats >= 2 || guest.hasCompanion || guest.totalSeats >= 2) {
      selectTicketOption('pair');
      // Preservar exactamente todos los nombres existentes de acompañantes
      const existingCompanions = (guest.companionName || '').split(' | ').map(n => n.trim()).filter(Boolean);
      existingCompanions.forEach((name, i) => {
        const input = $(`#formCompanionName_${i}`);
        if (input) input.value = name;
      });
      // Focus en el primer campo de acompañante vacío si existe
      const emptyInput = $('#companionFieldsList')?.querySelector('input:not([value]), input[value=""]');
      if (emptyInput) emptyInput.focus();
    } else {
      selectTicketOption('single');
    }
  }

  showFormMessage('✏️ Podés modificar o agregar acompañantes y guardar los cambios.', false);
  const confirmSection = $('#confirmar');
  if (confirmSection) {
    confirmSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function openMapsModal() {
  const modal = $('#mapsModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function closeMapsModal() {
  const modal = $('#mapsModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.style.display = '';
}

function selectTicketOption(type) {
  const isPair = type === 'pair';
  $('#optionSingle')?.classList.toggle('active', !isPair);
  $('#optionPair')?.classList.toggle('active', isPair);
  const singleRadio = $('input[name="attendanceType"][value="single"]');
  const pairRadio = $('input[name="attendanceType"][value="pair"]');
  if (singleRadio) singleRadio.checked = !isPair;
  if (pairRadio) pairRadio.checked = isPair;
  $('#companionFieldsGroup')?.classList.toggle('hidden', !isPair);

  // Generar campos de acompañantes dinámicamente
  if (isPair) {
    const maxSeats = state.guest?.maxSeats || state.guest?.totalSeats || 2;
    const numCompanions = Math.max(maxSeats - 1, 1);
    const container = $('#companionFieldsList');
    if (container && container.children.length !== numCompanions) {
      container.innerHTML = '';
      for (let i = 0; i < numCompanions; i++) {
        const label = document.createElement('label');
        label.className = 'field';
        const span = document.createElement('span');
        span.textContent = numCompanions === 1
          ? 'Nombre y Apellido del Acompañante (*)'
          : `Nombre y Apellido — Acompañante ${i + 1} (*)`;
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `formCompanionName_${i}`;
        input.name = `companionName_${i}`;
        input.autocomplete = 'name';
        input.placeholder = `Ej. ${['María López', 'Juan Pérez', 'Ana García', 'Carlos Ruiz'][i] || 'Nombre Apellido'}`;
        label.appendChild(span);
        label.appendChild(input);
        container.appendChild(label);
      }
    }
    // Focus en el primer campo vacío
    const firstEmpty = container?.querySelector('input:not([value])');
    if (firstEmpty) firstEmpty.focus();
  }
  clearFormMessage();
}

function toggleEditMode() {
  const btn = $('#btnToggleEdit');
  const inputs = [$('#formGuestName'), $('#formEmail'), $('#formPhone')];
  const isEditing = btn?.dataset.editing === '1';

  if (isEditing) {
    btn.dataset.editing = '0';
    btn.textContent = '✏️ Editar mis datos';
    inputs.forEach(i => { if (i) i.disabled = true; });
  } else {
    btn.dataset.editing = '1';
    btn.textContent = '🔒 Listo';
    inputs.forEach(i => { if (i) i.disabled = false; });
    $('#formGuestName')?.focus();
  }
}

function initPlaneAnimation() {
  const plane = $('#planeDecor');
  if (!plane || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  const draw = () => {
    ticking = false;
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
    const availableX = Math.max(Math.min(window.innerWidth * .74, 890), 220);
    const x = progress * availableX;
    const y = Math.sin(progress * Math.PI * 1.18) * -54 + progress * 72;
    const rotate = -11 + progress * 24;
    plane.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`;
  };

  const requestDraw = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(draw);
  };

  draw();
  window.addEventListener('scroll', requestDraw, { passive: true });
  window.addEventListener('resize', requestDraw);
}

function initParallaxAnimation() {
  const parallaxNodes = [...document.querySelectorAll('[data-parallax]')];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  const draw = () => {
    ticking = false;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;

    parallaxNodes.forEach(node => {
      const speed = Number(node.dataset.parallax || 0);
      node.style.transform = `translate3d(0, ${scrollTop * speed}px, 0)`;
    });
  };

  const requestDraw = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(draw);
  };

  draw();
  window.addEventListener('scroll', requestDraw, { passive: true });
  window.addEventListener('resize', requestDraw);
}

function initRevealAnimations() {
  const nodes = [...document.querySelectorAll('[data-reveal]')];
  if (!nodes.length) return;

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nodes.forEach(node => node.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -36px' });

  nodes.forEach(node => observer.observe(node));
}

function initCountdown() {
  const daysEl  = $('#countDays');
  const hoursEl = $('#countHours');
  const minsEl  = $('#countMins');
  const secsEl  = $('#countSecs');

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  function parseTargetDate() {
    let year = 2026, month = 7, day = 27, hours = 20, minutes = 0;
    if (state.event?.date) {
      const parts = state.event.date.split(/[\/\.-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        } else {
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          year = parseInt(parts[2], 10);
        }
      }
    }
    if (state.event?.time) {
      const tParts = state.event.time.split(':');
      if (tParts.length >= 2) {
        hours = parseInt(tParts[0], 10);
        minutes = parseInt(tParts[1], 10);
      }
    }
    return new Date(year, month, day, hours, minutes, 0).getTime();
  }

  function update() {
    const target = parseTargetDate();
    const now = Date.now();
    const diff = Math.max(0, target - now);

    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs  = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent  = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minsEl.textContent  = String(mins).padStart(2, '0');
    secsEl.textContent  = String(secs).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}



async function loadGuest(code) {
  const cleanCode = (code || '').toUpperCase().trim();
  
  // 1. Carga Instantánea desde Caché Local (0 ms)
  const cached = localStorage.getItem('ua_guest_cache_' + cleanCode);
  let renderedFromCache = false;
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.guest) {
        state.guest = parsed.guest;
        if (parsed.event) state.event = { ...state.event, ...parsed.event };
        renderInvitation();
        renderedFromCache = true;
      }
    } catch (_) {}
  }

  // 2. Si no había caché, mostrar spinner de carga
  if (!renderedFromCache) {
    const loadingEl = $('#loadingState');
    if (loadingEl) {
      loadingEl.style.display = 'flex';
      loadingEl.classList.remove('hidden');
    }
  }

  // 3. Obtener datos frescos del servidor en paralelo (Revalidación silenciosa)
  try {
    const payload = await getGuestData(cleanCode);
    if (payload && payload.ok && payload.guest) {
      state.guest = payload.guest;
      if (payload.event) {
        state.event = { ...state.event, ...payload.event };
      }
      try {
        localStorage.setItem('ua_guest_cache_' + cleanCode, JSON.stringify(payload));
      } catch (_) {}
      renderInvitation();
    } else if (!renderedFromCache) {
      showError(payload?.error || 'No pudimos encontrar esta invitación.');
    }
  } catch (err) {
    console.error('Error al cargar invitado:', err);
    if (!renderedFromCache) {
      state.guest = state.guest || {
        code: cleanCode,
        name: '',
        email: '',
        phone: '',
        status: 'Confirmado',
        totalSeats: 2,
        maxSeats: 2
      };
      renderInvitation();
    }
  }
}

function getGuestData(code) {
  return new Promise((resolve, reject) => {
    const callbackName = `uaGuestCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement('script');
    let finished = false;

    const timeout = setTimeout(() => finish(() => reject(new Error('No pudimos conectar con la lista de invitados.'))), 4000);

    window[callbackName] = payload => finish(() => {
      if (!payload || !payload.ok) {
        reject(new Error(payload?.error || 'No encontramos esta invitación.'));
        return;
      }
      resolve(payload);
    });

    function finish(action) {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
      action();
    }

    const url = new URL(BACKEND_URL);
    url.searchParams.set('action', 'guest');
    url.searchParams.set('code', code);
    url.searchParams.set('callback', callbackName);
    url.searchParams.set('_', Date.now().toString());
    script.src = url.toString();
    script.onerror = () => finish(() => reject(new Error('No pudimos cargar la invitación.')));
    document.body.appendChild(script);
  });
}

function updateFieldBadge(input) {
  if (!input) return;
  const val = input.value.trim();

  if (val && val !== '099 123 456') {
    input.classList.remove('input-ejemplo');
    input.classList.add('input-precargado');
  } else {
    input.classList.remove('input-precargado');
    input.classList.add('input-ejemplo');
  }
}

function renderInvitation() {
  const { guest, event } = state;

  const loadingEl = $('#loadingState');
  if (loadingEl) {
    loadingEl.style.display = 'none';
    loadingEl.classList.add('hidden');
  }

  $('#errorState')?.classList.add('hidden');
  $('#invitation')?.classList.remove('hidden');

  const rawName = guest ? guest.name : '';
  const fName = firstName(rawName);
  const isGeneric = !fName;
  
  if ($('#guestGreeting')) {
    $('#guestGreeting').textContent = isGeneric
      ? 'Tenemos una invitación especial para vos'
      : `¡Hola ${fName}! Tenemos una invitación para vos`;
  }
  
  if ($('#rsvpGreetingTitle')) {
    $('#rsvpGreetingTitle').textContent = isGeneric
      ? 'Confirmá tu asistencia'
      : `¡Hola, ${fName}!`;
  }
  if ($('#introText')) $('#introText').textContent = event.intro;
  if ($('#eventDate')) $('#eventDate').textContent = formatEventDate(event.date);
  if ($('#eventTime')) $('#eventTime').textContent = `${event.time} hs`;
  if ($('#eventVenue')) $('#eventVenue').textContent = event.venue;
  if ($('#ticketName')) $('#ticketName').textContent = guest.name;
  if ($('#ticketCode')) $('#ticketCode').textContent = guest.code;
  if ($('#formCode')) $('#formCode').value = guest.code;
  if ($('#arrivalTime')) $('#arrivalTime').textContent = `${event.arrivalTime} hs`;
  if ($('#rsvpDeadline') && event.rsvpDeadline) $('#rsvpDeadline').textContent = event.rsvpDeadline;
  
  $('#calendarButton')?.classList.remove('hidden');
  $('#mapsButton')?.classList.remove('hidden');
  
  const maxSeats = guest.maxSeats || guest.totalSeats || 0;
  const seatsNum = maxSeats > 0 ? maxSeats : (guest.hasCompanion ? 2 : 2);
  const seatsText = seatsNum === 1 ? '1 Entrada' : `${seatsNum} Entradas`;
  if ($('#ticketSeats')) $('#ticketSeats').textContent = seatsText;
  if ($('.access-pill')) $('.access-pill').textContent = seatsText;

  // Actualizar texto del resumen según cantidad de entradas
  if ($('#summarySeatsTitle')) {
    $('#summarySeatsTitle').textContent = seatsNum > 2
      ? `Invitación para ${seatsNum} personas`
      : seatsNum === 2 ? 'Opción con Acompañante' : 'Entrada Individual';
  }
  if ($('#summarySeatsText')) {
    if (seatsNum > 2) {
      $('#summarySeatsText').textContent = `Podés confirmar para 1 a ${seatsNum} personas.`;
    } else if (seatsNum === 2) {
      $('#summarySeatsText').textContent = 'Podés confirmar para 1 o 2 personas.';
    } else {
      $('#summarySeatsText').textContent = 'Entrada individual reservada.';
    }
  }

  const guestCode = guest ? guest.code : 'UA-DEMO-001';
  const qrTarget = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${guestCode}`;
  let qrUrl = '';
  if (typeof QRCode !== 'undefined' && QRCode.generateDataUrl) {
    qrUrl = QRCode.generateDataUrl(qrTarget, 600, '#0f172a', '#ffffff');
  } else {
    qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrTarget)}&color=0f172a&bgcolor=ffffff`;
  }
  if ($('#ticketQrImage')) $('#ticketQrImage').src = qrUrl;
  if ($('#successQrImage')) $('#successQrImage').src = qrUrl;
  if ($('#successQrCode')) $('#successQrCode').textContent = guestCode;

  const isRealName = guest.name && !guest.name.toLowerCase().includes('invitado');
  const isRealEmail = guest.email && guest.email.includes('@') && !guest.email.includes('ejemplo');
  const isRealPhone = guest.phone && guest.phone !== '099 123 456' && guest.phone.length > 5;

  const nameInput = $('#formGuestName');
  const emailInput = $('#formEmail');
  const phoneInput = $('#formPhone');

  if (nameInput) {
    nameInput.value = isRealName ? guest.name : '';
    nameInput.placeholder = 'Nombre y Apellido';
    nameInput.disabled = false;
    updateFieldBadge(nameInput);
  }
  if (emailInput) {
    emailInput.value = isRealEmail ? guest.email : '';
    emailInput.placeholder = 'ejemplo@correo.com';
    emailInput.disabled = false;
    updateFieldBadge(emailInput);
  }
  if (phoneInput) {
    phoneInput.value = isRealPhone ? guest.phone : '';
    phoneInput.placeholder = '099 123 456';
    phoneInput.disabled = false;
    updateFieldBadge(phoneInput);
  }

  // Escuchar cambios de tipeo en vivo para actualizar el estilo inmediatamente
  [nameInput, emailInput, phoneInput].forEach(inp => {
    if (!inp || inp.dataset.bound) return;
    inp.dataset.bound = '1';
    inp.addEventListener('input', () => {
      updateFieldBadge(inp);
    });
    inp.addEventListener('focus', () => {
      if (inp.value) inp.select();
    });
  });

  const editBtn = $('#btnToggleEdit');
  if (editBtn) {
    editBtn.onclick = () => {
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    };
  }

  // Pre-llenar campos de acompañantes existentes
  const existingCompanions = (guest.companionName || '').split(' | ').map(n => n.trim()).filter(Boolean);

  // Actualizar label de opción "pair" según cantidad real de entradas
  const pairLabel = $('#optionPair');
  if (pairLabel && maxSeats > 2) {
    const strongEl = pairLabel.querySelector('strong');
    const smallEl = pairLabel.querySelector('small');
    if (strongEl) strongEl.textContent = `Con Acompañantes`;
    if (smallEl) smallEl.textContent = `${maxSeats} Entradas en Sala`;
  } else if (pairLabel && maxSeats === 2) {
    const strongEl = pairLabel.querySelector('strong');
    const smallEl = pairLabel.querySelector('small');
    if (strongEl) strongEl.textContent = 'Con Acompañante';
    if (smallEl) smallEl.textContent = '2 Entradas en Sala';
  }

  if (maxSeats >= 2 || guest.hasCompanion || guest.totalSeats >= 2) {
    selectTicketOption('pair');
    // Pre-llenar con nombres existentes
    if (existingCompanions.length > 0) {
      existingCompanions.forEach((name, i) => {
        const input = $(`#formCompanionName_${i}`);
        if (input) input.value = name;
      });
    }
  } else {
    selectTicketOption('single');
  }

  // ── CUPOS LLENOS: FORZAR LISTA DE ESPERA PARA PENDIENTES (activado 26/08/2026) ──
  // Para desactivar, cambiar FORZAR_LISTA_ESPERA a false
  const FORZAR_LISTA_ESPERA = true;
  const capAlert = $('#capacityAlertBadge');
  const soldOutBanner = $('#soldOutBanner');
  const isPending = !guest.status || guest.status === 'Pendiente';

  // Si está forzado o el backend informa isSoldOut, tratar como cupos llenos
  const cuposLlenos = (FORZAR_LISTA_ESPERA || (event && event.isSoldOut)) && isPending && !state.testMode;

  if (cuposLlenos) {
    if (soldOutBanner) soldOutBanner.classList.remove('hidden');
    $('#confirmar')?.classList.add('hidden');
    if (capAlert) {
      capAlert.textContent = '🚨 CUPOS COMPLETOS — LISTA DE ESPERA';
      capAlert.className = 'capacity-alert-badge capacity-alert-badge--danger';
      capAlert.classList.remove('hidden');
    }
  } else {
    if (soldOutBanner) soldOutBanner.classList.add('hidden');
    if (capAlert) {
      capAlert.classList.add('hidden');
      capAlert.textContent = '';
    }
  }

  clearFormMessage();
  resetHeroStatus();
  toggleCtas(true);
  if (!cuposLlenos) {
    $('#confirmar')?.classList.remove('hidden');
  }
  $('#alreadyAnswered')?.classList.add('hidden');
  $('#successState')?.classList.add('hidden');

  // ── Opción A: Detectar re-confirmación por problema técnico ──
  if (isPending && state.code) {
    const prevConfirmed = localStorage.getItem('confirmed_' + state.code);
    if (prevConfirmed) {
      showFormMessage('⚠️ Detectamos un problema técnico con tu confirmación anterior. Por favor, volvé a confirmar para asegurar tu lugar.', true);
    }
  }

  // ── Ocultar ticket/QR cuando aún no confirmó (Opción A UX) ──
  const inviteCard = $('aside.invite-card');
  if (inviteCard) {
    if (isPending) {
      // El invitado NO confirmó todavía: ocultar el ticket/QR
      inviteCard.style.display = 'none';
    } else {
      // Ya confirmó: mostrar el ticket/QR
      inviteCard.style.display = '';
    }
  }

  if (guest.status === 'Confirmado') {
    applyAnsweredState('Confirmado');
  } else if (state.testMode) {
    showTestModeState(guest.status || 'Pendiente');
  } else if (guest.status === 'Pendiente' || !guest.status) {
    // Si cupos llenos, mostrar lista de espera en vez del formulario
    if (FORZAR_LISTA_ESPERA && !state.testMode) {
      $('#alreadyAnswered')?.classList.add('hidden');
      $('#confirmar')?.classList.add('hidden');
      // waitlistCard vive dentro de expiredBanner, hay que mostrar ambos
      $('#expiredBanner')?.classList.remove('hidden');
      $('#waitlistCard')?.classList.remove('hidden');
      $('#waitlistSuccess')?.classList.add('hidden');
      $('#soldOutBanner')?.classList.remove('hidden');
      if (guest.phone && $('#waitlistPhone') && !$('#waitlistPhone').value) {
        $('#waitlistPhone').value = guest.phone;
      }
      $('#heroStatus')?.classList.remove('hidden');
      if ($('#heroStatusText')) $('#heroStatusText').textContent = 'Cupos completos · Lista de Espera disponible';
      toggleCtas(false);
    } else {
      $('#alreadyAnswered')?.classList.add('hidden');
      $('#confirmar')?.classList.remove('hidden');
      toggleCtas(true);
    }
  } else {
    // Bloqueo para cualquier estado Expirado / Bloqueado / Lista de espera
    applyAnsweredState(guest.status || 'Expirado');
  }
}

function showTestModeState(status) {
  const confirmed = status === 'Confirmado';
  $('#heroStatus')?.classList.remove('hidden');
  if ($('#heroStatusText')) {
    $('#heroStatusText').textContent = confirmed
      ? 'Modo de prueba · respuesta anterior: Confirmado'
      : 'Modo de prueba · respuesta anterior: No asiste';
  }

  toggleCtas(true);
  $('#confirmar')?.classList.remove('hidden');
  $('#alreadyAnswered')?.classList.add('hidden');

  const formMessage = $('#formMessage');
  if (formMessage) {
    formMessage.textContent = 'Modo de prueba activo: podés enviar el formulario nuevamente y sobrescribir la respuesta anterior.';
    formMessage.classList.remove('hidden', 'form-message--error');
    formMessage.classList.add('form-message--success');
  }
}

function applyAnsweredState(status) {
  const isConfirmed = status === 'Confirmado';
  const isWaitlist = status === 'Lista de Espera';
  const fullName = state.guest?.name || 'el invitado';
  const totalSeats = Number(state.guest?.totalSeats || 0);
  const companionName = state.guest?.companionName || '';

  toggleCtas(false);
  $('#confirmar')?.classList.add('hidden');
  $('#soldOutBanner')?.classList.add('hidden');

  if (isConfirmed) {
    $('#expiredBanner')?.classList.add('hidden');
    $('#alreadyAnswered')?.classList.remove('hidden');
    $('#heroStatus')?.classList.remove('hidden');
    const evDate = state.event?.date ? formatEventDate(state.event.date) : 'Jueves 27 de agosto';
    const evTime = state.event?.time || '20:00';
    if ($('#heroStatusText')) $('#heroStatusText').textContent = `Asistencia confirmada${totalSeats ? ` · ${totalSeats} persona${totalSeats === 2 ? 's' : ''}` : ''}`;
    if ($('#previousAnswerTitle')) $('#previousAnswerTitle').textContent = `La invitación ya quedó confirmada a nombre de ${fullName}.`;
    if ($('#previousAnswer')) {
      $('#previousAnswer').textContent = totalSeats === 2
        ? `Registramos a ${fullName} y ${companionName || 'su acompañante'}. Te esperamos el ${evDate} a las ${evTime} hs.`
        : `Registramos la asistencia de ${fullName}. Te esperamos el ${evDate} a las ${evTime} hs.`;
    }
    const confirmedSeats = Math.max(totalSeats, 1);
    const confirmedText = confirmedSeats === 1 ? '1 Entrada' : `${confirmedSeats} Entradas`;
    if ($('#ticketSeats')) $('#ticketSeats').textContent = confirmedText;
    if ($('.access-pill')) $('.access-pill').textContent = confirmedText;

    // Mostrar el ticket/QR ahora que ya está confirmado
    const inviteCard = $('aside.invite-card');
    if (inviteCard) {
      inviteCard.style.display = '';
      inviteCard.style.animation = 'fadeInUp 0.8s ease-out';
    }
    return;
  }

  // ── PARA TODOS LOS NO CONFIRMADOS: Mostrar SIEMPRE la Lista de Espera ──
  $('#alreadyAnswered')?.classList.add('hidden');
  const expBanner = $('#expiredBanner');
  if (expBanner) {
    expBanner.classList.remove('hidden');
    const nameSpan = $('#expiredGuestName');
    if (nameSpan) nameSpan.textContent = fullName;
  }

  if (isWaitlist) {
    $('#waitlistCard')?.classList.add('hidden');
    $('#waitlistSuccess')?.classList.remove('hidden');
    $('#heroStatus')?.classList.remove('hidden');
    if ($('#heroStatusText')) $('#heroStatusText').textContent = 'En Lista de Espera';
  } else {
    $('#waitlistCard')?.classList.remove('hidden');
    $('#waitlistSuccess')?.classList.add('hidden');
    if (state.guest?.phone && $('#waitlistPhone') && !$('#waitlistPhone').value) {
      $('#waitlistPhone').value = state.guest.phone;
    }
    $('#heroStatus')?.classList.remove('hidden');
    if ($('#heroStatusText')) $('#heroStatusText').textContent = 'Plazo finalizado · Lista de Espera disponible';
  }

  const inviteCard = $('aside.invite-card');
  if (inviteCard) inviteCard.style.display = 'none';
}

function resetHeroStatus() {
  $('#heroStatus')?.classList.add('hidden');
  if ($('#heroStatusText')) $('#heroStatusText').textContent = '';
}

function toggleCtas(show) {
  $('#headerCta')?.classList.toggle('hidden', !show);
  $('#heroCtaRow')?.classList.add('hidden');
}

async function declineRsvp() {
  if (state.submitting) return;
  if (!confirm('¿Estás seguro de que no podrás asistir? Tu lugar será liberado para otros invitados.')) return;
  submitRsvpInternal('no', 'no', '');
}

async function submitRsvp(event) {
  if (event) event.preventDefault();
  if (state.submitting) return;

  const attendanceType = $('input[name="attendanceType"]:checked')?.value || 'single';
  const companion = attendanceType === 'pair' ? 'yes' : 'no';

  // Recolectar todos los nombres de acompañantes
  const companionNames = [];
  const container = $('#companionFieldsList');
  if (attendanceType === 'pair' && container) {
    const inputs = container.querySelectorAll('input');
    let hasEmpty = false;
    inputs.forEach((input, i) => {
      const val = input.value.trim();
      if (!val) hasEmpty = true;
      else companionNames.push(val);
    });
    if (hasEmpty && companionNames.length < inputs.length) {
      showFormMessage(`Por favor completá el nombre de todos los acompañantes (${inputs.length}).`, true);
      const emptyInput = [...inputs].find(i => !i.value.trim());
      if (emptyInput) emptyInput.focus();
      return;
    }
  }
  const companionName = companionNames.join(' | ');

  submitRsvpInternal('yes', companion, companionName);
}

async function submitRsvpInternal(attendance, companion, companionName) {
  if (state.submitting) return;

  // Bloqueo: si está Expirado o Bloqueado (y no está en Pendiente ni Confirmado), se muestra el cartel de expirado
  if (state.guest?.status !== 'Confirmado' && state.guest?.status !== 'Pendiente' && !state.testMode) {
    applyAnsweredState('Expirado');
    return;
  }

  state.submitting = true;

  const submitButton = $('#submitButton');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '⏳ Guardando tus entradas…';
  }
  showFormMessage('Estamos asegurando tu lugar en la sala…', false);

  const guestName = $('#formGuestName')?.value.trim() || state.guest?.name || '';
  const email = $('#formEmail')?.value.trim() || state.guest?.email || '';
  const phone = $('#formPhone')?.value.trim() || state.guest?.phone || '';
  const confirmed = attendance === 'yes';
  const guestCode = state.code || state.guest?.code || 'UA-DEMO-001';
  const calculatedSeats = confirmed
    ? (state.guest?.maxSeats > 0 ? state.guest.maxSeats : (companion === 'yes' ? 2 : 1))
    : 0;

  const formData = new FormData();
  formData.set('code', guestCode);
  formData.set('guestName', guestName);
  formData.set('email', email);
  formData.set('phone', phone);
  formData.set('attendance', attendance);
  formData.set('companion', companion);
  formData.set('companionName', companionName);
  formData.set('allowUpdate', '1');
  formData.set('testMode', state.testMode ? '1' : '0');

  const urlParams = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    urlParams.append(key, value);
  }

  let serverConfirmed = false;

  // ── INTENTO 1: Fetch POST con verificación real de respuesta ──
  try {
    const postResp = await fetch(BACKEND_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: urlParams.toString()
    });
    if (postResp.ok) {
      try {
        const data = await postResp.json();
        if (data.ok) serverConfirmed = true;
      } catch (_) {
        // Respuesta no-JSON pero status OK = probablemente fue bien
        serverConfirmed = true;
      }
    }
  } catch (postErr) {
    console.warn('POST falló, intentando GET fallback:', postErr);
  }

  // ── INTENTO 2: GET fallback si POST falló ──
  if (!serverConfirmed) {
    try {
      const getSyncUrl = BACKEND_URL + '?action=updateGuest&code=' + encodeURIComponent(guestCode) +
        '&status=' + encodeURIComponent(confirmed ? 'Confirmado' : 'No asiste') +
        '&totalSeats=' + encodeURIComponent(calculatedSeats) +
        '&companion=' + encodeURIComponent(companion === 'yes' ? 'Sí' : 'No') +
        '&companionName=' + encodeURIComponent(companionName) +
        '&name=' + encodeURIComponent(guestName) +
        '&email=' + encodeURIComponent(email) +
        '&phone=' + encodeURIComponent(phone) +
        '&t=' + Date.now();
      const getResp = await fetch(getSyncUrl, { method: 'GET', redirect: 'follow' });
      if (getResp.ok) {
        try {
          const data = await getResp.json();
          if (data.ok) serverConfirmed = true;
        } catch (_) {
          serverConfirmed = true;
        }
      }
    } catch (getErr) {
      console.warn('GET fallback también falló:', getErr);
    }
  }

  // ── INTENTO 3: Beacon + Iframe como último recurso (fire-and-forget) ──
  if (!serverConfirmed) {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(BACKEND_URL, urlParams);
      }
      submitHiddenForm(formData, attendance, companion);
    } catch (_) {}
    // Esperar un poco para dar tiempo a beacon/iframe
    await sleep(2000);
  }

  // ── Actualizar estado local ──
  state.guest = {
    ...state.guest,
    name: guestName,
    email: email,
    phone: phone,
    status: confirmed ? 'Confirmado' : 'No asiste',
    hasCompanion: companion === 'yes',
    companionName: companionName,
    totalSeats: calculatedSeats,
    code: guestCode
  };

  // ── Guardar en localStorage que el usuario confirmó (para detección de re-confirmación) ──
  try {
    localStorage.setItem('confirmed_' + guestCode, new Date().toISOString());
  } catch (_) {}

  if (serverConfirmed) {
    // Servidor confirmó: mostrar éxito normalmente
    showSuccessFromServer();
    clearFormMessage();
  } else {
    // Servidor NO confirmó: mostrar éxito PERO con advertencia
    showSuccessFromServer();
    showFormMessage('⚠️ Tu confirmación se envió pero no pudimos verificar la respuesta del servidor. Si no recibís el mail de confirmación, por favor volvé a abrir este link para re-confirmar.', true);
  }

  state.submitting = false;
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = '🎟️ CONFIRMAR Y OBTENER MIS ENTRADAS VIP';
  }
}

function submitHiddenForm(formData, attendance, companion) {
  formData.set('attendance', attendance);
  formData.set('companion', companion);
  formData.set('testMode', state.testMode ? '1' : '0');

  let iframe = document.querySelector('iframe[name="submissionFrame"]');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.name = 'submissionFrame';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }

  const postForm = document.createElement('form');
  postForm.method = 'POST';
  postForm.action = BACKEND_URL;
  postForm.target = 'submissionFrame';
  postForm.style.display = 'none';

  for (const [key, value] of formData.entries()) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    postForm.appendChild(input);
  }

  document.body.appendChild(postForm);
  try {
    postForm.submit();
  } catch (e) {
    console.warn('Post error fallback:', e);
  }
  setTimeout(() => postForm.remove(), 3000);
}


function showSuccessFromServer() {
  const attending = state.guest?.status === 'Confirmado';
  const total = Number(state.guest?.totalSeats || 0);

  // 1. Siempre aplicar el estado respondido primero (oculta form y muestra ticket QR)
  if (state.guest?.status) {
    applyAnsweredState(state.guest.status);
  }

  const guestCode = state.guest ? state.guest.code : 'UA-DEMO-001';
  const qrTarget = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${guestCode}`;
  let qrUrl = '';
  if (typeof QRCode !== 'undefined' && QRCode.generateDataUrl) {
    qrUrl = QRCode.generateDataUrl(qrTarget, 250, '#0f172a', '#ffffff');
  } else {
    qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrTarget)}&color=0f172a&bgcolor=ffffff`;
  }

  // Actualizar también ticket principal
  if ($('#ticketQrImage')) $('#ticketQrImage').src = qrUrl;
  if ($('#ticketName') && state.guest?.name) $('#ticketName').textContent = state.guest.name;
  if ($('#ticketCode')) $('#ticketCode').textContent = guestCode;

  const successNode = $('#successState');
  if (successNode) {
    const iconNode = $('.success__icon', successNode);
    const eyebrowNode = $('.eyebrow', successNode);
    const qrBoxNode = $('.success-qr-box', successNode);
    const downloadBtnNode = $('#downloadPassButton');

    successNode.classList.remove('hidden');

    const evDate = state.event?.date ? formatEventDate(state.event.date) : 'Jueves 27 de agosto';
    const evTime = state.event?.time || '20:00';
    const evVenue = state.event?.venue || 'Movie Montevideo Shopping';

    if (attending) {
      if (iconNode) {
        iconNode.textContent = '✓';
        iconNode.style.background = 'rgba(56, 189, 248, 0.2)';
        iconNode.style.color = '#38bdf8';
      }
      if (eyebrowNode) eyebrowNode.textContent = 'CONFIRMACIÓN REGISTRADA';
      if ($('#successTitle')) $('#successTitle').textContent = `¡Gracias, ${firstName(state.guest?.name)}!`;
      if ($('#successText')) {
        $('#successText').textContent =
          `Tu asistencia quedó registrada para ${Math.max(total, 1)} persona${Math.max(total, 1) === 2 ? 's' : ''}. ` +
          `Te esperamos el ${evDate} a las ${evTime} hs en ${evVenue}.`;
      }

      if ($('#successQrImage')) $('#successQrImage').src = qrUrl;
      if ($('#successQrCode')) $('#successQrCode').textContent = guestCode;
      if (qrBoxNode) qrBoxNode.classList.remove('hidden');
      if (downloadBtnNode) downloadBtnNode.classList.remove('hidden');

      const waText = encodeURIComponent(
        `¡Hola! Confirmé mi asistencia para la función especial de Coyote vs. Acme de Universal Assistance 🎬✨\n\n` +
        `📅 Fecha: Jueves 27 de Agosto · 20:00 hs (Llegada: 19:30 hs)\n` +
        `📍 Lugar: Movie Montevideo Shopping\n` +
        `🎟️ Código de entrada: ${guestCode}\n\n` +
        `Ver invitación y pase VIP: https://ua-eventos-uy.web.app/coyote-vs-acme?i=${guestCode}`
      );
      const waButton = $('#whatsappShareButton');
      if (waButton) {
        waButton.href = `https://api.whatsapp.com/send?text=${waText}`;
        waButton.classList.remove('hidden');
      }

      $('#calendarButton')?.classList.remove('hidden');
      $('#mapsButton')?.classList.remove('hidden');
      try { launchConfetti(); } catch (_) {}
    } else {
      if (iconNode) {
        iconNode.textContent = '💙';
        iconNode.style.background = 'rgba(239, 47, 131, 0.2)';
        iconNode.style.color = '#ef2f83';
      }
      if (eyebrowNode) eyebrowNode.textContent = 'RESPUESTA REGISTRADA';
      if ($('#successTitle')) $('#successTitle').textContent = `¡Qué lástima que no puedas acompañarnos, ${firstName(state.guest?.name)}!`;
      if ($('#successText')) $('#successText').textContent = 'Lamentamos mucho que no puedas asistir en esta oportunidad. ¡Esperamos reencontrarnos muy pronto en un próximo evento de Universal Assistance!';

      if (qrBoxNode) qrBoxNode.classList.add('hidden');
      if (downloadBtnNode) downloadBtnNode.classList.add('hidden');
      if ($('#whatsappShareButton')) $('#whatsappShareButton').classList.add('hidden');
      $('#calendarButton')?.classList.add('hidden');
      $('#mapsButton')?.classList.add('hidden');
    }
  }

  if (attending) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (successNode) {
    successNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function showFormMessage(message, isError) {
  const node = $('#formMessage');
  if (!node) return;
  node.textContent = message;
  node.classList.remove('hidden', 'form-message--error', 'form-message--success');
  node.classList.add(isError ? 'form-message--error' : 'form-message--success');
}

function clearFormMessage() {
  const node = $('#formMessage');
  if (!node) return;
  node.textContent = '';
  node.classList.add('hidden');
  node.classList.remove('form-message--error', 'form-message--success');
}

function showError(message) {
  const loadingEl = $('#loadingState');
  if (loadingEl) loadingEl.style.display = 'none';
  $('#loadingState')?.classList.add('hidden');
  $('#invitation')?.classList.add('hidden');
  $('#errorState')?.classList.remove('hidden');
  if ($('#errorMessage')) $('#errorMessage').textContent = message;
}

function firstName(fullName) {
  if (!fullName) return '';
  const clean = String(fullName).trim();
  if (!clean || clean.toLowerCase().includes('invitado')) return '';
  return clean.split(/\s+/)[0];
}

function formatEventDate(value) {
  const match = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return value;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

function downloadCalendarFile() {
  if (!state.event || !state.guest) return;

  const dateMatch = String(state.event.date || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const timeMatch = String(state.event.time || '').match(/^(\d{1,2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) {
    alert('No pudimos preparar el evento para Google Calendar.');
    return;
  }

  const day = dateMatch[1].padStart(2, '0');
  const month = dateMatch[2].padStart(2, '0');
  const year = dateMatch[3];
  const hour = Number(timeMatch[1]);
  const minute = timeMatch[2];
  const endHour = String((hour + 3) % 24).padStart(2, '0');
  const startHour = String(hour).padStart(2, '0');

  const start = `${year}${month}${day}T${startHour}${minute}00`;
  const end = `${year}${month}${day}T${endHour}${minute}00`;
  const guestName = state.guest.name || 'Invitado';
  const seats = Number(state.guest.totalSeats || 1);

  const details = [
    'Invitación confirmada de Universal Assistance.',
    `Invitado: ${guestName}`,
    `Accesos: ${seats}`,
    `Código: ${state.guest.code}`,
    `Llegada sugerida: ${state.event.arrivalTime} hs`
  ].join('\n');

  const calendarUrl = new URL('https://calendar.google.com/calendar/render');
  calendarUrl.searchParams.set('action', 'TEMPLATE');
  calendarUrl.searchParams.set('text', state.event.name || 'Función especial Coyote vs. Acme');
  calendarUrl.searchParams.set('dates', `${start}/${end}`);
  calendarUrl.searchParams.set('ctz', 'America/Montevideo');
  calendarUrl.searchParams.set('location', state.event.venue || 'Movie Montevideo Shopping');
  calendarUrl.searchParams.set('details', details);

  const popup = window.open(calendarUrl.toString(), '_blank', 'noopener,noreferrer');

  if (!popup) {
    window.location.href = calendarUrl.toString();
  }
}

function downloadVipPass() {
  const btn = $('#downloadPassButton');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generando tu Entrada…';
  }

  const finish = () => {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🎟️ Descargar mi Entrada';
    }
  };

  const guest = state.guest || { name: 'Lucas Beathayte', code: 'UA-DEMO-001', totalSeats: 1 };
  const event = state.event || { name: 'Función especial Coyote vs. Acme', date: 'Jueves 27 de Agosto', time: '20:00', venue: 'Movie Montevideo Shopping' };

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  // 1. Fondo Oscuro Principal
  ctx.fillStyle = '#04142d';
  ctx.fillRect(0, 0, 1200, 630);

  // 2. Ticket Card Background (Borde azul/cyan)
  const x = 40, y = 40, w = 1120, h = 550, r = 24;
  
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  
  const bgGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  bgGrad.addColorStop(0, '#0a224a');
  bgGrad.addColorStop(0.5, '#0e2b5c');
  bgGrad.addColorStop(1, '#162c5e');
  ctx.fillStyle = bgGrad;
  ctx.fill();

  ctx.strokeStyle = '#1a88d6';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // 3. Recortes semicirculares en la perforación (Top y Bottom Muescas)
  const perfX = 780;
  
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  // Muesca Superior
  ctx.beginPath();
  ctx.arc(perfX, y, 24, 0, Math.PI * 2);
  ctx.fill();
  // Muesca Inferior
  ctx.beginPath();
  ctx.arc(perfX, y + h, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Re-dibujar bordes de las muescas
  ctx.strokeStyle = '#1a88d6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(perfX, y, 24, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(perfX, y + h, 24, Math.PI, Math.PI * 2);
  ctx.stroke();

  // 4. Línea de Perforación Punteada
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(perfX, y + 26);
  ctx.lineTo(perfX, y + h - 26);
  ctx.stroke();
  ctx.restore();

  // 5. CONTENIDO LADO IZQUIERDO
  // Header Marca
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px Inter, sans-serif';
  ctx.fillText('UNIVERSAL ASSISTANCE', 80, 95);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 13px Inter, sans-serif';
  ctx.fillText('A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO', 80, 122);

  // Línea divisoria izquierda
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 142);
  ctx.lineTo(740, 142);
  ctx.stroke();

  // Subtítulo Magenta
  ctx.fillStyle = '#ff2e93';
  ctx.font = '800 14px Inter, sans-serif';
  ctx.fillText('FUNCIÓN DE CINE EXCLUSIVA', 80, 180);

  // Título Película
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px Inter, sans-serif';
  ctx.fillText('COYOTE VS ACME', 80, 235);

  // Label Invitado
  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 12px Inter, sans-serif';
  ctx.fillText('INVITADO ESPECIAL', 80, 285);

  // Nombre del Invitado
  const guestName = guest.name || 'Invitado de prueba';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 34px Inter, sans-serif';
  ctx.fillText(guestName, 80, 330);

  // Acceso
  const total = Number(guest.totalSeats || 1);
  const accessText = total === 2 ? 'Acceso con acompañante' : 'Acceso individual';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '600 17px Inter, sans-serif';
  ctx.fillText(accessText, 80, 365);

  // Meta Datos (Fecha y Hora | Lugar)
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 12px Inter, sans-serif';
  ctx.fillText('FECHA Y HORA:', 80, 425);
  ctx.fillText('LUGAR:', 440, 425);

  const formattedDate = formatEventDate(event.date);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 17px Inter, sans-serif';
  ctx.fillText(`${formattedDate || 'Jueves 27 de Agosto'} · ${event.time || '20:00'} hs`, 80, 455);
  ctx.fillText(event.venue || 'Movie Montevideo Shopping', 440, 455);

  // Pie Izquierdo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '600 11px Inter, monospace';
  ctx.fillText('UA CINEMA VIP PASS · VALIDO PARA 1 FUNCIÓN', 80, 535);

  // 6. CONTENIDO LADO DERECHO (Troquel del Pase)
  // Badge Cyan superior
  ctx.fillStyle = '#38bdf8';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(815, 80, 250, 40, 6);
    ctx.fill();
  } else {
    ctx.fillRect(815, 80, 250, 40);
  }

  ctx.fillStyle = '#04142d';
  ctx.font = '900 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PASE VIP EXCLUSIVO', 940, 105);

  // Código Label
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 11px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CÓDIGO DE ENTRADA:', 815, 152);

  // Código Value
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px Inter, monospace';
  ctx.fillText(guest.code || 'UA-DEMO-001', 815, 180);

  // Caja Blanca del QR
  const qrImg = document.getElementById('successQrImage') || document.getElementById('ticketQrImage');

  const drawAndSave = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(835, 205, 210, 210);

    if (qrImg && qrImg.naturalWidth > 0) {
      try {
        ctx.drawImage(qrImg, 845, 215, 190, 190);
      } catch (_) {}
    }

    // Texto debajo del QR
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESCANEÁ EN BOLETERÍA', 940, 442);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '600 11px Inter, monospace';
    ctx.fillText(guest.code || 'UA-DEMO-001', 940, 535);

    // Descargar imagen PNG
    const a = document.createElement('a');
    a.download = `Entrada-UA-${guest.code || 'VIP'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    finish();
  };

  if (qrImg && (!qrImg.complete || qrImg.naturalWidth === 0)) {
    qrImg.onload = drawAndSave;
    setTimeout(drawAndSave, 500);
  } else {
    drawAndSave();
  }
}

function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let canvas = document.getElementById('confettiCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confettiCanvas';
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;

  const colors = ['#38bdf8', '#ef2f83', '#f59e0b', '#ffffff', '#7be7ff', '#ff7be7'];
  const particles = [];
  const particleCount = 130;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: width / 2 + (Math.random() - 0.5) * (width * 0.5),
      y: height * 0.75 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 16,
      vy: -(Math.random() * 15 + 9),
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle'
    });
  }

  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    ctx.clearRect(0, 0, width, height);

    let activeCount = 0;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.vx *= 0.985;
      p.rotation += p.rSpeed;

      if (elapsed > 2000) {
        p.opacity = Math.max(0, p.opacity - 0.025);
      }

      if (p.opacity > 0 && p.y < height + 40) {
        activeCount++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    });

    if (activeCount > 0 && elapsed < 4500) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }

  animate();
}

async function submitWaitlist(e) {
  if (e) e.preventDefault();
  const phone = $('#waitlistPhone')?.value.trim();
  const seats = $('#waitlistSeats')?.value || '2';
  const btn = $('#btnJoinWaitlist');
  if (!phone) {
    alert('Por favor, ingresá tu número de celular para poder avisarte.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Registrando...';
  }

  try {
    const callbackName = `uaWaitlistCb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement('script');
    const url = new URL(BACKEND_URL);
    url.searchParams.set('action', 'updateGuest');
    url.searchParams.set('code', state.code);
    url.searchParams.set('status', 'Lista de Espera');
    url.searchParams.set('phone', phone);
    url.searchParams.set('totalSeats', seats);
    url.searchParams.set('callback', callbackName);
    url.searchParams.set('_', Date.now().toString());

    window[callbackName] = function(res) {
      delete window[callbackName];
      script.remove();
      $('#waitlistCard')?.classList.add('hidden');
      $('#waitlistSuccess')?.classList.remove('hidden');
      if ($('#heroStatusText')) $('#heroStatusText').textContent = 'En Lista de Espera';
    };

    script.src = url.toString();
    script.onerror = function() {
      // Fallback si la respuesta tarda
      $('#waitlistCard')?.classList.add('hidden');
      $('#waitlistSuccess')?.classList.remove('hidden');
      if ($('#heroStatusText')) $('#heroStatusText').textContent = 'En Lista de Espera';
    };
    document.body.appendChild(script);
  } catch (err) {
    console.error('Error al registrarse en lista de espera:', err);
    $('#waitlistCard')?.classList.add('hidden');
    $('#waitlistSuccess')?.classList.remove('hidden');
  }
}

