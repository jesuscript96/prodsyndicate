import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  accent?: boolean;
  external?: boolean;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'children' | 'className'>;

/** Enlace con subrayado que se dibuja de izquierda a derecha y flecha ↗ (§5.6). */
export function LinkArrow({ href, children, className, accent, external, ...rest }: Props) {
  const classes = cn('link-arrow', accent && 'link-arrow--accent', className);
  const icon = <ArrowUpRight aria-hidden="true" />;
  if (external || /^https?:|^mailto:|^tel:/.test(href)) {
    return (
      <a href={href} className={classes} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
        <span>{children}</span>
        {icon}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      <span>{children}</span>
      {icon}
    </Link>
  );
}
