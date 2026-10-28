'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { PropCanvas, type PropHandle } from './prop-canvas';
import './props.css';

/**
 * 01 — Servicios: cada tarjeta cambia su icono por el objeto 3D de su servicio (idea, puzle,
 * esfera de IA y anillo), que gira al ritmo del scroll mientras la tarjeta cruza la pantalla.
 * Se monta con portales dentro de la sección, sin tocar su componente.
 */

const SERVICE_PROPS = ['idea', 'puzzle', 'ai-sphere', 'ring'] as const;
const FRAMES = 36;

function TurnProp({ name, card }: { name: string; card: HTMLElement }) {
  const seq = useRef<PropHandle>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.create({
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => seq.current?.setFrame((self.progress * FRAMES * 1.5) % FRAMES),
        });
      });
      return () => mm.revert();
    },
    { dependencies: [card] },
  );

  return (
    <div className="sprop" aria-hidden="true">
      <PropCanvas ref={seq} name={name} frames={FRAMES} maxPx={480} className="sprop__canvas" />
    </div>
  );
}

type Target = { card: HTMLElement; icon: HTMLElement };

export function ServiceProps({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const cards = [...(root.current?.querySelectorAll<HTMLElement>('.svc-card') ?? [])];
      setTargets(
        cards.flatMap((card) => {
          const icon = card.querySelector<HTMLElement>('.svc-card__icon');
          return icon ? [{ card, icon }] : [];
        }),
      );
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div ref={root} className="svc-props">
      {children}
      {targets.map(({ card, icon }, i) =>
        createPortal(<TurnProp name={SERVICE_PROPS[i % SERVICE_PROPS.length]!} card={card} />, icon, `svc-prop-${i}`),
      )}
    </div>
  );
}
