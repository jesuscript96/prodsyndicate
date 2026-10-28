'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { SPRITE_FRAMES as FRAMES, spriteFrame as frameStyle, spriteUrl } from './sprite';
import './props.css';

/**
 * Profundidad: objetos 3D (por defecto, piezas del universo del hero de la home: cristal, tarjeta,
 * hoja, anillo, cubo) flotan por los márgenes de las secciones que envuelve, a distintas profundidades. Las lejanas son pequeñas,
 * lentas, desenfocadas y van por detrás del texto; las cercanas, grandes y nítidas, pasan por
 * delante pero solo por el borde. Todas giran con el scroll (hoja de sprites de 48 frames, 8 × 6).
 */

type Item = {
  /** Hoja de sprites en public/props/<prop>/sheet.webp */
  prop: string;
  /** Posición vertical (0..1 del alto del contenedor) y horizontal (% del ancho; centro de la pieza) */
  y: number;
  x: number;
  /** 1 = cercana (grande, rápida, nítida, por delante en los márgenes) · 0 = lejana */
  depth: number;
  size: number;
  phase: number;
  mobile: boolean;
};

const HOME_PROPS = ['float-glass', 'float-ring', 'float-card', 'float-cube', 'float-sheet'] as const;
const DEPTHS = [0.95, 0.35, 0.6, 1, 0.45, 0.88, 0.3, 0.7];
const FRONT = 0.85;
/** Recorrido vertical máximo del parallax (px) para una pieza de profundidad 1 */
const TRAVEL = 600;

/**
 * Reparto determinista: alterna lados y cicla profundidades y objetos a partir de `seed`, para
 * que cada bloque tenga su propia composición. El objeto ocupa ~la mitad de su celda, de ahí los
 * tamaños.
 */
function makeItems(count: number, seed: number, props: readonly string[], scale: number): Item[] {
  return Array.from({ length: count }, (_, k) => {
    const i = k + seed;
    const depth = DEPTHS[i % DEPTHS.length]!;
    const left = i % 2 === 0;
    const jitter = Math.sin(i * 12.9898) * 0.5; // −0.5..0.5, estable entre renders
    const inset = depth >= FRONT ? 2.5 : 6 + (1 - depth) * 3;
    return {
      prop: props[(i * 3) % props.length]!,
      y: (k + 0.5 + jitter * 0.6) / count,
      x: left ? inset : 100 - inset,
      depth,
      size: Math.round((150 + depth * 190) * scale),
      phase: (i * 0.37) % 1,
      mobile: i % 3 === 0,
    };
  });
}


export function DepthField({
  count,
  seed = 0,
  props = HOME_PROPS,
  scale = 1,
  children,
}: {
  count: number;
  seed?: number;
  /** Objetos que flotan (nombres de hoja de sprites) */
  props?: readonly string[];
  /** Escala de tamaño (los objetos que llenan más su celda van con menos) */
  scale?: number;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const items = makeItems(count, seed, props, scale);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const nodes = [...el.querySelectorAll<HTMLElement>('[data-depth-item]')];
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            onUpdate: (self) => {
              const y = window.scrollY;
              for (const n of nodes) {
                const depth = Number(n.dataset.depth);
                const phase = Number(n.dataset.phase);
                // Parallax: las cercanas se desplazan más; todas "suben" más despacio que el contenido
                const shift = (self.progress - 0.5) * -TRAVEL * depth;
                n.style.transform = `translate3d(0, ${shift}px, 0)`;
                n.style.backgroundPosition = frameStyle(y / (26 - depth * 10) + phase * FRAMES);
              }
            },
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [count, seed, props, scale] },
  );

  const layer = (front: boolean) => (
    <div className={`depth__layer depth__layer--${front ? 'front' : 'back'}`} aria-hidden="true">
      {items
        .filter((it) => it.depth >= FRONT === front)
        .map((it, i) => (
          <span
            key={i}
            data-depth-item=""
            data-depth={it.depth}
            data-phase={it.phase}
            data-mobile={it.mobile ? 'true' : 'false'}
            className="depth__item"
            style={
              {
                top: `${+(it.y * 100).toFixed(2)}%`,
                left: `${it.x}%`,
                '--size': `${it.size}px`,
                '--fade': (0.45 + it.depth * 0.55).toFixed(2),
                '--blur': `${((1 - it.depth) * 3.2).toFixed(1)}px`,
                backgroundImage: `url(${spriteUrl(it.prop)})`,
                backgroundPosition: frameStyle(it.phase * FRAMES),
              } as CSSProperties
            }
          />
        ))}
    </div>
  );

  return (
    <div ref={root} className="depth">
      {layer(false)}
      {children}
      {layer(true)}
    </div>
  );
}
