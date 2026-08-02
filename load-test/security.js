/**
 * TEST DE SEGURIDAD BASICA — UA RSVP
 * Verifica headers HTTP, CORS, y resistencia a inputs maliciosos
 */

const BACKEND = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';
const SITE    = 'https://ua-eventos-uy.web.app';

let passed = 0; let failed = 0;
const log = [];

async function test(name, fn) {
  try { await fn(); passed++; log.push('[PASS] ' + name); process.stdout.write('.'); }
  catch(e) { failed++; log.push('[FAIL] ' + name + '  <- ' + e.message); process.stdout.write('F'); }
}
function assert(c, m) { if (!c) throw new Error(m || 'fail'); }

async function postForm(fields) {
  const r = await fetch(BACKEND, { method:'POST', body: new URLSearchParams(fields), signal: AbortSignal.timeout(12000) });
  const text = await r.text();
  const m = text.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : { raw: text };
}

(async () => {
  console.log('\n============================================================');
  console.log('  UA RSVP TEST DE SEGURIDAD');
  console.log('============================================================\n');

  // ── 1. Headers de seguridad Firebase Hosting ─────────────────────
  console.log('  [1/4] Headers HTTP de seguridad...');

  await test('Responde HTTPS (no HTTP plain)', async () => {
    const r = await fetch(SITE, { signal: AbortSignal.timeout(10000) });
    assert(r.url.startsWith('https://'), 'URL no es HTTPS: ' + r.url);
  });

  await test('Header X-Content-Type-Options presente', async () => {
    const r = await fetch(SITE, { signal: AbortSignal.timeout(10000) });
    const h = r.headers.get('x-content-type-options');
    assert(h === 'nosniff', 'x-content-type-options: ' + h + ' (esperado: nosniff)');
  });

  await test('No expone Server header con version', async () => {
    const r = await fetch(SITE, { signal: AbortSignal.timeout(10000) });
    const server = r.headers.get('server') || '';
    assert(!server.match(/apache\/\d|nginx\/\d|iis\/\d/i), 'Server header expone version: ' + server);
  });

  // ── 2. XSS: inputs con scripts no deben ejecutarse ───────────────
  console.log('\n  [2/4] Resistencia a XSS (inputs maliciosos)...');

  await test('Input XSS en guestName no rompe el backend', async () => {
    const d = await postForm({
      code: 'UA-SEC-XSS-001',
      guestName: '<script>alert(1)</script>',
      email: 'sec@test.com',
      attendance: 'yes',
      companion: 'no',
      simulate: '1'
    });
    assert(typeof d.ok !== 'undefined', 'backend no respondio JSON valido');
  });

  await test('Input XSS en companionName no rompe el backend', async () => {
    const d = await postForm({
      code: 'UA-SEC-XSS-002',
      guestName: 'Test',
      email: 'sec@test.com',
      attendance: 'yes',
      companion: 'yes',
      companionName: '"><img src=x onerror=alert(1)>',
      simulate: '1'
    });
    assert(typeof d.ok !== 'undefined', 'backend no respondio JSON valido');
  });

  await test('Input SQL injection en code no rompe el backend', async () => {
    const d = await postForm({
      code: "'; DROP TABLE invitados; --",
      guestName: 'SQL Test',
      email: 'sql@test.com',
      attendance: 'yes',
      companion: 'no',
      simulate: '1'
    });
    assert(typeof d.ok !== 'undefined', 'backend no respondio JSON valido');
  });

  // ── 3. Validacion de inputs ───────────────────────────────────────
  console.log('\n  [3/4] Validacion de inputs criticos...');

  await test('Attendance invalido retorna ok:false', async () => {
    const d = await postForm({ code: 'UA-SEC-VAL', guestName: 'x', attendance: 'HACK', companion: 'no' });
    assert(d.ok === false, 'debia rechazar attendance invalido, got: ' + JSON.stringify(d));
  });

  await test('POST vacio retorna error controlado (no 500 crudo)', async () => {
    const r = await fetch(BACKEND, { method:'POST', body: new URLSearchParams({}), signal: AbortSignal.timeout(10000) });
    const text = await r.text();
    assert(text.length > 0, 'respuesta vacia');
    assert(!text.toLowerCase().includes('traceback') && !text.toLowerCase().includes('exception at'), 'expone stack trace: ' + text.slice(0,200));
  });

  await test('Codigo muy largo (1000 chars) no rompe el backend', async () => {
    const d = await postForm({
      code: 'A'.repeat(1000),
      guestName: 'Long Test',
      attendance: 'yes',
      companion: 'no',
      simulate: '1'
    });
    assert(typeof d.ok !== 'undefined', 'backend no respondio con JSON valido');
  });

  // ── 4. HTTPS y contenido mixto ────────────────────────────────────
  console.log('\n  [4/4] Contenido seguro...');

  await test('HTML no tiene recursos en HTTP plano', async () => {
    const r = await fetch(SITE, { signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const httpLinks = (html.match(/src="http:\/\//g) || []).concat(html.match(/href="http:\/\//g) || []);
    assert(httpLinks.length === 0, 'Encontrados ' + httpLinks.length + ' recursos HTTP no-seguro');
  });

  await test('El backend no expone datos internos en errores', async () => {
    const r = await fetch(BACKEND + '?action=ACCION_INVALIDA&callback=cb', { signal: AbortSignal.timeout(10000) });
    const text = await r.text();
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      const json = JSON.parse(m[0]);
      const errMsg = (json.error || '').toLowerCase();
      assert(!errMsg.includes('spreadsheetid') && !errMsg.includes('script') && !errMsg.includes('at line'), 'error expone internals: ' + json.error);
    }
  });

  // ── REPORTE ───────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n\n============================================================');
  console.log('  REPORTE SEGURIDAD');
  console.log('============================================================');
  log.forEach(l => console.log('  ' + l));
  console.log('');
  console.log('  Total  : ' + total + '  |  Passed: ' + passed + '  |  Failed: ' + failed);
  console.log('');
  if (failed === 0) {
    console.log('  VEREDICTO: SIN VULNERABILIDADES CRITICAS DETECTADAS');
  } else if (failed <= 2) {
    console.log('  VEREDICTO: REVISAR ' + failed + ' PUNTO(S) ANTES DE LANZAR');
  } else {
    console.log('  VEREDICTO: PROBLEMAS DE SEGURIDAD - REVISAR ANTES DE LANZAR');
  }
  console.log('============================================================\n');
  process.exit(failed > 0 ? 1 : 0);
})();
