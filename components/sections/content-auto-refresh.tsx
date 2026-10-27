'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

/**
 * Las secciones con `content-auto` (content-visibility: auto) cambian de alto
 * al renderizarse por primera vez, lo que desplaza las posiciones medidas por
 * ScrollTrigger en las secciones posteriores. Al cambiar su estado se recalcula
 * (de forma segura: al terminar el scroll). En navegadores sin el evento no hace nada.
 */
export function ContentAutoRefresh() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.content-auto'));
    if (!els.length) return;
    let raf = 0;
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ScrollTrigger.refresh(true));
    };
    els.forEach((el) => el.addEventListener('contentvisibilityautostatechange', onChange));
    return () => {
      cancelAnimationFrame(raf);
      els.forEach((el) => el.removeEventListener('contentvisibilityautostatechange', onChange));
    };
  }, []);
  return null;
}
