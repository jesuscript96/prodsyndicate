'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

/**
 * Barra fina de progreso de lectura (§5.6 `ScrollProgress`): `scaleX` 0 → 1
 * mientras se recorre el cuerpo del artículo. Solo anima `transform`.
 * Con `prefers-reduced-motion` no hay tween: el valor se fija en cada actualización.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = bar.current;
      const target = document.getElementById(targetId);
      if (!el || !target) return;

      const mm = gsap.matchMedia();
      const range = { trigger: target, start: 'top 75%', end: 'bottom bottom' } as const;

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            // Con Lenis activo no hace falta un segundo suavizado (§6.6b)
            scrollTrigger: { ...range, scrub: true },
          },
        );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        const st = ScrollTrigger.create({
          ...range,
          onUpdate: (self) => gsap.set(el, { scaleX: self.progress }),
        });
        return () => st.kill();
      });

      return () => mm.revert();
    },
    { dependencies: [targetId] },
  );

  return (
    <div className="reading-progress" aria-hidden="true">
      <div ref={bar} className="reading-progress__bar" />
    </div>
  );
}
