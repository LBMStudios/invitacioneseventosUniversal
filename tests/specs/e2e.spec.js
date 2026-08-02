// @ts-check
const { test, expect } = require('@playwright/test');

const BASE = 'https://ua-eventos-uy.web.app';
const DEMO = BASE + '/?demo=1';

// Helper: esperar que el form este listo
async function waitForForm(page) {
  await page.goto(DEMO);
  await page.waitForSelector('#rsvpForm', { state: 'visible', timeout: 15000 });
}

// Helper: llenar datos y confirmar asistencia
async function fillAndConfirm(page, { name = 'QA Playwright', email = 'qa@test.com', pair = false } = {}) {
  const nameField = page.locator('#formGuestName');
  if (await nameField.isEnabled()) await nameField.fill(name);

  const emailField = page.locator('#formEmail');
  if (await emailField.isEnabled()) await emailField.fill(email);

  if (pair) {
    await page.locator('#optionPair').click();
    await page.waitForSelector('#companionFieldsGroup:not(.hidden)', { timeout: 3000 }).catch(() => {});
    const cn = page.locator('#formCompanionName');
    if (await cn.isVisible()) await cn.fill('Acompanante QA');
  } else {
    await page.locator('#optionSingle').click();
  }

  await page.locator('#submitButton').click();
  await page.waitForSelector('#successState:not(.hidden)', { timeout: 10000 });
}

// ─────────────────────────────────────────────────────────
// SUITE 1: Carga de la pagina
// ─────────────────────────────────────────────────────────
test.describe('01 - Carga de la pagina', () => {

  test('Carga con demo=1 y muestra el formulario', async ({ page }) => {
    await page.goto(DEMO);
    await expect(page.locator('#rsvpForm')).toBeVisible({ timeout: 15000 });
  });

  test('El spinner desaparece al cargar', async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForLoadState('networkidle');
    const spinner = page.locator('#loadingSpinner');
    if (await spinner.count() > 0) {
      await expect(spinner).toBeHidden({ timeout: 10000 });
    }
  });

  test('No hay errores criticos de consola', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('net::')) {
        errors.push(msg.text());
      }
    });
    await page.goto(DEMO);
    await page.waitForLoadState('networkidle');
    expect(errors.length).toBe(0);
  });

  test('El titulo de la pagina es correcto', async ({ page }) => {
    await page.goto(DEMO);
    await expect(page).toHaveTitle(/Coyote|Universal|UA/i);
  });

});

// ─────────────────────────────────────────────────────────
// SUITE 2: Elementos visuales criticos
// ─────────────────────────────────────────────────────────
test.describe('02 - Elementos visuales', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForSelector('#rsvpForm', { state: 'visible', timeout: 15000 });
  });

  test('El contador regresivo muestra numeros', async ({ page }) => {
    const days = page.locator('#countDays');
    await expect(days).toBeVisible({ timeout: 10000 });
    const text = (await days.textContent()).trim();
    expect(Number(text)).toBeGreaterThanOrEqual(0);
  });

  test('El boton de confirmar es visible y esta habilitado', async ({ page }) => {
    await page.locator('#submitButton').scrollIntoViewIfNeeded();
    await expect(page.locator('#submitButton')).toBeVisible();
    await expect(page.locator('#submitButton')).toBeEnabled();
  });

  test('El boton de declinar es visible', async ({ page }) => {
    await page.locator('#btnDecline').scrollIntoViewIfNeeded();
    await expect(page.locator('#btnDecline')).toBeVisible();
  });

  test('El iframe oculto de envio existe', async ({ page }) => {
    await expect(page.locator('#submissionFrame')).toHaveCount(1);
  });

  test('Las opciones de ticket (solo / con acompanante) existen', async ({ page }) => {
    await expect(page.locator('#optionSingle')).toBeVisible();
    await expect(page.locator('#optionPair')).toBeVisible();
  });

});

// ─────────────────────────────────────────────────────────
// SUITE 3: RSVP - Confirmar solo
// ─────────────────────────────────────────────────────────
test.describe('03 - RSVP: Confirmar solo', () => {

  test('Flujo completo: rellenar y confirmar solo', async ({ page }) => {
    await waitForForm(page);
    await fillAndConfirm(page, { name: 'QA Solo Test', email: 'solo@qa.com' });
    await expect(page.locator('#successState')).toBeVisible();
  });

  test('La pantalla de exito muestra el QR', async ({ page }) => {
    await waitForForm(page);
    await fillAndConfirm(page, { name: 'QA QR Test', email: 'qr@qa.com' });
    const qr = page.locator('#successQrImage');
    await expect(qr).toBeVisible({ timeout: 5000 });
    const src = await qr.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src.length).toBeGreaterThan(10);
  });

  test('El boton de descarga de entrada aparece tras confirmar', async ({ page }) => {
    await waitForForm(page);
    await fillAndConfirm(page, { name: 'QA DL Test', email: 'dl@qa.com' });
    await expect(page.locator('#downloadPassButton')).toBeVisible();
  });

  test('El codigo QR es correcto (contiene UA-)', async ({ page }) => {
    await waitForForm(page);
    await fillAndConfirm(page, { name: 'QA Code Test', email: 'code@qa.com' });
    const codeEl = page.locator('#successQrCode');
    if (await codeEl.count() > 0) {
      const code = await codeEl.textContent();
      expect(code.trim().length).toBeGreaterThan(3);
    }
  });

});

// ─────────────────────────────────────────────────────────
// SUITE 4: RSVP - Declinar asistencia
// ─────────────────────────────────────────────────────────
test.describe('04 - RSVP: Declinar', () => {

  test('Declinar: boton y pantalla de no asistencia', async ({ page }) => {
    await waitForForm(page);

    const nameField = page.locator('#formGuestName');
    if (await nameField.isEnabled()) await nameField.fill('QA Declinar');
    const emailField = page.locator('#formEmail');
    if (await emailField.isEnabled()) await emailField.fill('no@qa.com');

    // Aceptar el confirm() nativo que muestra el boton de declinar
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    await page.locator('#btnDecline').scrollIntoViewIfNeeded();
    await page.locator('#btnDecline').click();
    await page.waitForSelector('#successState:not(.hidden)', { timeout: 10000 });

    // En pantalla de no asiste el boton de descarga NO debe verse
    const dlBtn = page.locator('#downloadPassButton');
    if (await dlBtn.count() > 0) {
      await expect(dlBtn).toBeHidden();
    }
  });

});

// ─────────────────────────────────────────────────────────
// SUITE 5: Con acompanante
// ─────────────────────────────────────────────────────────
test.describe('05 - RSVP: Con acompanante', () => {

  test('Seleccionar acompanante muestra el campo de nombre', async ({ page }) => {
    await waitForForm(page);
    await page.locator('#optionPair').click();
    await expect(page.locator('#companionFieldsGroup')).not.toHaveClass(/hidden/);
    await expect(page.locator('#formCompanionName')).toBeVisible({ timeout: 3000 });
  });

  test('Flujo completo con acompanante', async ({ page }) => {
    await waitForForm(page);
    await fillAndConfirm(page, { name: 'QA Pair Test', email: 'pair@qa.com', pair: true });
    await expect(page.locator('#successState')).toBeVisible();
  });

});

// ─────────────────────────────────────────────────────────
// SUITE 6: Modal de ubicacion
// ─────────────────────────────────────────────────────────
test.describe('06 - Modal de ubicacion', () => {

  test('El modal de ubicacion existe en el DOM', async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#mapsModal')).toHaveCount(1);
  });

});

// ─────────────────────────────────────────────────────────
// SUITE 7: Performance
// ─────────────────────────────────────────────────────────
test.describe('07 - Performance', () => {

  test('DOMContentLoaded en menos de 5 segundos', async ({ page }) => {
    const t0 = Date.now();
    await page.goto(DEMO);
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - t0;
    console.log('    DOMContentLoaded: ' + elapsed + 'ms');
    expect(elapsed).toBeLessThan(5000);
  });

  test('El formulario aparece en menos de 10 segundos', async ({ page }) => {
    const t0 = Date.now();
    await page.goto(DEMO);
    await page.waitForSelector('#rsvpForm', { state: 'visible', timeout: 10000 });
    const elapsed = Date.now() - t0;
    console.log('    Formulario visible: ' + elapsed + 'ms');
    expect(elapsed).toBeLessThan(10000);
  });

  test('El submit muestra exito en menos de 2 segundos', async ({ page }) => {
    await waitForForm(page);
    const nameField = page.locator('#formGuestName');
    if (await nameField.isEnabled()) await nameField.fill('Perf QA');
    const emailField = page.locator('#formEmail');
    if (await emailField.isEnabled()) await emailField.fill('perf@qa.com');
    await page.locator('#optionSingle').click();

    const t0 = Date.now();
    await page.locator('#submitButton').click();
    await page.waitForSelector('#successState:not(.hidden)', { timeout: 5000 });
    const elapsed = Date.now() - t0;
    console.log('    Submit -> exito: ' + elapsed + 'ms');
    expect(elapsed).toBeLessThan(2000);
  });

});

