'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import './sections.css';

/**
 * Línea de tiempo del proceso (§6.9 sección 6). Los hijos son <li class="timeline__step">.
 * La línea vertical se rellena con scaleY ligado al scroll; cada paso se ilumina
 * (clase .is-active) al cruzar el 55 % del viewport y se apaga al volver atrás.
 */
export function ProcessTimeline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const fill = root.querySelector<HTMLElement>('[data-fill]');
      const list = root.querySelector<HTMLElement>('[data-steps]');
      if (!fill || !list) return;
      const steps = Array.from(list.children) as HTMLElement[];
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            transformOrigin: 'top center',
            scrollTrigger: { trigger: list, start: 'top 55%', end: 'bottom 55%', scrub: true },
          },
        );
        steps.forEach((step) => {
          ScrollTrigger.create({
            trigger: step,
            start: 'top 55%',
            onEnter: () => step.classList.add('is-active'),
            onLeaveBack: () => step.classList.remove('is-active'),
          });
        });
        return () => steps.forEach((step) => step.classList.remove('is-active'));
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="timeline">
      <div className="timeline__line" aria-hidden="true">
        <span className="timeline__fill" data-fill />
      </div>
      <ol className="timeline__steps" data-steps>
        {children}
      </ol>
    </div>
  );
}
