'use client';

import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import './sections.css';

/**
 * Sección 3 · Manifiesto (§6.9): texto en display-l que se "enciende" palabra a
 * palabra con el scroll. SplitText por palabras, opacity 0.15 → 1 con scrub
 * (código de la guía). Sin reduce-motion el texto queda tal cual.
 */
export function ManifestoSection() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current?.querySelector<HTMLElement>('[data-manifesto]');
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const split = SplitText.create(el, { type: 'words', aria: /^H[1-6]$/.test(el.tagName) ? 'auto' : 'none' });
        gsap.fromTo(
          split.words,
          { opacity: 0.15 },
          {
            opacity: 1,
            stagger: 0.05,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 55%', scrub: true },
          },
        );
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="manifiesto" className="section" aria-label="Manifiesto">
      <div className="wrap">
        <p className="display-l manifesto__text" data-manifesto>
          No vendemos horas de desarrollo. Construimos productos digitales que{' '}
          <em className="accent-word text-accent">funcionan</em> el día del lanzamiento, y siguen funcionando después.
        </p>
      </div>
    </section>
  );
}
