'use client';

import { useRef } from 'react';
import type { ProcessPhase, SectionCopy } from '@/content/company';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { SplitReveal } from '@/components/ui/split-reveal';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { AccentTitle } from './accent-title';
import './company.css';

type Labels = { objective: string; weDo: string; youGet: string; weNeed: string };

type Props = {
  n?: string;
  copy: SectionCopy;
  phases: readonly ProcessPhase[];
  labels: Labels;
};

/**
 * Timeline ampliada (§8.5): en escritorio el titular queda fijo a la izquierda y las fases
 * se desplazan a la derecha con una línea de progreso ligada al scroll (scrub). En móvil,
 * lista vertical sin animación de línea. Respeta prefers-reduced-motion.
 */
export function ProcessTimeline({ n, copy, phases, labels }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const list = el.querySelector<HTMLElement>('[data-ptl-list]');
      const fill = el.querySelector<HTMLElement>('[data-ptl-fill]');
      const items = gsap.utils.toArray<HTMLElement>('[data-ptl-phase]', el);
      if (!list || !fill) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: '(min-width: 900px)',
          motionOk: '(prefers-reduced-motion: no-preference)',
        },
        (ctx) => {
          const { desktop, motionOk } = ctx.conditions ?? {};
          if (!desktop || !motionOk) {
            // Móvil o reduced-motion: lista vertical estática, todo activo
            gsap.set(fill, { scaleY: 1 });
            items.forEach((item) => item.classList.add('is-active'));
            return;
          }
          gsap.fromTo(
            fill,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: { trigger: list, start: 'top 55%', end: 'bottom 55%', scrub: true },
            },
          );
          items.forEach((item) => {
            ScrollTrigger.create({
              trigger: item,
              start: 'top 55%',
              onEnter: () => item.classList.add('is-active'),
              onLeaveBack: () => item.classList.remove('is-active'),
            });
          });
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="ptl">
      <div className="ptl__head">
        <SectionLabel n={n}>{copy.label}</SectionLabel>
        <SplitReveal as="h2" id="process-timeline-title" className="h2">
          <AccentTitle parts={copy.title} />
        </SplitReveal>
        {copy.intro && (
          <Reveal as="p" className="body-l max-w-[40ch] text-ink-2" delay={0.1}>
            {copy.intro}
          </Reveal>
        )}
      </div>

      <ol className="ptl__list" data-ptl-list>
        <span className="ptl__track" aria-hidden="true">
          <span className="ptl__fill" data-ptl-fill />
        </span>
        {phases.map((phase) => (
          <li key={phase.n} className="ptl__phase" data-ptl-phase>
            <div className="ptl__top">
              <span className="ptl__n" aria-hidden="true">
                {phase.n}
              </span>
              <h3 className="h3 ptl__title">
                <span className="sr-only">Fase {phase.n}: </span>
                {phase.title}
              </h3>
              <p className="ptl__text body-l">{phase.text}</p>
            </div>
            <ul className="ptl__details">
              <li className="ptl__detail">
                <span className="label">{labels.objective}</span>
                <p>{phase.objective}</p>
              </li>
              <li className="ptl__detail">
                <span className="label">{labels.weDo}</span>
                <p>{phase.weDo}</p>
              </li>
              <li className="ptl__detail">
                <span className="label">{labels.youGet}</span>
                <p>{phase.youGet}</p>
              </li>
              <li className="ptl__detail">
                <span className="label">{labels.weNeed}</span>
                <p>{phase.weNeed}</p>
              </li>
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
