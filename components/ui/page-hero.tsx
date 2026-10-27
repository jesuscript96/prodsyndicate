import type { ReactNode } from 'react';
import type { Cta } from '@/content/types';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Reveal } from './reveal';
import { SplitReveal } from './split-reveal';

type Props = {
  /** Etiqueta mono encima del H1, p. ej. "Servicios" */
  label?: ReactNode;
  /** H1 (display-l). Usa <em className="accent-word text-accent"> para 1–2 palabras */
  title: ReactNode;
  intro?: ReactNode;
  cta?: Cta;
  secondary?: Cta;
  /** Elemento visual propio de la página (ilustración, LayersExploded, mosaico…) */
  visual?: ReactNode;
  className?: string;
  /** Ubicación para analítica de CTA */
  analyticsLocation?: string;
  children?: ReactNode;
};

/** Hero interior sin pin (§8.1): etiqueta + H1 con SplitReveal + intro + CTA + visual opcional. */
export function PageHero({ label, title, intro, cta, secondary, visual, className, analyticsLocation = 'page-hero', children }: Props) {
  return (
    <section className={cn('page-hero', className)}>
      <div className={cn('wrap page-hero__grid', visual && 'page-hero__grid--split')}>
        <div className="page-hero__text">
          {label && (
            <Reveal as="p" className="label">
              {label}
            </Reveal>
          )}
          <SplitReveal as="h1" className="display-l" trigger={false}>
            {title}
          </SplitReveal>
          {intro && (
            <Reveal as="p" className="body-l max-w-[52ch] text-ink-2" delay={0.15}>
              {intro}
            </Reveal>
          )}
          {(cta || secondary) && (
            <Reveal className="flex flex-wrap gap-3 pt-2" delay={0.25}>
              {cta && (
                <Button href={cta.href} arrow analytics={{ location: analyticsLocation, label: cta.label }}>
                  {cta.label}
                </Button>
              )}
              {secondary && (
                <Button href={secondary.href} variant="secondary">
                  {secondary.label}
                </Button>
              )}
            </Reveal>
          )}
          {children}
        </div>
        {visual && <div className="page-hero__visual">{visual}</div>}
      </div>
    </section>
  );
}
