import { test, expect } from '@playwright/test';

/**
 * Home · hero con storytelling por scroll (§14.3).
 * El pin dura 450 % del viewport en escritorio y 320 % en móvil; el capítulo 01
 * está en reposo entre p 0.04 y 0.16, así que se desplaza ~0.4 × alto del viewport
 * (p ≈ 0.09 escritorio / 0.125 móvil) para que quede visible al terminar el scroll.
 */

test('home: H1 visible y el capítulo 01 aparece al hacer scroll', async ({ page }) => {
  await page.goto('/');

  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toContainText('productos digitales');
  await expect(page.locator('h1')).toHaveCount(1);

  const vh = page.viewportSize()?.height ?? 720;
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, Math.round(vh * 0.4));

  await expect(page.locator('[data-chapter="idea"]')).toBeVisible({ timeout: 5000 });
});

test('home: narrativa accesible y enlace para saltar la animación', async ({ page }) => {
  await page.goto('/');

  // Bloque sr-only con los 4 capítulos (existe aunque esté oculto visualmente)
  await expect(page.locator('section.hero .sr-only li')).toHaveCount(4);
  await expect(page.locator('section.hero canvas[role="img"]')).toHaveAttribute(
    'aria-label',
    /boceto/,
  );

  // El enlace "Saltar la animación" lleva al inicio del contenido
  const skip = page.getByRole('link', { name: 'Saltar la animación' });
  await expect(skip).toHaveAttribute('href', '#inicio-contenido');
  await expect(page.locator('#inicio-contenido')).toHaveCount(1);
});

test.describe('reduce motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('hero estático con capítulos visibles sin scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section.hero[data-static="true"]')).toBeVisible();
    await expect(page.locator('[data-chapter="lanzamiento"]')).toBeVisible();
  });
});
