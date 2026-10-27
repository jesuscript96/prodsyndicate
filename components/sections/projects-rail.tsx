'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import './sections.css';

type Props = {
  /** Cabecera (etiqueta + H2 + enlace), renderizada en servidor */
  head: ReactNode;
  /** <li class="rail__item"> con ProjectCard */
  children: ReactNode;
};

/**
 * Rail horizontal de proyectos (§6.9 sección 5). Escritorio sin reduce-motion:
 * sección fijada (pin) y scroll vertical → desplazamiento horizontal con scrub
 * (código de la guía, invalidateOnRefresh). Móvil o reduce-motion: overflow-x
 * auto con scroll-snap (CSS); la clase .is-rail solo existe mientras hay pin.
 */
export function ProjectsRail({ head, children }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const scroller = scrollerRef.current;
      const rail = railRef.current;
      if (!section || !scroller || !rail) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        section.classList.add('is-rail');
        scroller.classList.add('is-rail');
        scroller.scrollLeft = 0;
        const gutter = () => parseFloat(getComputedStyle(scroller).paddingLeft) || 0;
        // Igual que la guía (rail.scrollWidth - innerWidth + 2 * 32) con el gutter real y sin la barra de scroll
        const dist = () => Math.max(0, rail.scrollWidth - document.documentElement.clientWidth + 2 * gutter());
        gsap.to(rail, {
          x: () => -dist(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${Math.max(1, dist())}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        return () => {
          section.classList.remove('is-rail');
          scroller.classList.remove('is-rail');
        };
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="proyectos" className="section rail-section" aria-labelledby="home-projects-title">
      <div className="wrap">{head}</div>
      <div ref={scrollerRef} className="rail-scroller">
        <ul ref={railRef} className="rail">
          {children}
        </ul>
      </div>
    </section>
  );
}
