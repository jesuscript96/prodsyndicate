'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
  /** Radio en px (20–28 según §5.4) */
  radius?: number;
  /** Escala inicial del contenido */
  scale?: number;
  style?: CSSProperties;
};

/** `clip-path: inset(8% round r)` → `inset(0)` + escala 1.06 → 1 (§5.6). El hijo directo es lo que escala. */
export function ImageReveal({ children, className, radius = 28, scale = 1.06, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const inner = el.firstElementChild as HTMLElement | null;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          defaults: { duration: 1.2, ease: 'expo.out' },
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
        tl.fromTo(el, { clipPath: `inset(8% round ${radius}px)` }, { clipPath: `inset(0% round ${radius}px)` }, 0);
        if (inner) tl.fromTo(inner, { scale }, { scale: 1 }, 0);
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [radius, scale] },
  );

  return (
    <div
      ref={ref}
      className={cn('image-reveal', className)}
      style={{ ...style, ['--r' as string]: `${radius}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}
