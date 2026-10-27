'use client';

import { useRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';

type Props<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Stagger por línea (0.06 s por defecto, §5.5) */
  stagger?: number;
  /** false = entra al montar sin esperar al scroll */
  trigger?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

/** Titulares por líneas con máscara (SplitText), stagger 0.06 s (§5.6). */
export function SplitReveal<T extends ElementType = 'h2'>({
  as,
  children,
  className,
  delay = 0,
  stagger = 0.06,
  trigger = true,
  ...rest
}: Props<T>) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const split = SplitText.create(el, {
          type: 'lines',
          // aria-label solo está permitido en encabezados; en <p> axe lo marca como prohibido.
          // Dividir por líneas no rompe palabras, así que el texto sigue leyéndose bien sin él.
          aria: /^H[1-6]$/.test(el.tagName) ? 'auto' : 'none',
          mask: 'lines',
          autoSplit: true,
          linesClass: 'split-line',
          onSplit: (self) => {
            gsap.set(el, { visibility: 'visible' });
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.1,
              ease: 'expo.out',
              stagger,
              delay,
              scrollTrigger: trigger ? { trigger: el, start: 'top 85%', once: true } : undefined,
            });
          },
        });
        return () => split.revert();
      });
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(el, { visibility: 'visible' });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const Tag = (as ?? 'h2') as ElementType;
  return (
    <Tag ref={ref} data-split="" className={className} {...rest}>
      {children}
    </Tag>
  );
}
