'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

type Props = {
  /** Valor final (SOLO datos reales y verificables, §5.6) */
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

/** Contador animado al entrar en el viewport. Sin datos reales, la sección que lo usa se omite. */
export function StatCounter({ value, label, prefix = '', suffix = '', decimals = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(n);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const state = { v: 0 };
        gsap.to(state, {
          v: value,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => {
            el.textContent = `${prefix}${fmt(state.v)}${suffix}`;
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [value, prefix, suffix, decimals] },
  );

  return (
    <div className={className}>
      <span ref={ref} className="display-l block text-ink">
        {prefix}
        {fmt(value)}
        {suffix}
      </span>
      <span className="label mt-2 block">{label}</span>
    </div>
  );
}
