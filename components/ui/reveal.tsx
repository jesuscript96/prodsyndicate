'use client';

import { useRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

type Props<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  /** Retraso en segundos */
  delay?: number;
  /** Desplazamiento de entrada en px (nunca más de 40) */
  y?: number;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

/** Fade + y: 24 → 0, 700 ms, se dispara al 85 % del viewport, una sola vez (§5.6). */
export function Reveal<T extends ElementType = 'div'>({
  as,
  children,
  className,
  delay = 0,
  y = 24,
  ...rest
}: Props<T>) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: Math.min(y, 40) },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: 'expo.out',
            delay,
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag ref={ref} data-reveal="" className={className} {...rest}>
      {children}
    </Tag>
  );
}
