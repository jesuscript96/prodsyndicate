'use client';

import { useId, useRef, useState } from 'react';
import { categoryLabels } from '@/content/services';
import type { ProjectCategory, ProjectMeta } from '@/content/types';
import { Flip, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { ProjectCard } from '@/components/ui/project-card';
import './projects.css';

type Props = {
  /** Ordenados por `order` (getAllProjects) */
  projects: ProjectMeta[];
};

const CATEGORIES = Object.keys(categoryLabels) as ProjectCategory[];
const ITEM_SELECTOR = '.project-grid__item';

/** Anchos por hueco (7 / 5 / 5 / 7 de 12 columnas, ver projects.css) para `sizes` de next/image. */
const SIZES: Record<number, string> = {
  0: '(min-width: 1280px) 720px, (min-width: 900px) 56vw, 92vw',
  1: '(min-width: 1280px) 520px, (min-width: 900px) 40vw, 92vw',
  2: '(min-width: 1280px) 520px, (min-width: 900px) 40vw, 92vw',
  3: '(min-width: 1280px) 720px, (min-width: 900px) 56vw, 92vw',
};

/**
 * Índice de proyectos con filtros por categoría (chips con aria-pressed) y
 * reordenación animada con GSAP Flip (§8.4). Todos los proyectos permanecen en
 * el DOM: los filtrados se ocultan con `data-hidden` para que Flip pueda animar
 * entradas y salidas. Sin movimiento si `prefers-reduced-motion: reduce`.
 */
export function ProjectGrid({ projects }: Props) {
  const [active, setActive] = useState<ProjectCategory | null>(null);
  const labelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const allowMotion = useRef(false);
  const pendingState = useRef<Flip.FlipState | null>(null);

  // Preferencia de movimiento, viva (gsap.matchMedia): decide si se captura y anima el estado.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        allowMotion.current = true;
        return () => {
          allowMotion.current = false;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Tras cada cambio de filtro (layout effect): anima desde el estado capturado antes del render.
  useGSAP(
    () => {
      const state = pendingState.current;
      pendingState.current = null;
      if (!state) return;
      let leaving: Element[] = [];
      Flip.from(state, {
        duration: 0.7,
        ease: 'expo.out',
        stagger: 0.04,
        absolute: true,
        scale: true,
        onEnter: (els) =>
          gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }),
        onLeave: (els) => {
          leaving = els;
          return gsap.to(els, { opacity: 0, scale: 0.96, duration: 0.3, ease: 'power3.out' });
        },
        onComplete: () => {
          // Flip ya los ha devuelto a display:none; limpiamos la opacidad para cuando vuelvan a entrar
          if (leaving.length) gsap.set(leaving, { clearProps: 'opacity,scale' });
          ScrollTrigger.refresh();
        },
      });
    },
    { dependencies: [active], scope: root },
  );

  const select = (category: ProjectCategory | null) => {
    if (category === active) return;
    if (allowMotion.current && root.current) {
      pendingState.current = Flip.getState(root.current.querySelectorAll(ITEM_SELECTOR));
    }
    setActive(category);
  };

  let visible = 0;
  const items = projects.map((project) => {
    const shown = active === null || project.categories.includes(active);
    const slot = shown ? visible++ % 4 : null;
    return { project, shown, slot };
  });
  const count = visible;

  return (
    <div ref={root} className="grid gap-8">
      <div className="project-filter">
        <div className="project-filter__group" role="group" aria-labelledby={labelId}>
          <span id={labelId} className="label">
            Filtrar
          </span>
          <ul className="project-filter__list">
            <li>
              <button
                type="button"
                className="chip chip--outline project-filter__btn"
                aria-pressed={active === null}
                onClick={() => select(null)}
              >
                Todos
              </button>
            </li>
            {CATEGORIES.map((category) => (
              <li key={category}>
                <button
                  type="button"
                  className="chip chip--outline project-filter__btn"
                  aria-pressed={active === category}
                  onClick={() => select(category)}
                >
                  {categoryLabels[category]}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="label project-filter__count" aria-live="polite">
          {count === 1 ? '1 proyecto' : `${count} proyectos`}
          {active ? ` · ${categoryLabels[active]}` : ''}
        </p>
      </div>

      <ul className="project-grid" aria-label="Proyectos">
        {items.map(({ project, shown, slot }, i) => (
          <li
            key={project.slug}
            className="project-grid__item"
            data-slot={slot ?? undefined}
            data-hidden={shown ? undefined : ''}
            aria-hidden={shown ? undefined : true}
          >
            <ProjectCard project={project} sizes={SIZES[slot ?? 0]} priority={i === 0} headingLevel={2} />
          </li>
        ))}
      </ul>

      {count === 0 && <p className="project-grid-empty body-l">Todavía no hay casos en esta categoría.</p>}
    </div>
  );
}
