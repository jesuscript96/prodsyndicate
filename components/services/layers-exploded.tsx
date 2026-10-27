'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import './layers-exploded.css';

const LAYERS = ['Interfaz', 'Lógica', 'Datos', 'Automatización'] as const;
const GAP_Z = 84;

/**
 * Pila de 4 capas en CSS 3D que se separan con el scroll (§8.2). Solo transform.
 * Con prefers-reduced-motion las capas se muestran ya separadas, sin scrub.
 */
export function LayersExploded({ className }: { className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const stack = root.querySelector<HTMLElement>('.layers__stack');
      const layers = gsap.utils.toArray<HTMLElement>('.layers__layer', root);
      if (!stack || !layers.length) return;
      const last = layers.length - 1;

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(stack, { rotateX: 58, rotateZ: -32 });
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: root, start: 'top 75%', end: 'bottom 35%', scrub: true },
          })
          .fromTo(layers, { z: 0 }, { z: (i: number) => (last - i) * GAP_Z }, 0)
          .to(stack, { rotateZ: -22 }, 0);
      });
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(stack, { rotateX: 58, rotateZ: -22 });
        gsap.set(layers, { z: (i: number) => (last - i) * GAP_Z });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <figure ref={ref} className={cn('layers', className)} data-layers="">
      <div className="layers__stack">
        {LAYERS.map((label, i) => (
          <div key={label} className="layers__layer">
            <div className="layers__head">
              <span className="label">{label}</span>
              <span className="layers__index" aria-hidden="true">
                0{i + 1}
              </span>
            </div>
            <div className="layers__lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            {i === LAYERS.length - 1 && <span className="layers__dot" aria-hidden="true" />}
          </div>
        ))}
      </div>
      <figcaption className="sr-only">
        Las cuatro capas de un producto digital: interfaz, lógica, datos y automatización.
      </figcaption>
    </figure>
  );
}
