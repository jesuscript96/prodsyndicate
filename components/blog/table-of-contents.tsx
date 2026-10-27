'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { TocItem } from './slugify';

type Props = {
  /** Encabezados extraídos en el servidor (mismos ids que el MDX renderizado): evita el salto de layout */
  initial: TocItem[];
  /** id del contenedor del artículo (`.prose`) */
  containerId: string;
};

const same = (a: TocItem[], b: TocItem[]) =>
  a.length === b.length && a.every((x, i) => x.id === b[i].id && x.text === b[i].text && x.level === b[i].level);

/**
 * Índice lateral sticky. Se pinta en el servidor con `initial` y, al montar,
 * se sincroniza con los h2/h3 renderizados (fuente de verdad) desde el primer
 * callback del IntersectionObserver, que además marca el encabezado activo.
 */
export function TableOfContents({ initial, containerId }: Props) {
  const [items, setItems] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) return;

    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]'));
    if (!headings.length || !('IntersectionObserver' in window)) return;

    const fromDom: TocItem[] = headings.map((h) => ({
      id: h.id,
      text: h.textContent?.trim() ?? '',
      level: h.tagName === 'H2' ? 2 : 3,
    }));

    // Encabezado activo: el último que ha cruzado la franja superior del viewport
    const visible = new Map<string, boolean>();
    const pick = () => {
      let current: string | null = null;
      for (const h of headings) {
        if (visible.get(h.id)) {
          current = h.id;
          break;
        }
      }
      if (!current) {
        // Ninguno en la franja: el último que quedó por encima
        const top = window.innerHeight * 0.25;
        for (const h of headings) {
          if (h.getBoundingClientRect().top <= top) current = h.id;
        }
      }
      setActiveId(current);
    };
    const io = new IntersectionObserver(
      (entries) => {
        // El observer notifica el estado inicial de cada encabezado al observarlo:
        // ese primer callback sincroniza el índice con el DOM (solo si difiere del servidor).
        setItems((cur) => (same(cur, fromDom) ? cur : fromDom));
        for (const e of entries) visible.set((e.target as HTMLElement).id, e.isIntersecting);
        pick();
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [containerId]);

  if (items.length < 2) return null;

  return (
    <nav className="toc" aria-label="Índice del artículo">
      <p className="label">En este artículo</p>
      <ol className="toc__list">
        {items.map((it) => (
          <li key={it.id} className={cn('toc__item', `toc__item--${it.level}`)}>
            <a href={`#${it.id}`} className="toc__link" aria-current={activeId === it.id ? 'location' : undefined}>
              {it.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
