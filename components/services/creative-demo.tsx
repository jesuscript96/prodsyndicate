'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { Chip } from '@/components/ui/chip';
import { LinkArrow } from '@/components/ui/link-arrow';
import './creative-demo.css';

/**
 * Mini-demo del servicio "Productos creativos" (§8.3.4): una losa 3D con capas en
 * profundidad que se inclina hacia el puntero (puntero fino) y gira con el scroll.
 * Solo transform/opacity; con prefers-reduced-motion queda en una pose fija.
 */
export function CreativeDemo({ className }: { className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const scene = root.querySelector<HTMLElement>('.cdemo__scene');
      const scroller = root.querySelector<HTMLElement>('.cdemo__scroll');
      const card = root.querySelector<HTMLElement>('.cdemo__card');
      const glow = root.querySelector<HTMLElement>('.cdemo__glow');
      const layers = gsap.utils.toArray<HTMLElement>('.cdemo__layer', root);
      if (!scene || !scroller || !card) return;

      const depth = (i: number) => 24 + i * 22;

      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          fine: '(pointer: fine)',
        },
        (ctx) => {
          const { fine } = ctx.conditions as { fine: boolean };

          gsap.set(card, { rotateX: 10, rotateY: -12, transformPerspective: 1200 });
          layers.forEach((l, i) => gsap.set(l, { z: depth(i) }));

          // Scroll: la pieza gira suavemente mientras atraviesa el viewport.
          gsap.fromTo(
            scroller,
            { rotateY: -10, rotateX: 4 },
            {
              rotateY: 10,
              rotateX: -4,
              ease: 'none',
              scrollTrigger: { trigger: scene, start: 'top 85%', end: 'bottom 15%', scrub: 0.6 },
            },
          );

          if (!fine) return;

          // Puntero: inclinación hacia el cursor + parallax de las capas + brillo.
          const rx = gsap.quickTo(card, 'rotateX', { duration: 0.6, ease: 'power3.out' });
          const ry = gsap.quickTo(card, 'rotateY', { duration: 0.6, ease: 'power3.out' });
          const glowX = glow ? gsap.quickTo(glow, 'xPercent', { duration: 0.6, ease: 'power3.out' }) : null;
          const glowY = glow ? gsap.quickTo(glow, 'yPercent', { duration: 0.6, ease: 'power3.out' }) : null;
          const layerX = layers.map((l) => gsap.quickTo(l, 'x', { duration: 0.7, ease: 'power3.out' }));
          const layerY = layers.map((l) => gsap.quickTo(l, 'y', { duration: 0.7, ease: 'power3.out' }));

          const onMove = (e: PointerEvent) => {
            const r = scene.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            ry(px * 26);
            rx(-py * 20);
            glowX?.(px * 60);
            glowY?.(py * 60);
            layers.forEach((_, i) => {
              layerX[i](px * depth(i) * 0.35);
              layerY[i](py * depth(i) * 0.35);
            });
          };
          const onEnter = () => {
            if (glow) gsap.to(glow, { opacity: 1, duration: 0.4, ease: 'power2.out' });
          };
          const onLeave = () => {
            rx(10);
            ry(-12);
            glowX?.(0);
            glowY?.(0);
            layers.forEach((_, i) => {
              layerX[i](0);
              layerY[i](0);
            });
            if (glow) gsap.to(glow, { opacity: 0, duration: 0.5, ease: 'power2.out' });
          };

          scene.addEventListener('pointermove', onMove);
          scene.addEventListener('pointerenter', onEnter);
          scene.addEventListener('pointerleave', onLeave);
          return () => {
            scene.removeEventListener('pointermove', onMove);
            scene.removeEventListener('pointerenter', onEnter);
            scene.removeEventListener('pointerleave', onLeave);
          };
        },
      );

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(card, { rotateX: 10, rotateY: -12, transformPerspective: 1200 });
        layers.forEach((l, i) => gsap.set(l, { z: depth(i) }));
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <figure ref={ref} className={cn('cdemo', className)}>
      <div className="cdemo__scene" aria-hidden="true">
        <div className="cdemo__scroll">
          <div className="cdemo__card">
            <span className="cdemo__glow" />
            <div className="cdemo__top cdemo__layer">
              <span className="label">Lanzamiento</span>
              <Chip live>En directo</Chip>
            </div>
            <p className="cdemo__title cdemo__layer">
              Tu producto, con <em className="accent-word text-accent">movimiento</em>.
            </p>
            <svg className="cdemo__wave cdemo__layer" viewBox="0 0 320 48" fill="none" aria-hidden="true">
              <path
                d="M2 30c20-28 40-28 60 0s40 28 60 0 40-28 60 0 40 28 60 0 40-28 60 0"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="cdemo__badge cdemo__layer">
              <Chip tone="outline">Capítulo 01</Chip>
            </span>
            <span className="cdemo__coin cdemo__layer" />
          </div>
        </div>
      </div>
      <figcaption className="cdemo__hint">
        <span className="cdemo__hint-fine">Mueve el puntero sobre la tarjeta: responde en 3D y gira al hacer scroll.</span>
        <span className="cdemo__hint-coarse">Haz scroll: la tarjeta gira en 3D a medida que avanzas.</span>
        <LinkArrow href="/" className="text-ink">
          Ver el hero de la home
        </LinkArrow>
      </figcaption>
    </figure>
  );
}
