'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import './sections.css';

type Props = {
  /** `idea`: trazos de una idea que despega · `business`: paneles y flujos conectados */
  variant: 'idea' | 'business';
  className?: string;
};

/**
 * Ilustración de línea abstracta (trazos a lápiz, sin logos) que se dibuja con
 * stroke-dashoffset al entrar en el viewport (§6.9 sección 2). Decorativa:
 * aria-hidden. Cada trazo lleva pathLength="100" para que el CSS pueda fijar el
 * estado inicial (dasharray/dashoffset 100) sin medir longitudes.
 */
export function LineIllustration({ variant, className }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg) return;
      const strokes = svg.querySelectorAll<SVGElement>('[data-draw]');
      if (!strokes.length) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          strokes,
          { strokeDashoffset: 100 },
          {
            strokeDashoffset: 0,
            duration: 1.6,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: svg, start: 'top 80%', once: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [variant] },
  );

  return (
    <svg
      ref={ref}
      className={cn('line-illo', className)}
      viewBox="0 0 480 360"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {variant === 'idea' ? <IdeaStrokes /> : <BusinessStrokes />}
    </svg>
  );
}

/* Una idea que despega: órbita imperfecta, curva ascendente, destellos y notas. */
function IdeaStrokes() {
  return (
    <g>
      {/* Órbita a lápiz (trazo + repaso tenue) */}
      <path data-draw pathLength={100} opacity={0.8} d="M250 70C330 60 400 120 395 190C390 265 320 310 245 305C165 300 105 240 112 170C118 100 180 70 250 70" />
      <path data-draw pathLength={100} opacity={0.3} d="M262 78C338 72 392 132 388 198" />
      {/* Tarjeta esbozada dentro de la órbita */}
      <path data-draw pathLength={100} opacity={0.6} d="M205 150L300 146L303 220L208 224Z" />
      <path data-draw pathLength={100} opacity={0.45} d="M222 172L282 170" />
      <path data-draw pathLength={100} opacity={0.45} d="M222 190L266 189" />
      {/* Curva ascendente con punta de flecha */}
      <path data-draw pathLength={100} opacity={0.9} d="M60 300C140 290 170 220 215 190C260 160 300 170 350 120C375 95 395 75 420 58" />
      <path data-draw pathLength={100} opacity={0.9} d="M394 58L422 56L416 84" />
      {/* Destellos */}
      <path data-draw pathLength={100} opacity={0.7} d="M120 60L120 42M96 72L82 60M144 72L158 60" />
      <path data-draw pathLength={100} opacity={0.5} d="M90 96L72 98M150 96L168 98" />
      {/* Notas al pie y un punto */}
      <path data-draw pathLength={100} opacity={0.5} d="M48 330L112 330M48 346L92 346" />
      <path data-draw pathLength={100} opacity={0.7} d="M336 250a4 4 0 1 0 8 0a4 4 0 1 0-8 0" />
    </g>
  );
}

/* Un negocio en marcha: tres paneles, flujos que los conectan y una línea de tiempo. */
function BusinessStrokes() {
  return (
    <g>
      {/* Panel principal con cabecera y rayado */}
      <path data-draw pathLength={100} opacity={0.85} d="M62 92Q62 72 82 72L196 70Q216 70 216 90L218 176Q218 196 198 196L82 198Q62 198 62 178Z" />
      <path data-draw pathLength={100} opacity={0.5} d="M84 100L160 99" />
      <path data-draw pathLength={100} opacity={0.4} d="M84 126L190 124M84 146L170 145M84 166L150 165" />
      {/* Panel superior derecho con barras */}
      <path data-draw pathLength={100} opacity={0.85} d="M292 60Q292 44 308 44L414 42Q430 42 430 58L432 126Q432 142 416 142L308 144Q292 144 292 128Z" />
      <path data-draw pathLength={100} opacity={0.55} d="M318 118L318 96M342 118L342 78M366 118L366 104M390 118L390 66" />
      {/* Panel inferior derecho con líneas */}
      <path data-draw pathLength={100} opacity={0.85} d="M292 190Q292 174 308 174L414 172Q430 172 430 188L432 256Q432 272 416 272L308 274Q292 274 292 258Z" />
      <path data-draw pathLength={100} opacity={0.45} d="M318 210L400 208M318 236L380 235" />
      {/* Flujos que conectan los paneles y nodo */}
      <path data-draw pathLength={100} opacity={0.8} d="M218 134L254 134L254 94L292 94" />
      <path data-draw pathLength={100} opacity={0.8} d="M254 134L254 224L292 224" />
      <path data-draw pathLength={100} opacity={0.8} d="M250 134a4 4 0 1 0 8 0a4 4 0 1 0-8 0" />
      {/* Línea de tiempo con marcas */}
      <path data-draw pathLength={100} opacity={0.5} d="M48 320L432 318" />
      <path data-draw pathLength={100} opacity={0.5} d="M110 312L110 326M206 311L206 325M302 310L302 324M398 309L398 323" />
    </g>
  );
}
