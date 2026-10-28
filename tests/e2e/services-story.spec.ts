import { expect, test } from '@playwright/test';

/**
 * Historias por scroll de las páginas de servicio (mismo motor que el hero de la home):
 * un único H1, la historia propia del servicio, capítulos que aparecen con el scroll y
 * versión estática completa con prefers-reduced-motion.
 */

const SERVICES = [
  { slug: 'mvp', h1: /MVP/, first: 'descubrimiento', last: 'lanzamiento' },
  { slug: 'software-a-medida', h1: /encaja/, first: 'analisis', last: 'en-uso' },
  { slug: 'automatizacion-ia', h1: /se hacen solos/, first: 'mapa', last: 'monitorizacion' },
  { slug: 'productos-creativos', h1: /identidad propia/, first: 'lienzo', last: 'publicacion' },
] as const;

for (const s of SERVICES) {
  test(`${s.slug}: historia propia con H1 único y capítulos al hacer scroll`, async ({ page }) => {
    await page.goto(`/servicios/${s.slug}`);
    const story = page.locator(`section.hero[data-story="${s.slug}"]`);
    await expect(story).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(s.h1);
    // El canvas termina dibujando su primer frame (la secuencia del servicio existe)
    await expect(story.locator('canvas')).toHaveAttribute('data-ready', 'true', { timeout: 20_000 });

    // Al hacer scroll aparece el primer capítulo
    await page.evaluate(() => {
      const y = innerHeight * 0.5;
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    });
    await expect(page.locator(`[data-chapter="${s.first}"]`)).toBeVisible({ timeout: 5000 });
  });

  test.describe('reduce motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test(`${s.slug}: versión estática con todos los capítulos`, async ({ page }) => {
      await page.goto(`/servicios/${s.slug}`);
      await expect(page.locator(`section.hero[data-story="${s.slug}"][data-static="true"]`)).toBeVisible();
      await expect(page.locator(`[data-chapter="${s.last}"]`)).toBeVisible();
    });
  });
}
