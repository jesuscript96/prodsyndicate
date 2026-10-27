import { expect, test, type Locator } from '@playwright/test';

/**
 * Navegación (§14.4): header de escritorio y mega-menú, hoja móvil, 404 real y
 * enlace para saltar al contenido. Los proyectos vienen de playwright.config.ts:
 * `chromium` (Desktop Chrome, ≥ 900 px: enlaces visibles) y `mobile` (Pixel 7: burger).
 */

const MAIN_LINKS = ['Proyectos', 'Proceso', 'Nosotros', 'Blog'] as const;
const CTA = 'Cuéntanos tu idea';

/** Radix abre el mega-menú al pasar el ratón (con retardo); si no, al pulsar. */
async function openMegaMenu(trigger: Locator) {
  await trigger.hover();
  try {
    await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout: 1500 });
  } catch {
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  }
}

test.describe('header de escritorio', () => {
  test('muestra Servicios, los enlaces principales y el CTA', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Solo en viewport de escritorio');

    await page.goto('/');
    const header = page.getByRole('banner');

    await expect(header.getByRole('button', { name: 'Servicios' })).toBeVisible();
    for (const name of MAIN_LINKS) {
      await expect(header.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await expect(header.getByRole('link', { name: CTA })).toBeVisible();
    await expect(header.getByRole('link', { name: CTA })).toHaveAttribute('href', '/contacto');
  });

  test('el menú Servicios lleva a /servicios/mvp', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Solo en viewport de escritorio');

    await page.goto('/');
    const header = page.getByRole('banner');
    const trigger = header.getByRole('button', { name: 'Servicios' });

    await openMegaMenu(trigger);

    const mvp = header.getByRole('link', { name: /MVP para emprendedores/ });
    await expect(mvp).toBeVisible();
    await mvp.click();

    // En desarrollo Next compila la ruta en la primera visita: margen amplio
    await expect(page).toHaveURL(/\/servicios\/mvp$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  });
});

test.describe('menú móvil', () => {
  test('abre la hoja, muestra los enlaces y se cierra con Escape', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Solo en el proyecto móvil');

    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir menú' }).click();

    const sheet = page.getByRole('dialog', { name: 'Menú de navegación' });
    await expect(sheet).toBeVisible();

    await expect(sheet.getByRole('link', { name: /^Servicios/ })).toBeVisible();
    await expect(sheet.getByRole('link', { name: /MVP para emprendedores/ })).toHaveAttribute('href', '/servicios/mvp');
    for (const name of MAIN_LINKS) {
      await expect(sheet.getByRole('link', { name: new RegExp(`^${name}`) })).toBeVisible();
    }
    await expect(sheet.getByRole('link', { name: CTA })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Cerrar menú' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
  });
});

test('una ruta inexistente devuelve 404 y muestra la página de error', async ({ page }) => {
  const response = await page.goto('/esta-ruta-no-existe');
  expect(response?.status()).toBe(404);

  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toContainText('no existe');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Inicio', exact: true })).toBeVisible();
});

test('existe el enlace "Saltar al contenido"', async ({ page }) => {
  await page.goto('/');
  const skip = page.getByRole('link', { name: 'Saltar al contenido' });
  await expect(skip).toHaveCount(1);
  await expect(skip).toHaveAttribute('href', '#contenido');
  await expect(page.locator('main#contenido')).toHaveCount(1);
});
