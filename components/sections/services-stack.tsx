'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import './sections.css';

/** Igual que en sections.css: top: calc(96px + i * 24px) */
const BASE_TOP = 96;
const STEP = 24;

/**
 * Pila de tarjetas sticky (§6.9 sección 4). Los hijos son <li class="svc-stack__item" style="--i">.
 * Escritorio: al apilarse, la tarjeta anterior baja a scale .96 / opacity .85 con scrub.
 * Móvil y reduce-motion: lista vertical normal (CSS).
 *
 * Las posiciones se calculan a partir de la posición natural de cada tarjeta
 * (alto acumulado dentro de la lista) y no de su rect, porque un elemento
 * sticky ya fijado daría medidas falsas en ScrollTrigger.refresh().
 */
export function ServicesStack({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const list = ref.current;
      if (!list) return;
      const items = Array.from(list.children) as HTMLElement[];
      if (items.length < 2) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const gap = () => parseFloat(getComputedStyle(list).rowGap) || 0;
        const listTop = () => list.getBoundingClientRect().top + window.scrollY;
        const naturalTop = (i: number) =>
          listTop() + items.slice(0, i).reduce((acc, el) => acc + el.offsetHeight + gap(), 0);

        items.slice(0, -1).forEach((item, i) => {
          const next = i + 1;
          const stickTop = BASE_TOP + next * STEP;
          gsap.fromTo(
            item,
            { scale: 1, opacity: 1 },
            {
              scale: 0.96,
              opacity: 0.85,
              ease: 'none',
              scrollTrigger: {
                trigger: list,
                // La siguiente tarjeta entra por el 90 % del viewport…
                start: () => naturalTop(next) - window.innerHeight * 0.9,
                // …y termina de apilarse cuando su borde superior llega a su top sticky
                end: () => naturalTop(next) - stickTop,
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <ol ref={ref} className="svc-stack">
      {children}
    </ol>
  );
}
