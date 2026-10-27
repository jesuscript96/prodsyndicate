import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  items: readonly ReactNode[];
  className?: string;
  /** Duración de un ciclo en segundos */
  duration?: number;
  gap?: string;
  /** Texto accesible que resume la lista (la copia duplicada va con aria-hidden) */
  label?: string;
};

/** Marquesina CSS infinita; pausa en hover; la copia duplicada lleva aria-hidden (§5.6). */
export function Marquee({ items, className, duration = 40, gap = '3rem', label }: Props) {
  const style = { '--marquee-duration': `${duration}s`, '--marquee-gap': gap } as CSSProperties;
  const list = (hidden: boolean) => (
    <ul className="marquee__list" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li key={i} className="marquee__item">
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn('marquee', className)} style={style} role="region" aria-label={label}>
      <div className="marquee__track">
        {list(false)}
        {list(true)}
      </div>
    </div>
  );
}
