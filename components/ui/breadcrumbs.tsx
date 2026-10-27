import Link from 'next/link';
import { breadcrumbJsonLd, type Crumb } from '@/lib/seo';
import { JsonLd } from './json-ld';
import { cn } from '@/lib/utils';

/** Migas de pan + JSON-LD BreadcrumbList (§3.2, §8.1). `items` no incluye Inicio. */
export function Breadcrumbs({ items, className }: { items: readonly Crumb[]; className?: string }) {
  const all: Crumb[] = [{ name: 'Inicio', href: '/' }, ...items];
  return (
    <>
      <nav aria-label="Migas de pan" className={cn('breadcrumbs', className)}>
        <ol>
          {all.map((it, i) => (
            <li key={it.href}>
              {i < all.length - 1 ? <Link href={it.href}>{it.name}</Link> : <span aria-current="page">{it.name}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(all)} />
    </>
  );
}
