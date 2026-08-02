const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';

const state = {
  guest: null,
  event: null,
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

  if (params.get('demo') === '1' || state.code === 'UA-DEMO-001') {
    state.guest = {
      code: 'UA-DEMO-001',
      name: 'Lucas Beathayte',
      email: '',
      phone: '',
      status: 'Pendiente',
      hasCompanion: false,
      companionName: '',
      totalSeats: 0,
      responseDate: ''
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
  if (isPair) $('#formCompanionName')?.focus();
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

async function loadGuest(code) {
  try {
    const payload = await getGuestData(code);
    state.guest = payload.guest;
    state.event = payload.event;
    renderInvitation();
  } catch (_) {
    // Fallback gracioso: mostrar siempre la invitación con datos demo
    state.guest = {
      code: code || 'UA-DEMO-001',
      name: 'Invitado Especial',
      email: '',
      phone: '',
      status: 'Pendiente',
      hasCompanion: false,
      companionName: '',
      totalSeats: 0,
      responseDate: ''
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
  }
}

function getGuestData(code) {
  return new Promise((resolve, reject) => {
    const callbackName = `uaGuestCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement('script');
    let finished = false;

    const timeout = setTimeout(() => finish(() => reject(new Error('No pudimos conectar con la lista de invitados.'))), 3000);

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

function renderInvitation() {
  const { guest, event } = state;

  const loadingEl = $('#loadingState');
  if (loadingEl) {
    loadingEl.style.display = 'none';
    loadingEl.classList.add('hidden');
  }

  $('#errorState')?.classList.add('hidden');
  $('#invitation')?.classList.remove('hidden');

  const rawName = guest ? guest.name : 'Invitado';
  const fName = firstName(rawName);
  const isGeneric = !rawName || rawName.toLowerCase().includes('invitado');
  
  if ($('#guestGreeting')) {
    $('#guestGreeting').textContent = isGeneric
      ? 'Tenemos una invitación especial para vos'
      : `¡Hola ${fName}! Tenemos una invitación para vos`;
  }
  
  if ($('#rsvpGuestFirstName')) $('#rsvpGuestFirstName').textContent = fName || 'Invitado';
  if ($('#introText')) $('#introText').textContent = event.intro;
  if ($('#eventDate')) $('#eventDate').textContent = formatEventDate(event.date);
  if ($('#eventTime')) $('#eventTime').textContent = `${event.time} hs`;
  if ($('#eventVenue')) $('#eventVenue').textContent = event.venue;
  if ($('#ticketName')) $('#ticketName').textContent = guest.name;
  if ($('#ticketCode')) $('#ticketCode').textContent = guest.code;
  if ($('#formCode')) $('#formCode').value = guest.code;
  if ($('#arrivalTime')) $('#arrivalTime').textContent = `${event.arrivalTime} hs`;
  
  $('#calendarButton')?.classList.remove('hidden');
  $('#mapsButton')?.classList.remove('hidden');
  
  if ($('#ticketSeats')) {
    $('#ticketSeats').textContent = guest.totalSeats > 0
      ? `${guest.totalSeats} persona${guest.totalSeats === 2 ? 's' : ''}`
      : 'Vos + 1';
  }

  const guestCode = guest ? guest.code : 'UA-DEMO-001';
  const qrTarget = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${guestCode}`;
  let qrUrl = '';
  if (typeof QRCode !== 'undefined' && QRCode.generateDataUrl) {
    qrUrl = QRCode.generateDataUrl(qrTarget, 250, '#0f172a', '#ffffff');
  } else {
    qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrTarget)}&color=0f172a&bgcolor=ffffff`;
  }
  if ($('#ticketQrImage')) $('#ticketQrImage').src = qrUrl;
  if ($('#successQrImage')) $('#successQrImage').src = qrUrl;
  if ($('#successQrCode')) $('#successQrCode').textContent = guestCode;

  if ($('#formGuestName')) $('#formGuestName').value = guest.name || '';
  if ($('#formEmail')) $('#formEmail').value = guest.email || '';
  if ($('#formPhone')) $('#formPhone').value = guest.phone || '';
  if ($('#formCompanionName')) $('#formCompanionName').value = guest.companionName || '';

  if (guest.hasCompanion || guest.totalSeats === 2) {
    selectTicketOption('pair');
  } else {
    selectTicketOption('single');
  }

  clearFormMessage();
  resetHeroStatus();
  toggleCtas(true);
  $('#confirmar')?.classList.remove('hidden');
  $('#alreadyAnswered')?.classList.add('hidden');
  $('#successState')?.classList.add('hidden');

  if (guest.status && guest.status !== 'Pendiente' && !state.testMode) {
    applyAnsweredState(guest.status);
  } else if (guest.status && guest.status !== 'Pendiente' && state.testMode) {
    showTestModeState(guest.status);
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
  const confirmed = status === 'Confirmado';
  const fullName = state.guest?.name || 'el invitado';
  const totalSeats = Number(state.guest?.totalSeats || 0);
  const companionName = state.guest?.companionName || '';

  toggleCtas(false);
  $('#confirmar')?.classList.add('hidden');
  $('#alreadyAnswered')?.classList.remove('hidden');
  $('#heroStatus')?.classList.remove('hidden');

  if (confirmed) {
    if ($('#heroStatusText')) $('#heroStatusText').textContent = `Asistencia confirmada${totalSeats ? ` · ${totalSeats} persona${totalSeats === 2 ? 's' : ''}` : ''}`;
    if ($('#previousAnswerTitle')) $('#previousAnswerTitle').textContent = `La invitación ya quedó confirmada a nombre de ${fullName}.`;
    if ($('#previousAnswer')) {
      $('#previousAnswer').textContent = totalSeats === 2
        ? `Registramos a ${fullName} y ${companionName || 'su acompañante'}. Te esperamos el ${formatEventDate(state.event.date)} a las ${state.event.time} hs.`
        : `Registramos la asistencia de ${fullName}. Te esperamos el ${formatEventDate(state.event.date)} a las ${state.event.time} hs.`;
    }
    if ($('#ticketSeats')) $('#ticketSeats').textContent = `${Math.max(totalSeats, 1)} persona${Math.max(totalSeats, 1) === 2 ? 's' : ''}`;
  } else {
    if ($('#heroStatusText')) $('#heroStatusText').textContent = 'Respuesta registrada · No asistirá';
    if ($('#previousAnswerTitle')) $('#previousAnswerTitle').textContent = `Ya registramos que ${fullName} no podrá asistir.`;
    if ($('#previousAnswer')) $('#previousAnswer').textContent = 'Gracias por avisarnos. Esta invitación ya no volverá a mostrarse como pendiente.';
    if ($('#ticketSeats')) $('#ticketSeats').textContent = 'No asistirá';
  }
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
  const companionName = $('#formCompanionName')?.value.trim() || '';

  if (attendanceType === 'pair' && !companionName) {
    showFormMessage('Por favor ingresá el nombre de tu acompañante.', true);
    $('#formCompanionName')?.focus();
    return;
  }

  submitRsvpInternal('yes', companion, companionName);
}

async function submitRsvpInternal(attendance, companion, companionName) {
  if (state.submitting) return;
  state.submitting = true;

  const submitButton = $('#submitButton');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Registrando…';
  }
  showFormMessage('Estamos registrando tu respuesta…', false);

  const guestName = $('#formGuestName')?.value.trim() || state.guest?.name || '';
  const email = $('#formEmail')?.value.trim() || state.guest?.email || '';
  const phone = $('#formPhone')?.value.trim() || state.guest?.phone || '';
  const confirmed = attendance === 'yes';

  // 1. Actualizar estado local inmediatamente (estado optimista)
  state.guest = {
    ...state.guest,
    name: guestName,
    email: email,
    phone: phone,
    status: confirmed ? 'Confirmado' : 'No asiste',
    hasCompanion: companion === 'yes',
    companionName: companionName,
    totalSeats: confirmed ? (companion === 'yes' ? 2 : 1) : 0,
    code: state.guest?.code || 'UA-DEMO-001'
  };

  // 2. Enviar al backend en segundo plano (no bloquea la UX)
  try {
    const formData = new FormData();
    formData.set('code', state.code || 'UA-DEMO-001');
    formData.set('guestName', guestName);
    formData.set('email', email);
    formData.set('phone', phone);
    formData.set('attendance', attendance);
    formData.set('companion', companion);
    formData.set('companionName', companionName);
    formData.set('allowUpdate', '1');
    formData.set('testMode', state.testMode ? '1' : '0');
    submitHiddenForm(formData, attendance, companion);
  } catch (_) {}

  // 3. Mostrar resultado inmediato tras 400ms
  await sleep(400);
  showSuccessFromServer();

  state.submitting = false;
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = '🎟️ CONFIRMAR Y OBTENER MIS ENTRADAS VIP';
  }
  clearFormMessage();
}

function submitHiddenForm(formData, attendance, companion) {
  formData.set('attendance', attendance);
  formData.set('companion', companion);
  formData.set('testMode', state.testMode ? '1' : '0');

  const postForm = document.createElement('form');
  postForm.method = 'POST';
  postForm.action = BACKEND_URL;
  postForm.target = 'submissionFrame';
  postForm.className = 'hidden';

  for (const [key, value] of formData.entries()) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    postForm.appendChild(input);
  }

  document.body.appendChild(postForm);
  postForm.submit();
  setTimeout(() => postForm.remove(), 3000);
}


function showSuccessFromServer() {
  const attending = state.guest.status === 'Confirmado';
  const total = Number(state.guest.totalSeats || 0);

  const guestCode = state.guest ? state.guest.code : 'UA-DEMO-001';
  const qrTarget = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${guestCode}`;
  let qrUrl = '';
  if (typeof QRCode !== 'undefined' && QRCode.generateDataUrl) {
    qrUrl = QRCode.generateDataUrl(qrTarget, 250, '#0f172a', '#ffffff');
  } else {
    qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrTarget)}&color=0f172a&bgcolor=ffffff`;
  }

  const successNode = $('#successState');
  if (!successNode) return;
  
  const iconNode = $('.success__icon', successNode);
  const eyebrowNode = $('.eyebrow', successNode);
  const qrBoxNode = $('.success-qr-box', successNode);
  const downloadBtnNode = $('#downloadPassButton');

  successNode.classList.remove('hidden');

  if (attending) {
    if (iconNode) {
      iconNode.textContent = '✓';
      iconNode.style.background = 'rgba(56, 189, 248, 0.2)';
      iconNode.style.color = '#38bdf8';
    }
    if (eyebrowNode) eyebrowNode.textContent = 'CONFIRMACIÓN REGISTRADA';
    if ($('#successTitle')) $('#successTitle').textContent = `¡Gracias, ${firstName(state.guest.name)}!`;
    if ($('#successText')) {
      $('#successText').textContent =
        `Tu asistencia quedó registrada para ${Math.max(total, 1)} persona${Math.max(total, 1) === 2 ? 's' : ''}. ` +
        `Te esperamos el ${formatEventDate(state.event.date)} a las ${state.event.time} hs en ${state.event.venue}.`;
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
    launchConfetti();
  } else {
    if (iconNode) {
      iconNode.textContent = '💙';
      iconNode.style.background = 'rgba(239, 47, 131, 0.2)';
      iconNode.style.color = '#ef2f83';
    }
    if (eyebrowNode) eyebrowNode.textContent = 'RESPUESTA REGISTRADA';
    if ($('#successTitle')) $('#successTitle').textContent = `¡Qué lástima que no puedas acompañarnos, ${firstName(state.guest.name)}!`;
    if ($('#successText')) $('#successText').textContent = 'Lamentamos mucho que no puedas asistir en esta oportunidad. ¡Esperamos reencontrarnos muy pronto en un próximo evento de Universal Assistance!';

    if (qrBoxNode) qrBoxNode.classList.add('hidden');
    if (downloadBtnNode) downloadBtnNode.classList.add('hidden');
    if ($('#whatsappShareButton')) $('#whatsappShareButton').classList.add('hidden');
    $('#calendarButton')?.classList.add('hidden');
    $('#mapsButton')?.classList.add('hidden');
  }

  applyAnsweredState(state.guest.status);
  successNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  return String(fullName || 'Hola').trim().split(/\s+/)[0];
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
