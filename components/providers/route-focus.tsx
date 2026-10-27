'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/** Al navegar entre rutas mueve el foco al H1 de la nueva página (§12). */
export function RouteFocus() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const h1 = document.querySelector<HTMLElement>('main h1');
    const target = h1 ?? document.getElementById('contenido');
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
