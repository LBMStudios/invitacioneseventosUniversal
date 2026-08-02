/**
 * UA RSVP - Suite de QA Automatizado
 * Testea todos los endpoints del backend y valida respuestas
 */

const BACKEND = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';
const SITE    = 'https://ua-eventos-uy.web.app';

let passed = 0, failed = 0, total = 0;
const results = [];

async function test(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    results.push({ name, status: 'PASS', error: null });
    process.stdout.write('.');
  } catch (e) {
    failed++;
    results.push({ name, status: 'FAIL', error: e.message });
    process.stdout.write('F');
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const text = await r.text();
  // puede venir como JSONP: callback({...})
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response: ' + text.slice(0, 100));
  return JSON.parse(match[0]);
}

async function postForm(fields) {
  const body = new URLSearchParams(fields);
  const r = await fetch(BACKEND, {
    method: 'POST', body,
    signal: AbortSignal.timeout(12000)
  });
  const text = await r.text();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response: ' + text.slice(0, 100));
  return JSON.parse(match[0]);
}

(async () => {
  console.log('');
  console.log('============================================================');
  console.log('  UA RSVP QA AUTOMATIZADO — ' + new Date().toLocaleString('es-UY'));
  console.log('============================================================');
  console.log('');

  // ── BLOQUE 1: Health check ──────────────────────────────────────────
  console.log('  [1/7] Health check...');

  await test('Health check responde OK', async () => {
    const d = await getJson(BACKEND + '?action=health&callback=cb');
    assert(d.ok === true, 'ok debe ser true, got: ' + JSON.stringify(d));
    assert(d.service === 'UA RSVP', 'service incorrecto: ' + d.service);
    assert(d.timestamp, 'falta timestamp');
  });

  // ── BLOQUE 2: Cargar invitado demo ──────────────────────────────────
  console.log('\n  [2/7] Carga de invitado...');

  await test('Invitado demo UA-DEMO-001 retorna datos', async () => {
    const d = await getJson(BACKEND + '?action=guest&code=UA-DEMO-001&callback=cb');
    assert(d.ok === true, 'ok debe ser true: ' + JSON.stringify(d));
    assert(d.guest, 'falta campo guest');
    assert(d.event, 'falta campo event');
    assert(d.guest.code === 'UA-DEMO-001', 'code incorrecto: ' + d.guest.code);
    assert(d.event.date, 'falta event.date');
    assert(d.event.venue, 'falta event.venue');
  });

  await test('Invitado inexistente retorna error manejable', async () => {
    const d = await getJson(BACKEND + '?action=guest&code=CODIGO-FALSO-XYZ&callback=cb');
    // Debe retornar ok:false con error, no explotar
    assert(d.ok === false || d.guest, 'debe retornar ok:false o datos de invitado');
  });

  await test('doGet sin parametros retorna error controlado', async () => {
    const d = await getJson(BACKEND + '?callback=cb');
    assert(typeof d.ok !== 'undefined', 'debe tener campo ok');
  });

  // ── BLOQUE 3: Simulate RSVP (sin escritura real) ────────────────────
  console.log('\n  [3/7] Submit RSVP (simulate=1)...');

  await test('Confirmar asistencia solo (simulate)', async () => {
    const d = await postForm({
      code: 'UA-QA-TEST-001', guestName: 'QA Tester', email: 'qa@test.com',
      attendance: 'yes', companion: 'no', companionName: '',
      allowUpdate: '1', simulate: '1'
    });
    assert(d.ok === true, 'ok debe ser true: ' + JSON.stringify(d));
    assert(d.simulated === true, 'debe marcar simulated:true');
    assert(d.status === 'Confirmado', 'status debe ser Confirmado: ' + d.status);
  });

  await test('Confirmar con acompañante (simulate)', async () => {
    const d = await postForm({
      code: 'UA-QA-TEST-002', guestName: 'QA Tester Pair', email: 'qa2@test.com',
      attendance: 'yes', companion: 'yes', companionName: 'Companion QA',
      allowUpdate: '1', simulate: '1'
    });
    assert(d.ok === true, 'ok debe ser true: ' + JSON.stringify(d));
    assert(d.status === 'Confirmado', 'status incorrecto: ' + d.status);
  });

  await test('Declinar asistencia (simulate)', async () => {
    const d = await postForm({
      code: 'UA-QA-TEST-003', guestName: 'QA No Asiste', email: 'qa3@test.com',
      attendance: 'no', companion: 'no', companionName: '',
      allowUpdate: '1', simulate: '1'
    });
    assert(d.ok === true, 'ok debe ser true: ' + JSON.stringify(d));
    assert(d.status === 'No asiste', 'status debe ser No asiste: ' + d.status);
  });

  await test('Simulate retorna timestamp valido', async () => {
    const d = await postForm({
      code: 'UA-QA-TEST-004', guestName: 'QA Timestamp', email: 'qa4@test.com',
      attendance: 'yes', companion: 'no', simulate: '1'
    });
    assert(d.timestamp, 'falta timestamp');
    const ts = new Date(d.timestamp);
    assert(!isNaN(ts.getTime()), 'timestamp invalido: ' + d.timestamp);
  });

  // ── BLOQUE 4: Validaciones del backend ──────────────────────────────
  console.log('\n  [4/7] Validaciones de input...');

  await test('POST sin attendance invalida retorna error', async () => {
    const d = await postForm({
      code: 'UA-QA-TEST-005', guestName: 'QA Error', email: 'qa5@test.com',
      attendance: 'INVALIDO', companion: 'no'
    });
    assert(d.ok === false, 'debe fallar con attendance invalido, got: ' + JSON.stringify(d));
  });

  // ── BLOQUE 5: Firebase Hosting ──────────────────────────────────────
  console.log('\n  [5/7] Firebase Hosting...');

  await test('index.html responde 200', async () => {
    const r = await fetch(SITE, { signal: AbortSignal.timeout(10000) });
    assert(r.status === 200, 'status: ' + r.status);
  });

  await test('app.js carga correctamente', async () => {
    const r = await fetch(SITE + '/app.js?v=ua-20260801-v57', { signal: AbortSignal.timeout(10000) });
    assert(r.status === 200, 'app.js status: ' + r.status);
    const text = await r.text();
    assert(text.includes('BACKEND_URL'), 'app.js no contiene BACKEND_URL');
    assert(text.includes('submitHiddenForm'), 'app.js no contiene submitHiddenForm');
    assert(text.includes('downloadVipPass'), 'app.js no contiene downloadVipPass');
    assert(!text.includes('waitForSavedResponse'), 'app.js aun contiene el polling! (debe estar eliminado)');
  });

  await test('styles.css carga correctamente', async () => {
    const r = await fetch(SITE + '/styles.css?v=ua-20260801-v57', { signal: AbortSignal.timeout(10000) });
    assert(r.status === 200, 'styles.css status: ' + r.status);
  });

  await test('qrcode.min.js carga correctamente', async () => {
    const r = await fetch(SITE + '/qrcode.min.js?v=ua-20260801-v57', { signal: AbortSignal.timeout(10000) });
    assert(r.status === 200, 'qrcode.min.js status: ' + r.status);
  });

  await test('Logo UA existe', async () => {
    const r = await fetch(SITE + '/assets/logo-ua-white.png', { signal: AbortSignal.timeout(10000) });
    assert(r.status === 200, 'logo status: ' + r.status);
  });

  await test('Logo Movie existe', async () => {
    const r = await fetch(SITE + '/assets/logo-movie-white.svg', { signal: AbortSignal.timeout(10000) });
    assert(r.status === 200, 'movie logo status: ' + r.status);
  });

  // ── BLOQUE 6: HTML estructura ──────────────────────────────────────
  console.log('\n  [6/7] Estructura HTML...');

  await test('index.html contiene elementos criticos', async () => {
    const r = await fetch(SITE, { signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const checks = [
      ['id="rsvpForm"',       'formulario RSVP'],
      ['id="submitButton"',   'boton de submit'],
      ['id="successState"',   'pantalla de exito'],
      ['id="downloadPassButton"', 'boton descargar entrada'],
      ['id="ticketQrImage"',  'imagen QR del ticket'],
      ['id="mapsModal"',      'modal de mapas'],
      ['id="submissionFrame"','iframe oculto de envio'],
      ['id="countDays"',      'contador de dias'],
    ];
    for (const [selector, desc] of checks) {
      assert(html.includes(selector), 'Falta elemento: ' + desc + ' (' + selector + ')');
    }
  });

  await test('index.html NO incluye html2canvas (eliminado)', async () => {
    const r = await fetch(SITE, { signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    assert(!html.includes('html2canvas'), 'html2canvas sigue en el HTML (debe estar eliminado)');
  });

  await test('Meta tags OG presentes', async () => {
    const r = await fetch(SITE, { signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    assert(html.includes('og:title'), 'falta og:title');
    assert(html.includes('og:description'), 'falta og:description');
    assert(html.includes('og:image'), 'falta og:image');
  });

  // ── BLOQUE 7: Latencia del backend ─────────────────────────────────
  console.log('\n  [7/7] Latencia del backend...');

  await test('Health check responde en menos de 3s', async () => {
    const t0 = Date.now();
    await getJson(BACKEND + '?action=health&callback=cb');
    const ms = Date.now() - t0;
    assert(ms < 3000, 'demoro ' + ms + 'ms (limite: 3000ms)');
  });

  await test('Simulate RSVP responde en menos de 2s', async () => {
    const t0 = Date.now();
    await postForm({ code: 'UA-LATENCY-TEST', guestName: 'Latency', email: 'lat@t.com', attendance: 'yes', companion: 'no', simulate: '1' });
    const ms = Date.now() - t0;
    assert(ms < 2000, 'demoro ' + ms + 'ms (limite: 2000ms)');
  });

  // ── REPORTE FINAL ───────────────────────────────────────────────────
  console.log('\n\n');
  console.log('============================================================');
  console.log('  REPORTE QA AUTOMATIZADO');
  console.log('============================================================');

  const maxLen = Math.max(...results.map(r => r.name.length));
  results.forEach(r => {
    const icon = r.status === 'PASS' ? 'PASS' : 'FAIL';
    const pad  = r.name.padEnd(maxLen + 2, '.');
    const err  = r.error ? '  <- ' + r.error : '';
    console.log('  [' + icon + '] ' + pad + err);
  });

  console.log('');
  console.log('  Total  : ' + total);
  console.log('  Passed : ' + passed + ' (' + (passed/total*100).toFixed(0) + '%)');
  console.log('  Failed : ' + failed);
  console.log('');

  if (failed === 0) {
    console.log('  VEREDICTO: SISTEMA APTO PARA PRODUCCION');
  } else if (failed <= 2) {
    console.log('  VEREDICTO: REVISAR ' + failed + ' CASO(S) ANTES DE LANZAR');
  } else {
    console.log('  VEREDICTO: PROBLEMAS CRITICOS DETECTADOS - NO LANZAR');
  }
  console.log('============================================================');
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
})();
