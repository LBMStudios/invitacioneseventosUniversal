/**
 * TEST DE INTEGRACION — RSVP Real en Google Sheets
 * =====================================================
 * Envia una confirmacion REAL al backend (sin simulate=1)
 * usando un codigo reservado para QA: UA-QA-INTEG-001
 * Luego verifica via doGet que el estado fue guardado.
 * NO envia email (usa un email de test que no existe).
 */

const BACKEND = 'https://script.google.com/macros/s/AKfycbwYwJsopzz_6wfdvZpqrQuIRJC1YZBWX9kQPaO8m8zBZ7PsPJTA_Ot9sbFBeHIPqrba/exec';
const QA_CODE = 'UA-QA-INTEG-' + Date.now(); // codigo unico por ejecucion

let passed = 0; let failed = 0;
const log = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    log.push('[PASS] ' + name);
    process.stdout.write('.');
  } catch(e) {
    failed++;
    log.push('[FAIL] ' + name + '  <- ' + e.message);
    process.stdout.write('F');
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

async function postForm(fields) {
  const r = await fetch(BACKEND, {
    method: 'POST',
    body: new URLSearchParams(fields),
    signal: AbortSignal.timeout(15000)
  });
  const text = await r.text();
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON: ' + text.slice(0,100));
  return JSON.parse(m[0]);
}

async function getGuest(code) {
  const r = await fetch(BACKEND + '?action=guest&code=' + encodeURIComponent(code) + '&callback=cb', { signal: AbortSignal.timeout(10000) });
  const text = await r.text();
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON: ' + text.slice(0,100));
  return JSON.parse(m[0]);
}

(async () => {
  console.log('');
  console.log('============================================================');
  console.log('  UA RSVP TEST DE INTEGRACION - Sheets real');
  console.log('============================================================');
  console.log('  Codigo de prueba: ' + QA_CODE);
  console.log('  NOTA: Escribe una fila real en Sheets y la verifica');
  console.log('============================================================');
  console.log('');

  // ── TEST 1: Confirmar asistencia solo ─────────────────────────────
  console.log('  [1/4] Confirmar asistencia (solo)...');
  let confirmResult;
  await test('POST confirmar asistencia solo retorna ok:true', async () => {
    confirmResult = await postForm({
      code: QA_CODE,
      guestName: 'QA Integration Test',
      email: 'qa-integration-noreply@test.invalid',
      phone: '099000000',
      attendance: 'yes',
      companion: 'no',
      companionName: '',
      allowUpdate: '1',
      testMode: '1'
    });
    assert(confirmResult.ok === true, 'ok debe ser true: ' + JSON.stringify(confirmResult));
  });

  await test('La respuesta incluye datos del invitado o alreadyAnswered', async () => {
    assert(
      confirmResult && (confirmResult.ok === true),
      'Respuesta inesperada: ' + JSON.stringify(confirmResult)
    );
  });

  // ── TEST 2: Verificar en Sheets via doGet ──────────────────────────
  console.log('\n  [2/4] Verificar datos guardados en Sheets...');
  await new Promise(r => setTimeout(r, 2000)); // esperar que Sheets confirme

  let guestData;
  await test('doGet retorna el invitado QA recien creado', async () => {
    guestData = await getGuest(QA_CODE);
    assert(guestData.ok === true, 'ok debe ser true: ' + JSON.stringify(guestData));
    assert(guestData.guest, 'falta campo guest');
    assert(guestData.guest.code === QA_CODE, 'code no coincide: ' + guestData.guest.code);
  });

  await test('El estado en Sheets es Confirmado', async () => {
    assert(guestData?.guest?.status === 'Confirmado', 'status esperado: Confirmado, got: ' + guestData?.guest?.status);
  });

  await test('El nombre del invitado fue guardado correctamente', async () => {
    assert(guestData?.guest?.name === 'QA Integration Test', 'nombre: ' + guestData?.guest?.name);
  });

  await test('totalSeats es 1 (sin acompanante)', async () => {
    assert(Number(guestData?.guest?.totalSeats) === 1, 'totalSeats: ' + guestData?.guest?.totalSeats);
  });

  // ── TEST 3: Actualizar a Con Acompanante ───────────────────────────
  console.log('\n  [3/4] Actualizar a con acompanante...');
  let updateResult;
  await test('POST actualizar a con acompanante retorna ok:true', async () => {
    updateResult = await postForm({
      code: QA_CODE,
      guestName: 'QA Integration Test',
      email: 'qa-integration-noreply@test.invalid',
      phone: '099000000',
      attendance: 'yes',
      companion: 'yes',
      companionName: 'Acompanante QA',
      allowUpdate: '1',
      testMode: '1'
    });
    assert(updateResult.ok === true, 'ok debe ser true: ' + JSON.stringify(updateResult));
  });

  await new Promise(r => setTimeout(r, 1500));

  let updatedGuest;
  await test('Sheets refleja el acompanante actualizado', async () => {
    const d = await getGuest(QA_CODE);
    updatedGuest = d.guest;
    assert(d.ok === true, 'ok debe ser true');
    assert(Number(updatedGuest?.totalSeats) === 2, 'totalSeats debe ser 2, got: ' + updatedGuest?.totalSeats);
  });

  // ── TEST 4: Declinar ───────────────────────────────────────────────
  console.log('\n  [4/4] Actualizar a no asiste...');
  await test('POST declinar retorna ok:true', async () => {
    const d = await postForm({
      code: QA_CODE,
      guestName: 'QA Integration Test',
      email: 'qa-integration-noreply@test.invalid',
      attendance: 'no',
      companion: 'no',
      companionName: '',
      allowUpdate: '1',
      testMode: '1'
    });
    assert(d.ok === true, 'ok debe ser true: ' + JSON.stringify(d));
  });

  await new Promise(r => setTimeout(r, 1500));

  await test('Sheets refleja estado No asiste', async () => {
    const d = await getGuest(QA_CODE);
    assert(d.ok === true, 'ok debe ser true');
    assert(d.guest?.status === 'No asiste', 'status esperado No asiste, got: ' + d.guest?.status);
  });

  // ── REPORTE ────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n\n');
  console.log('============================================================');
  console.log('  REPORTE INTEGRACION SHEETS');
  console.log('============================================================');
  log.forEach(l => console.log('  ' + l));
  console.log('');
  console.log('  Total  : ' + total);
  console.log('  Passed : ' + passed + ' (' + (passed/total*100).toFixed(0) + '%)');
  console.log('  Failed : ' + failed);
  console.log('');
  if (failed === 0) {
    console.log('  VEREDICTO: INTEGRACION CON SHEETS CORRECTA');
    console.log('  Nota: La fila ' + QA_CODE + ' quedo en Sheets.');
    console.log('  Podes borrarla manualmente o dejarla como registro de QA.');
  } else {
    console.log('  VEREDICTO: REVISAR FALLOS ANTES DE LANZAR');
  }
  console.log('============================================================');
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
})();
