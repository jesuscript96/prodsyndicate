import type { ReactNode } from 'react';
import type { SectionCopy } from '@/content/company';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { SplitReveal } from '@/components/ui/split-reveal';
import { cn } from '@/lib/utils';
import { AccentTitle } from './accent-title';
import './company.css';

type Props = {
  n?: string;
  copy: SectionCopy;
  /** id para aria-labelledby de la sección */
  id?: string;
  className?: string;
  /** Contenido a la derecha del titular (p. ej. LinkArrow) */
  aside?: ReactNode;
};

/** Cabecera de sección: `01 — Etiqueta` + H2 con acento + intro opcional. */
export function SectionHead({ n, copy, id, className, aside }: Props) {
  return (
    <div className={cn('co-head', aside && 'co-head--row', className)}>
      <div className="grid gap-5">
        <SectionLabel n={n}>{copy.label}</SectionLabel>
        <SplitReveal as="h2" id={id} className="h2 co-head__title">
          <AccentTitle parts={copy.title} />
        </SplitReveal>
        {copy.intro && (
          <Reveal as="p" className="body-l max-w-[52ch] text-ink-2" delay={0.1}>
            {copy.intro}
          </Reveal>
        )}
      </div>
      {aside && <Reveal delay={0.15}>{aside}</Reveal>}
    </div>
  );
}
