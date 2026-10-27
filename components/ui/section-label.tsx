import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Etiqueta de sección tipo `01 — Servicios`, siempre encima del H2 (§5.4). */
export function SectionLabel({
  n,
  children,
  className,
  as: Tag = 'p',
}: {
  n?: string;
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}) {
  return (
    <Tag className={cn('label', className)}>
      {n ? `${n} — ` : null}
      {children}
    </Tag>
  );
}
