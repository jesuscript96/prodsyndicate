'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { SPRITE_FRAMES, spriteFrame, spriteUrl } from '@/components/props/sprite';
import './piece-sprite.css';

/**
 * Una pieza suelta del «&» de la escena de productos creativos (hoja de sprites de 48 frames),
 * que gira sobre sí misma al ritmo del scroll mientras cruza la pantalla. Decorativa.
 */
export function PieceSprite({ name, className, turns = 1, phase = 0 }: { name: string; className?: string; turns?: number; phase?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            el.style.backgroundPosition = spriteFrame((self.progress * turns + phase) * SPRITE_FRAMES);
          },
        });
      });
      return () => mm.revert();
    },
    { dependencies: [turns, phase] },
  );

  return (
    <span
      ref={ref}
      className={`piece-sprite ${className ?? ''}`}
      aria-hidden="true"
      style={{ backgroundImage: `url(${spriteUrl(name)})`, backgroundPosition: spriteFrame(phase * SPRITE_FRAMES) }}
    />
  );
}
