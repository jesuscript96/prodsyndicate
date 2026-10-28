import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Cta } from '@/content/types';
import { primaryCta } from '@/content/nav';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ImageReveal } from './image-reveal';
import { Reveal } from './reveal';
import { SplitReveal } from './split-reveal';

type Props = {
  title?: ReactNode;
  text?: ReactNode;
  primary?: Cta;
  secondary?: Cta | null;
  /** Eco visual: último frame del hero (poster-last) con ImageReveal */
  echo?: boolean;
  /** Imagen del eco (por defecto, la composición final del hero de la home) */
  echoSrc?: string;
  className?: string;
  id?: string;
};

const defaultSecondary: Cta = { label: 'Agenda una llamada de 15 min', href: '/contacto#agenda' };

/** Banda final (§6.9 sección 11): H2 enorme, botón primario y secundario, eco del último frame del hero. */
export function CtaBand({
  title = (
    <>
      Cuéntanos qué quieres <em className="accent-word text-accent">construir</em>.
    </>
  ),
  text,
  primary = primaryCta,
  secondary = defaultSecondary,
  echo = true,
  echoSrc = '/sequence/v2/poster-last.webp',
  className,
  id,
}: Props) {
  return (
    <section id={id} className={cn('cta-band section', className)} aria-labelledby="cta-band-title">
      <div className={cn('wrap cta-band__grid', echo && 'cta-band__grid--echo')}>
        <div className="grid gap-8">
          <SplitReveal as="h2" id="cta-band-title" className="h2 cta-band__title">
            {title}
          </SplitReveal>
          {text && (
            <Reveal as="p" className="body-l max-w-[46ch] text-ink-2">
              {text}
            </Reveal>
          )}
          <Reveal className="flex flex-wrap gap-3" delay={0.1}>
            <Button href={primary.href} arrow analytics={{ location: 'cta-band', label: primary.label }}>
              {primary.label}
            </Button>
            {secondary && (
              <Button href={secondary.href} variant="secondary" analytics={{ location: 'cta-band', label: secondary.label }}>
                {secondary.label}
              </Button>
            )}
          </Reveal>
        </div>
        {echo && (
          <ImageReveal className="cta-band__echo" radius={28}>
            <Image
              src={echoSrc}
              alt=""
              width={1200}
              height={1200}
              sizes="(min-width: 1024px) 40vw, 80vw"
              className="aspect-square w-full object-cover"
            />
          </ImageReveal>
        )}
      </div>
    </section>
  );
}
