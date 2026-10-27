import { expect, test, type Page } from '@playwright/test';

// Los radios y checkboxes nativos están ocultos visualmente (pointer-events: none):
// el usuario pulsa su <label>, así que el test hace lo mismo.
test.setTimeout(90_000);

async function choose(page: Page, role: 'radio' | 'checkbox', name: RegExp) {
  const input = page.getByRole(role, { name });
  const label = page.locator('label').filter({ has: input });
  if (await label.count()) await label.first().click();
  else await input.check({ force: true });
  await expect(input).toBeChecked();
}

/**
 * /contacto (§14.3): el asistente de 6 pasos envía el lead contra una API simulada.
 * Se usan roles y etiquetas reales (radios, checkboxes, labels), no selectores internos.
 */

async function fillUntilLastStep(page: Page) {
  // Paso 1 · ¿Quién eres?
  await expect(page.getByRole('heading', { level: 2, name: '¿Quién eres?' })).toBeVisible();
  await choose(page, 'radio', /emprendedor/i);
  await page.getByRole('button', { name: /siguiente/i }).click();

  // Paso 2 · ¿Qué necesitas? (multi)
  await expect(page.getByRole('heading', { level: 2, name: '¿Qué necesitas?' })).toBeVisible();
  await choose(page, 'checkbox', /^mvp$/i);
  await choose(page, 'checkbox', /automatización e ia/i);
  await page.getByRole('button', { name: /siguiente/i }).click();

  // Paso 3 · ¿En qué punto estás?
  await expect(page.getByRole('heading', { level: 2, name: '¿En qué punto estás?' })).toBeVisible();
  await choose(page, 'radio', /solo una idea/i);
  await page.getByRole('button', { name: /siguiente/i }).click();

  // Paso 4 · ¿Plazos y presupuesto?
  await expect(page.getByRole('heading', { level: 2, name: '¿Plazos y presupuesto?' })).toBeVisible();
  await choose(page, 'radio', /1–3 meses/i);
  await choose(page, 'radio', /prefiero comentarlo/i);
  await page.getByRole('button', { name: /siguiente/i }).click();

  // Paso 5 · Cuéntanos más
  await expect(page.getByRole('heading', { level: 2, name: 'Cuéntanos más' })).toBeVisible();
  await page.getByLabel(/tu mensaje/i).fill('Quiero validar una idea con un MVP en pocas semanas.');
  await page.getByLabel(/enlaces de referencia/i).fill('https://example.com');
  await page.getByRole('button', { name: /siguiente/i }).click();

  // Paso 6 · ¿Cómo te contactamos?
  await expect(page.getByRole('heading', { level: 2, name: '¿Cómo te contactamos?' })).toBeVisible();
  await page.getByLabel(/^nombre/i).fill('Ada Lovelace');
  await page.getByLabel(/^email/i).fill('ada@example.com');
  await choose(page, 'checkbox', /política de privacidad/i);
}

test('contacto: el asistente envía el lead (API simulada)', async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  await page.route('**/api/contact', async (route) => {
    bodies.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ json: { ok: true } });
  });

  await page.goto('/contacto');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cuéntanos tu idea');

  await fillUntilLastStep(page);
  await page.getByRole('button', { name: /^enviar$/i }).click();

  await expect(page.getByText(/recibido/i)).toBeVisible();
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toMatchObject({
    audience: 'emprendedor',
    needs: ['mvp', 'automatizacion-ia'],
    stage: 'idea',
    timeline: '1-3-meses',
    budget: 'prefiero-comentarlo',
    links: ['https://example.com'],
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    consent: true,
    website: '',
  });
  expect(bodies[0]).toHaveProperty('turnstileToken');
});

test('contacto: validación en línea por paso y foco en el error', async ({ page }) => {
  await page.goto('/contacto');
  await page.getByRole('button', { name: /siguiente/i }).click();

  await expect(page.getByRole('alert').filter({ hasText: /elige una opción/i })).toBeVisible();
  // Sigue en el paso 1 y el foco está en la primera opción del grupo con error.
  await expect(page.getByRole('heading', { level: 2, name: '¿Quién eres?' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /emprendedor/i })).toBeFocused();
});

test('contacto: error del servidor con mensaje claro y sin perder lo escrito', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({ status: 500, json: { ok: false, error: 'server' } }));

  await page.goto('/contacto');
  await fillUntilLastStep(page);
  await page.getByRole('button', { name: /^enviar$/i }).click();

  await expect(page.getByRole('alert').filter({ hasText: /no hemos podido enviarlo/i })).toBeVisible();
  await expect(page.getByLabel(/^nombre/i)).toHaveValue('Ada Lovelace');
  await expect(page.getByLabel(/^email/i)).toHaveValue('ada@example.com');
});

test('contacto: el borrador sobrevive a una recarga (sessionStorage)', async ({ page }) => {
  await page.goto('/contacto');
  await choose(page, 'radio', /empresa/i);
  await page.getByRole('button', { name: /siguiente/i }).click();
  await expect(page.getByRole('heading', { level: 2, name: '¿Qué necesitas?' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 2, name: '¿Qué necesitas?' })).toBeVisible();
  await page.getByRole('button', { name: /atrás/i }).click();
  await expect(page.getByRole('radio', { name: /empresa/i })).toBeChecked();
});

test('contacto: el bloque de agenda existe como destino de /contacto#agenda', async ({ page }) => {
  await page.goto('/contacto#agenda');
  const agenda = page.locator('#agenda');
  await expect(agenda).toBeVisible();
  await expect(agenda.getByRole('heading', { level: 2 })).toHaveText('¿Prefieres hablar?');
});
