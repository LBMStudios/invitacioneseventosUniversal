const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzkavCHwzdPhqSIKBpkN3oC2QD7EIAcvZVbwX9MwaP7jiM8QhjVJrMGHpbKflu2XQZW3w/exec';

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
  bindEvents();
  initPlaneAnimation();
  initParallaxAnimation();
  initRevealAnimations();
  initCountdown();
  initCloudMouseParallax();

  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') {
    state.guest = {
      code: 'UA-DEMO-001',
      name: 'Lucas Beathyate',
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

  if (!state.code) {
    showError('El enlace no contiene un código de invitación.');
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
  } catch (error) {
    if (!code || code === 'UA-DEMO-001' || state.testMode || String(code).toLowerCase().includes('demo')) {
      state.guest = {
        code: code || 'UA-DEMO-001',
        name: 'Lucas Beathyate',
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
    showError(error.message || 'No pudimos cargar la invitación.');
  }
}

function getGuestData(code) {
  return new Promise((resolve, reject) => {
    const callbackName = `uaGuestCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement('script');
    let finished = false;

    const timeout = setTimeout(() => finish(() => reject(new Error('No pudimos conectar con la lista de invitados.'))), 12000);

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

  $('#loadingState').classList.add('hidden');
  $('#errorState').classList.add('hidden');
  $('#invitation').classList.remove('hidden');

  const rawName = guest.name || '';
  const fName = firstName(rawName);
  const isGeneric = !rawName || rawName.toLowerCase().includes('invitado');
  $('#guestGreeting').textContent = isGeneric
    ? 'Tenemos una invitación especial para vos'
    : `¡Hola ${fName}! Tenemos una invitación para vos`;
  if ($('#rsvpGuestFirstName')) $('#rsvpGuestFirstName').textContent = fName || 'Invitado';
  $('#introText').textContent = event.intro;
  $('#eventDate').textContent = formatEventDate(event.date);
  $('#eventTime').textContent = `${event.time} hs`;
  $('#eventVenue').textContent = event.venue;
  $('#ticketName').textContent = guest.name;
  $('#ticketCode').textContent = guest.code;
  $('#formCode').value = guest.code;
  $('#arrivalTime').textContent = `${event.arrivalTime} hs`;
  $('#mapsButton').href = event.mapsUrl || '#';
  $('#calendarButton').classList.remove('hidden');
  $('#mapsButton').classList.remove('hidden');
  $('#ticketSeats').textContent = guest.totalSeats > 0
    ? `${guest.totalSeats} persona${guest.totalSeats === 2 ? 's' : ''}`
    : 'Vos + 1';

  const guestCode = guest.code || 'UA-DEMO-001';
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
  $('#confirmar').classList.remove('hidden');
  $('#alreadyAnswered').classList.add('hidden');
  $('#successState').classList.add('hidden');

  if (guest.status && guest.status !== 'Pendiente' && !state.testMode) {
    applyAnsweredState(guest.status);
  } else if (guest.status && guest.status !== 'Pendiente' && state.testMode) {
    showTestModeState(guest.status);
  }
}


function showTestModeState(status) {
  const confirmed = status === 'Confirmado';
  $('#heroStatus').classList.remove('hidden');
  $('#heroStatusText').textContent = confirmed
    ? 'Modo de prueba · respuesta anterior: Confirmado'
    : 'Modo de prueba · respuesta anterior: No asiste';

  toggleCtas(true);
  $('#confirmar').classList.remove('hidden');
  $('#alreadyAnswered').classList.add('hidden');

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
  $('#confirmar').classList.add('hidden');
  $('#alreadyAnswered').classList.remove('hidden');
  $('#heroStatus').classList.remove('hidden');

  if (confirmed) {
    $('#heroStatusText').textContent = `Asistencia confirmada${totalSeats ? ` · ${totalSeats} persona${totalSeats === 2 ? 's' : ''}` : ''}`;
    $('#previousAnswerTitle').textContent = `La invitación ya quedó confirmada a nombre de ${fullName}.`;
    $('#previousAnswer').textContent = totalSeats === 2
      ? `Registramos a ${fullName} y ${companionName || 'su acompañante'}. Te esperamos el ${formatEventDate(state.event.date)} a las ${state.event.time} hs.`
      : `Registramos la asistencia de ${fullName}. Te esperamos el ${formatEventDate(state.event.date)} a las ${state.event.time} hs.`;
    $('#ticketSeats').textContent = `${Math.max(totalSeats, 1)} persona${Math.max(totalSeats, 1) === 2 ? 's' : ''}`;
  } else {
    $('#heroStatusText').textContent = 'Respuesta registrada · No asistirá';
    $('#previousAnswerTitle').textContent = `Ya registramos que ${fullName} no podrá asistir.`;
    $('#previousAnswer').textContent = 'Gracias por avisarnos. Esta invitación ya no volverá a mostrarse como pendiente.';
    $('#ticketSeats').textContent = 'No asistirá';
  }
}

function resetHeroStatus() {
  $('#heroStatus').classList.add('hidden');
  $('#heroStatusText').textContent = '';
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
  state.submitting = true;
  const submitButton = $('#submitButton');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Registrando…';
  }
  showFormMessage('Estamos registrando tu respuesta.', false);

  const guestName = $('#formGuestName')?.value.trim() || state.guest?.name || '';
  const email = $('#formEmail')?.value.trim() || state.guest?.email || '';
  const phone = $('#formPhone')?.value.trim() || state.guest?.phone || '';

  const formData = new FormData();
  formData.set('code', state.code || 'UA-DEMO-001');
  formData.set('guestName', guestName);
  formData.set('email', email);
  formData.set('phone', phone);
  formData.set('attendance', attendance);
  formData.set('companion', companion);
  formData.set('companionName', companionName);
  formData.set('allowUpdate', '1');

  const isDemo = new URLSearchParams(location.search).get('demo') === '1' || !state.code;

  if (isDemo) {
    await sleep(600);
    const confirmed = attendance === 'yes';
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
    showSuccessFromServer();
    state.submitting = false;
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = '🎟️ CONFIRMAR Y OBTENER MIS ENTRADAS VIP';
    }
    return;
  }

  try {
    submitHiddenForm(formData, attendance, companion);
    const expectedStatus = attendance === 'yes' ? 'Confirmado' : 'No asiste';
    try {
      const payload = await waitForSavedResponse(state.code, expectedStatus);
      state.guest = payload.guest;
      state.event = payload.event;
    } catch (pollErr) {
      console.warn('Polling timeout/error, applying optimistic state:', pollErr);
      state.guest.name = guestName;
      state.guest.email = email;
      state.guest.phone = phone;
      state.guest.status = expectedStatus;
      state.guest.hasCompanion = companion === 'yes';
      state.guest.companionName = companionName;
      state.guest.totalSeats = attendance === 'yes' ? (companion === 'yes' ? 2 : 1) : 0;
    }
    showSuccessFromServer();
  } catch (error) {
    showFormMessage(error.message || 'No pudimos registrar tu respuesta. Volvé a intentarlo.', true);
  } finally {
    state.submitting = false;
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = '🎟️ CONFIRMAR Y OBTENER MIS ENTRADAS VIP';
    }
  }
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

async function waitForSavedResponse(code, expectedStatus) {
  let lastPayload = null;
  let lastNetworkError = null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    await sleep(attempt === 0 ? 750 : 650);

    try {
      lastPayload = await getGuestData(code);
      lastNetworkError = null;
    } catch (error) {
      lastNetworkError = error;
      continue;
    }

    const status = lastPayload.guest?.status;
    if (!status || status === 'Pendiente') continue;

    if (status !== expectedStatus) {
      throw new Error(state.testMode
        ? 'La respuesta de prueba todavía no se actualizó. Volvé a intentarlo.'
        : 'Esta invitación ya tenía una respuesta registrada y no puede modificarse.');
    }

    return lastPayload;
  }

  if (lastNetworkError) throw lastNetworkError;
  throw new Error('La respuesta demoró más de lo esperado. Recargá la página para verificarla.');
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
    $('#successTitle').textContent = `¡Gracias, ${firstName(state.guest.name)}!`;
    $('#successText').textContent =
      `Tu asistencia quedó registrada para ${Math.max(total, 1)} persona${Math.max(total, 1) === 2 ? 's' : ''}. ` +
      `Te esperamos el ${formatEventDate(state.event.date)} a las ${state.event.time} hs en ${state.event.venue}.`;

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

    $('#calendarButton').classList.remove('hidden');
    $('#mapsButton').classList.remove('hidden');
    launchConfetti();
  } else {
    if (iconNode) {
      iconNode.textContent = '💙';
      iconNode.style.background = 'rgba(239, 47, 131, 0.2)';
      iconNode.style.color = '#ef2f83';
    }
    if (eyebrowNode) eyebrowNode.textContent = 'RESPUESTA REGISTRADA';
    $('#successTitle').textContent = `¡Qué lástima que no puedas acompañarnos, ${firstName(state.guest.name)}!`;
    $('#successText').textContent = 'Lamentamos mucho que no puedas asistir en esta oportunidad. ¡Esperamos reencontrarnos muy pronto en un próximo evento de Universal Assistance!';

    if (qrBoxNode) qrBoxNode.classList.add('hidden');
    if (downloadBtnNode) downloadBtnNode.classList.add('hidden');
    if ($('#whatsappShareButton')) $('#whatsappShareButton').classList.add('hidden');
    $('#calendarButton').classList.add('hidden');
    $('#mapsButton').classList.add('hidden');
  }

  applyAnsweredState(state.guest.status);
  successNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showFormMessage(message, isError) {
  const node = $('#formMessage');
  node.textContent = message;
  node.classList.remove('hidden', 'form-message--error', 'form-message--success');
  node.classList.add(isError ? 'form-message--error' : 'form-message--success');
}

function clearFormMessage() {
  const node = $('#formMessage');
  node.textContent = '';
  node.classList.add('hidden');
  node.classList.remove('form-message--error', 'form-message--success');
}

function showError(message) {
  $('#loadingState').classList.add('hidden');
  $('#invitation').classList.add('hidden');
  $('#errorState').classList.remove('hidden');
  $('#errorMessage').textContent = message;
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

function escapeIcs(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

function initCountdown() {
  const targetDate = new Date('2026-08-27T20:00:00-03:00').getTime();

  function update() {
    const now = Date.now();
    const distance = targetDate - now;

    const dNode = $('#countDays');
    const hNode = $('#countHours');
    const mNode = $('#countMins');
    const sNode = $('#countSecs');

    if (distance <= 0) {
      if (dNode) dNode.textContent = '00';
      if (hNode) hNode.textContent = '00';
      if (mNode) mNode.textContent = '00';
      if (sNode) sNode.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (dNode) dNode.textContent = String(days).padStart(2, '0');
    if (hNode) hNode.textContent = String(hours).padStart(2, '0');
    if (mNode) mNode.textContent = String(minutes).padStart(2, '0');
    if (sNode) sNode.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
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
      p.vy += 0.4; // Gravity
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

  requestAnimationFrame(animate);
}

function downloadVipPass() {
  if (!state.guest) return;

  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 560;
  const ctx = canvas.getContext('2d');

  // Fondo exterior oscuro
  ctx.fillStyle = '#071938';
  ctx.fillRect(0, 0, 1000, 560);

  // Gradiente interno azul marino / índigo / noche
  const grad = ctx.createLinearGradient(0, 0, 1000, 560);
  grad.addColorStop(0, '#071938');
  grad.addColorStop(0.5, '#0d2c60');
  grad.addColorStop(1, '#321c54');

  // Coordenadas de la forma del ticket
  const tx = 30, ty = 30, tw = 940, th = 500;
  const notchX = 660, notchR = 20, cornerR = 20;

  function drawTicketShape(c) {
    c.beginPath();
    c.moveTo(tx + cornerR, ty);
    c.lineTo(notchX - notchR, ty);
    c.arc(notchX, ty, notchR, Math.PI, 0, true);
    c.lineTo(tx + tw - cornerR, ty);
    c.arcTo(tx + tw, ty, tx + tw, ty + cornerR, cornerR);
    c.lineTo(tx + tw, ty + th - cornerR);
    c.arcTo(tx + tw, ty + th, tx + tw - cornerR, ty + th, cornerR);
    c.lineTo(notchX + notchR, ty + th);
    c.arc(notchX, ty + th, notchR, 0, Math.PI, true);
    c.lineTo(tx + cornerR, ty + th);
    c.arcTo(tx, ty + th, tx, ty + th - cornerR, cornerR);
    c.lineTo(tx, ty + cornerR);
    c.arcTo(tx, ty, tx + cornerR, ty, cornerR);
    c.closePath();
  }

  // Rellenar forma del ticket
  drawTicketShape(ctx);
  ctx.fillStyle = grad;
  ctx.fill();

  // Borde neón deslumbrante
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Línea de troquelado vertical punteada (Perforation line)
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(notchX, ty + notchR + 4);
  ctx.lineTo(notchX, ty + th - notchR - 4);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // -------------------------------------------------------------
  // CUERPO PRINCIPAL DEL TICKET (IZQUIERDA)
  // -------------------------------------------------------------

  // Encabezado Marca UA & Zurich (Tipografía Vectorial Limpia e Impecable)
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px Inter, sans-serif';
  ctx.fillText('UNIVERSAL ASSISTANCE', 65, 82);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 13px Inter, sans-serif';
  ctx.fillText('A COMPANY OF ZURICH · ASISTENCIA AL VIAJERO', 65, 108);

  // Línea divisoria
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.moveTo(65, 135);
  ctx.lineTo(625, 135);
  ctx.stroke();

  // Título del evento
  ctx.fillStyle = '#ff7be7';
  ctx.font = '900 13px Inter, sans-serif';
  ctx.fillText('FUNCIÓN DE CINE EXCLUSIVA', 65, 175);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px Inter, sans-serif';
  ctx.fillText('COYOTE VS ACME', 65, 230);

  // Datos del invitado
  const guestName = state.guest.name || 'Invitado Especial';
  const seats = Number(state.guest.totalSeats || 1);
  const seatsText = seats > 1 ? `Acceso para ${seats} personas (Vos + 1)` : 'Acceso individual';

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 13px Inter, sans-serif';
  ctx.fillText('INVITADO ESPECIAL', 65, 280);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px Inter, sans-serif';
  ctx.fillText(guestName, 65, 320);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = '600 17px Inter, sans-serif';
  ctx.fillText(seatsText, 65, 355);

  // Detalles del evento
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 13px Inter, sans-serif';
  ctx.fillText('FECHA Y HORA:', 65, 415);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px Inter, sans-serif';
  ctx.fillText('Jueves 27 de Agosto · 20:00 hs', 65, 440);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 13px Inter, sans-serif';
  ctx.fillText('LUGAR:', 390, 415);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px Inter, sans-serif';
  ctx.fillText('Movie Montevideo Shopping', 390, 440);

  // Pie del cuerpo principal
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '700 11px monospace';
  ctx.fillText('UA CINEMA VIP PASS · VALIDO PARA 1 FUNCIÓN', 65, 490);

  // -------------------------------------------------------------
  // TALÓN DEL TICKET / CONTROL STUB (DERECHA)
  // -------------------------------------------------------------

  // Badge VIP en el talón
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(690, 60, 240, 38);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PASE VIP EXCLUSIVO', 810, 84);
  ctx.textAlign = 'left';

  // Código de entrada
  const code = state.guest.code || 'UA-DEMO-001';
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 12px Inter, sans-serif';
  ctx.fillText('CÓDIGO DE ENTRADA:', 690, 128);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px monospace';
  ctx.fillText(code, 690, 155);

  // Dibujar Código QR Nativo en el Talón
  const qrTarget = `https://ua-eventos-uy.web.app/coyote-vs-acme?i=${code}`;
  const pageQrImg = $('#successQrImage') || $('#ticketQrImage');

  let drawn = false;
  if (pageQrImg && pageQrImg.complete && pageQrImg.naturalWidth > 0) {
    try {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(720, 175, 180, 180);
      ctx.drawImage(pageQrImg, 725, 180, 170, 170);
      drawn = true;
    } catch (e) {
      console.warn('Canvas drawImage fallback:', e);
    }
  }

  if (!drawn) {
    drawNativeQrCode(ctx, 720, 175, 180, qrTarget);
  }

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ESCANEÁ EN BOLETERÍA', 810, 382);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '700 11px monospace';
  ctx.fillText(code, 770, 490);

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Pase-VIP-Universal-Assistance-${code}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    alert('No se pudo generar la imagen del pase. Guardá una captura de pantalla de esta página.');
  }
}

function drawNativeQrCode(ctx, x, y, size, text) {
  if (typeof QRCode !== 'undefined' && QRCode.drawToCanvas) {
    QRCode.drawToCanvas(ctx, x, y, size, text, '#0f172a', '#ffffff');
    return;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);
}

function initCloudMouseParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('ontouchstart' in window) return; // Skip on mobile/touch

  const clouds = [
    { el: document.querySelector('.cloud--one'),   speed: 0.025, invert: false },
    { el: document.querySelector('.cloud--two'),   speed: 0.04,  invert: true },
    { el: document.querySelector('.cloud--three'), speed: 0.015, invert: false }
  ].filter(c => c.el);

  if (!clouds.length) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let ticking = false;

  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetX = (e.clientX - cx) / cx; // -1 to 1
    targetY = (e.clientY - cy) / cy; // -1 to 1

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(animate);
    }
  });

  function animate() {
    // Smooth lerp towards target
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    clouds.forEach(({ el, speed, invert }) => {
      const factor = invert ? -1 : 1;
      const dx = currentX * speed * factor * window.innerWidth * 0.5;
      const dy = currentY * speed * factor * window.innerHeight * 0.3;
      el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
    });

    // Keep animating while not settled
    if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      requestAnimationFrame(animate);
    } else {
      ticking = false;
    }
  }
}




