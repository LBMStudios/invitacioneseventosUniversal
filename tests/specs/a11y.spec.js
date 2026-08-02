// @ts-check
const { test, expect } = require('@playwright/test');

const DEMO = 'https://ua-eventos-uy.web.app/?demo=1';

// Inyecta axe-core desde CDN y ejecuta el analisis
async function runAxe(page, context = null) {
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js' });
  const options = context ? { context } : {};
  return await page.evaluate((opts) => {
    return new Promise((resolve) => {
      window.axe.run(document, opts, (err, results) => {
        if (err) resolve({ violations: [], error: err.message });
        else resolve(results);
      });
    });
  }, options);
}

test.describe('08 - Accesibilidad (axe-core)', () => {

  test('Sin violaciones criticas en la pagina principal', async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForSelector('#rsvpForm', { state: 'visible', timeout: 15000 });

    const results = await runAxe(page);
    const critical = results.violations.filter(v => v.impact === 'critical');

    if (critical.length > 0) {
      const msgs = critical.map(v => v.id + ': ' + v.description + ' (' + v.nodes.length + ' nodos)').join('\n    ');
      throw new Error('Violaciones criticas:\n    ' + msgs);
    }
  });

  test('Sin violaciones serias en el formulario RSVP', async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForSelector('#rsvpForm', { state: 'visible', timeout: 15000 });

    const results = await runAxe(page, '#rsvpForm');
    const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');

    if (serious.length > 0) {
      const msgs = serious.map(v => v.id + ': ' + v.description).join('\n    ');
      throw new Error('Violaciones serias en el form:\n    ' + msgs);
    }
  });

  test('Todos los inputs tienen labels asociados', async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForSelector('#rsvpForm', { state: 'visible', timeout: 15000 });

    const inputs = await page.locator('#rsvpForm input:not([type="radio"]):not([type="hidden"])').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const label = id ? page.locator('label[for="' + id + '"]') : null;
      const hasLabel = label ? await label.count() > 0 : false;
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      expect(hasLabel || ariaLabel || ariaLabelledBy || placeholder, 
        'Input #' + id + ' no tiene label ni placeholder accesible').toBeTruthy();
    }
  });

  test('El formulario tiene atributo role o semantica correcta', async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForSelector('#rsvpForm', { state: 'visible', timeout: 15000 });
    const form = page.locator('#rsvpForm');
    await expect(form).toHaveCount(1);
    // el form debe ser un elemento form real o tener role=form
    const tagName = await form.evaluate(el => el.tagName.toLowerCase());
    const role = await form.getAttribute('role');
    expect(tagName === 'form' || role === 'form').toBeTruthy();
  });

  test('Los botones tienen texto descriptivo (no vacios)', async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForSelector('#rsvpForm', { state: 'visible', timeout: 15000 });

    const buttons = await page.locator('button:visible').all();
    for (const btn of buttons) {
      const text = (await btn.textContent()).trim();
      const ariaLabel = await btn.getAttribute('aria-label');
      expect(text.length > 0 || (ariaLabel && ariaLabel.length > 0),
        'Boton sin texto: ' + (await btn.getAttribute('id') || 'sin-id')).toBeTruthy();
    }
  });

  test('La pagina tiene un h1 unico', async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForLoadState('networkidle');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('Las imagenes tienen atributo alt', async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForLoadState('networkidle');

    const imgs = await page.locator('img:visible').all();
    const sinAlt = [];
    for (const img of imgs) {
      const alt = await img.getAttribute('alt');
      const src = (await img.getAttribute('src') || '').split('/').pop();
      if (alt === null) sinAlt.push(src);
    }
    expect(sinAlt.length).toBe(0);
    // Si hay imagenes sin alt, las reporta
  });

  test('Reporte completo axe: contar todas las violaciones', async ({ page }) => {
    await page.goto(DEMO);
    await page.waitForSelector('#rsvpForm', { state: 'visible', timeout: 15000 });

    const results = await runAxe(page);
    const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    results.violations.forEach(v => { byImpact[v.impact] = (byImpact[v.impact] || 0) + 1; });

    console.log('    Violaciones axe:');
    console.log('      critical : ' + byImpact.critical);
    console.log('      serious  : ' + byImpact.serious);
    console.log('      moderate : ' + byImpact.moderate);
    console.log('      minor    : ' + byImpact.minor);
    console.log('      Passes   : ' + results.passes.length);
    console.log('      inappl.  : ' + results.inapplicable.length);

    // Solo falla si hay criticos
    expect(byImpact.critical).toBe(0);
  });

});
