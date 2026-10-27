import type { ReactNode } from 'react';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { SplitReveal } from '@/components/ui/split-reveal';
import { cn } from '@/lib/utils';
import './sections.css';

type Props = {
  /** Número de la etiqueta, p. ej. "01" */
  n: string;
  /** Texto de la etiqueta, p. ej. "Servicios" → `01 — Servicios` */
  label: string;
  /** id del H2 (para aria-labelledby de la sección) */
  id: string;
  /** H2 con 1–2 palabras en <em className="accent-word"> */
  title: ReactNode;
  text?: ReactNode;
  className?: string;
};

/** Cabecera de sección de la home: SectionLabel + H2 (SplitReveal) + texto opcional (Reveal). */
export function SectionHead({ n, label, id, title, text, className }: Props) {
  return (
    <div className={cn('sec-head', className)}>
      <SectionLabel n={n}>{label}</SectionLabel>
      <SplitReveal as="h2" id={id} className="h2">
        {title}
      </SplitReveal>
      {text && (
        <Reveal as="p" className="body-l text-ink-2 sec-head__text" delay={0.1}>
          {text}
        </Reveal>
      )}
    </div>
  );
}
