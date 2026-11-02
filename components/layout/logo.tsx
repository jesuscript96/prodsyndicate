import Link from 'next/link';
import { site } from '@/site.config';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand-mark';

/** Marca: isotipo (tomate cortado por la mitad) + nombre en mayúsculas. */
export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link href="/" className={cn('nav__logo', className)} aria-label={`${site.name}, inicio`} onClick={onClick}>
      <BrandMark size={22} />
      <span className="nav__wordmark">{site.name}</span>
    </Link>
  );
}
