import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: false },
};

const LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Proyectos', href: '/proyectos' },
  { label: 'Contacto', href: '/contacto' },
] as const;

/**
 * Trazo a lápiz coherente con el logo y el hero: sube desde abajo a la izquierda,
 * empieza a cerrar un bucle y se detiene antes de llegar al punto ultramar.
 * `pathLength=1` normaliza el dash: la fracción final de `stroke-dashoffset`
 * es la parte que queda sin dibujar.
 */
const SKETCH = 'M 24 272 C 120 268 180 180 236 120 C 290 64 350 48 400 72 C 440 92 444 150 412 176 C 380 202 330 196 318 160';
const DOT = { cx: 318, cy: 160 };

/* Estilos propios de la 404 (página autocontenida). Respeta prefers-reduced-motion. */
const css = `
.nf-sketch { width: 100%; max-width: 480px; height: auto; color: var(--ink); }
.nf-sketch__line { stroke-dasharray: 1; stroke-dashoffset: 1; animation: nf-draw 1.6s var(--ease-out-expo) 0.4s forwards; }
.nf-sketch__dot { opacity: 0; transform: scale(0.6); transform-box: fill-box; transform-origin: center; animation: nf-pop 0.5s var(--ease-out-expo) 1.8s forwards; }
@keyframes nf-draw { to { stroke-dashoffset: 0.14; } }
@keyframes nf-pop { to { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) {
  .nf-sketch__line { animation: none; stroke-dashoffset: 0.14; }
  .nf-sketch__dot { animation: none; opacity: 1; transform: none; }
}
`;

/** §8.13 — 404: H1 y texto de la guía, línea de lápiz incompleta y cuatro salidas. `noindex`. */
export default function NotFound() {
  return (
    <section className="page-hero pb-[var(--section-y)]" aria-labelledby="not-found-title">
      <div className="wrap grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="grid gap-6">
          <p className="label">Error 404</p>
          <h1 id="not-found-title" className="display-l max-w-[14ch]">
            Esta página no existe (<em className="accent-word text-accent">todavía</em>).
          </h1>
          <p className="body-l max-w-[44ch] text-ink-2">Quizá el enlace cambió o nunca estuvo. Prueba por aquí:</p>
          <nav aria-label="Páginas sugeridas" className="flex flex-wrap gap-3 pt-2">
            {LINKS.map((link, i) => (
              <Button
                key={link.href}
                href={link.href}
                variant={i === 0 ? 'primary' : 'secondary'}
                arrow={i === 0}
                analytics={{ location: 'not-found', label: link.label }}
              >
                {link.label}
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex justify-center lg:justify-end">
          <svg className="nf-sketch" viewBox="0 0 480 320" width="480" height="320" aria-hidden="true" focusable="false">
            <path
              className="nf-sketch__line"
              d={SKETCH}
              pathLength={1}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle className="nf-sketch__dot" cx={DOT.cx} cy={DOT.cy} r="7" fill="var(--accent)" />
          </svg>
        </div>
      </div>
      <style>{css}</style>
    </section>
  );
}
