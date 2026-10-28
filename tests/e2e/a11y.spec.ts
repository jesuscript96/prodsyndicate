import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accesibilidad automatizada (§12, §14.3): axe en cada ruta principal con las
 * reglas WCAG 2.x A/AA. Falla solo con violaciones `serious` o `critical`; el
 * resto se imprime como aviso para revisarlo a mano.
 *
 * Cada ruta se audita dos veces:
 *  - con `prefers-reduced-motion: reduce`: todas las reglas, incluido el contraste.
 *    Sin animaciones todo el texto debe estar fijo y legible.
 *  - con animaciones: todas las reglas salvo `color-contrast`, porque axe congela los
 *    estados intermedios de los revelados por scroll (palabras al 15 %, pasos atenuados
 *    hasta llegar a ellos, marcas del indicador de progreso), que son transitorios.
 */

const ROUTES = [
  '/',
  '/servicios',
  '/servicios/mvp',
  '/servicios/productos-creativos',
  '/proyectos',
  '/proceso',
  '/emprendedores',
  '/empresas',
  '/nosotros',
  '/blog',
  '/contacto',
  '/legal/privacidad',
] as const;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const BLOCKING = new Set(['serious', 'critical']);

type Violation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

const selectorsOf = (v: Violation) =>
  v.nodes.map((n) => n.target.map((t) => (Array.isArray(t) ? t.join(' ') : t)).join(' > '));

const describeViolation = (v: Violation) =>
  [`${v.id} [${v.impact ?? 'sin impacto'}] ${v.help}`, ...selectorsOf(v).map((s) => `    ${s}`)].join('\n');

const MODES = [
  { name: 'reduce-motion', reducedMotion: 'reduce' as const, disable: [] as string[] },
  { name: 'animado', reducedMotion: 'no-preference' as const, disable: ['color-contrast'] },
];

for (const mode of MODES) {
  test.describe(mode.name, () => {
    test.use({ reducedMotion: mode.reducedMotion });

    for (const route of ROUTES) {
      test(`axe · ${route}`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const results = await new AxeBuilder({ page }).withTags(TAGS).disableRules(mode.disable).analyze();

        const blocking = results.violations.filter((v) => v.impact && BLOCKING.has(v.impact));
        const minor = results.violations.filter((v) => !v.impact || !BLOCKING.has(v.impact));

        if (minor.length) {
          console.warn(`[axe] ${mode.name} ${route} · avisos (moderate/minor):\n${minor.map(describeViolation).join('\n')}`);
        }
        if (blocking.length) {
          console.error(`[axe] ${mode.name} ${route} · violaciones serious/critical:\n${blocking.map(describeViolation).join('\n\n')}`);
        }

        expect(
          blocking.map(describeViolation),
          `Violaciones serious/critical en ${route} (${mode.name}):\n${blocking.map(describeViolation).join('\n\n')}`,
        ).toEqual([]);
      });
    }
  });
}
