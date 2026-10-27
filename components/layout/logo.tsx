import Link from 'next/link';
import { site } from '@/site.config';
import { cn } from '@/lib/utils';

/** Marca: trazo de boceto que termina en un punto ultramar + nombre. */
export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link href="/" className={cn('nav__logo', className)} aria-label={`${site.name}, inicio`} onClick={onClick}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <path d="M3 15.5C5.5 9 9 5 15 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="16.5" cy="15.5" r="3.5" fill="var(--accent)" />
      </svg>
      <span>{site.name}</span>
    </Link>
  );
}
