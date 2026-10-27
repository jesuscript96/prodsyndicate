import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  tone?: 'accent' | 'neutral' | 'outline';
  /** Punto naranja "live" (solo decorativo) */
  live?: boolean;
  className?: string;
} & ComponentPropsWithoutRef<'span'>;

/** Píldora pequeña para etiquetas de capítulo y tecnologías (§5.6). */
export function Chip({ children, tone = 'accent', live, className, ...rest }: Props) {
  return (
    <span className={cn('chip', tone !== 'accent' && `chip--${tone}`, className)} {...rest}>
      {live && <span className="chip__dot chip__dot--live" aria-hidden="true" />}
      {children}
    </span>
  );
}
