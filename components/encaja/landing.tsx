import Image from 'next/image';
import { Check } from 'lucide-react';
import { Booking } from '@/components/agenda/booking';
import { AccentTitle } from '@/components/company/accent-title';
import { PillarGrid } from '@/components/company/pillar-grid';
import { SectionHead } from '@/components/company/section-head';
import { Chip } from '@/components/ui/chip';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { ImageReveal } from '@/components/ui/image-reveal';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { SplitReveal } from '@/components/ui/split-reveal';
import {
  encajaCallNote,
  encajaCase,
  encajaClosing,
  encajaCta,
  encajaMeeting,
  encajaOutcomesLabel,
  encajaPrice,
  encajaSteps,
  encajaTimeNote,
  encajaWho,
  type EncajaBlock,
  type EncajaLanding,
} from '@/content/encaja';
import { site } from '@/site.config';
import { FlowVisual } from './flow-visual';
import './encaja.css';

/**
 * Landing de la campaña «Encaja» (docs/encaja/propuesta-landings.md). Misma estructura para los
 * tres ángulos: hero con el titular del anuncio · ¿Te suena? · bloques del ángulo · caso real ·
 * cómo funciona · quién está detrás · preguntas · cierre con la agenda (#contacto).
 */
export function EncajaLandingPage({ landing }: { landing: EncajaLanding }) {
  const location = `lp-encaja-${landing.slug}`;
  let n = 0;
  const next = () => String(++n).padStart(2, '0');
  const { hero, pains } = landing;

  const visual =
    hero.visual.type === 'image' ? (
      <ImageReveal radius={24} className="lp-hero__image">
        <Image
          src={hero.visual.src}
          alt={hero.visual.alt}
          width={hero.visual.width}
          height={hero.visual.height}
          sizes="(min-width: 1024px) 40vw, 90vw"
          priority
          className="h-auto w-full"
        />
      </ImageReveal>
    ) : (
      <FlowVisual />
    );

  return (
    <>
      <PageHero
        className="lp-hero"
        label={hero.label}
        title={<AccentTitle parts={hero.title} />}
        intro={hero.intro}
        cta={encajaCta}
        visual={visual}
        analyticsLocation={`${location}-hero`}
      >
        <Reveal as="p" className="lp-hero__note" delay={0.3}>
          {encajaCallNote}
        </Reveal>
      </PageHero>

      {/* ¿Te suena? */}
      <section className="section lp-section" aria-labelledby="lp-pains-title">
        <div className="wrap">
          <SectionHead n={next()} id="lp-pains-title" copy={{ label: pains.label, title: pains.title }} />
          <ul className="lp-pains">
            {pains.items.map((item, i) => (
              <Reveal as="li" key={item} className="lp-pains__item" delay={i * 0.06}>
                <span className="lp-pains__mark" aria-hidden="true" />
                {item}
              </Reveal>
            ))}
          </ul>
          {pains.chips && (
            <Reveal className="lp-chips" delay={0.2}>
              <span className="label">Donde más se nota</span>
              <ul className="lp-chips__list">
                {pains.chips.map((c) => (
                  <li key={c}>
                    <Chip tone="outline">{c}</Chip>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </section>

      {/* Lo que cambia: un resultado para el dueño por cada dolor, sin tecnicismos */}
      <section className="section lp-section bg-paper-2" aria-labelledby="lp-outcomes-title">
        <div className="wrap">
          <SectionHead
            n={next()}
            id="lp-outcomes-title"
            copy={{ label: encajaOutcomesLabel, title: landing.outcomes.title, intro: encajaTimeNote }}
          />
          <PillarGrid
            items={landing.outcomes.items.map((o, i) => ({ n: `0${i + 1}`, title: o.title, text: o.text }))}
            columns={3}
          />
        </div>
      </section>

      {landing.blocks.map((block, i) => (
        <AngleBlock key={block.id} block={block} n={next()} soft={i % 2 === 1} />
      ))}

      {/* Caso real */}
      <section className="section lp-section" aria-labelledby="lp-case-title">
        <div className="wrap">
          <SectionHead
            n={next()}
            id="lp-case-title"
            copy={{ label: encajaCase.label, title: encajaCase.title, intro: landing.caseIntro }}
          />
          <PillarGrid
            items={encajaCase.parts.map((p, i) => ({ n: `0${i + 1}`, title: p.title, text: p.text }))}
            columns={3}
            soft
          />
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="section section--tight lp-section bg-paper-2" aria-labelledby="lp-steps-title">
        <div className="wrap">
          <SectionHead n={next()} id="lp-steps-title" copy={{ label: encajaSteps.label, title: encajaSteps.title }} />
          <PillarGrid items={encajaSteps.items} variant="rows" />
          {landing.angle !== 'decision' && (
            <Reveal as="p" className="lp-price">
              <span className="label">Inversión</span>
              <span>{encajaPrice}</span>
            </Reveal>
          )}
        </div>
      </section>

      {/* Quién está detrás */}
      <section className="section lp-section" aria-labelledby="lp-who-title">
        <div className="wrap lp-split">
          <div className="grid content-start gap-5">
            <SectionLabel n={next()}>{encajaWho.label}</SectionLabel>
            <SplitReveal as="h2" id="lp-who-title" className="h2 lp-split__title">
              <AccentTitle parts={encajaWho.title} />
            </SplitReveal>
          </div>
          <div className="grid content-start gap-5">
            {encajaWho.paragraphs.map((p, i) => (
              <Reveal as="p" key={p} className={i === 0 ? 'body-l m-0' : 'm-0 text-ink-2'} delay={i * 0.08}>
                {p}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Preguntas */}
      <section className="section section--tight lp-section" aria-labelledby="lp-faq-title">
        <div className="wrap lp-split">
          <div className="grid content-start gap-5">
            <SectionLabel n={next()}>Preguntas</SectionLabel>
            <SplitReveal as="h2" id="lp-faq-title" className="h2 lp-split__title">
              Lo que te <em className="accent-word text-accent">preguntarías</em>
            </SplitReveal>
          </div>
          <FaqAccordion items={landing.faq} headingLevel={3} />
        </div>
      </section>

      {/* Cierre con la agenda */}
      <section id="contacto" className="section lp-section lp-closing" aria-labelledby="lp-closing-title">
        <div className="wrap lp-closing__grid">
          <div className="lp-closing__head grid content-start gap-6">
            <SectionLabel n={next()}>Agenda tu llamada</SectionLabel>
            <SplitReveal as="h2" id="lp-closing-title" className="h2 lp-closing__title">
              <AccentTitle parts={encajaClosing.title} />
            </SplitReveal>
            <Reveal as="p" className="body-l m-0 max-w-[40ch] text-ink-2">
              {encajaClosing.text}
            </Reveal>
          </div>
          <Booking className="lp-closing__booking" landing={`encaja-${landing.slug}`} location={location} />
          <div className="lp-closing__details grid content-start gap-6">
            <Reveal className="lp-meeting" delay={0.1}>
              <h3 className="h4">{encajaMeeting.title}</h3>
              <ul>
                {encajaMeeting.items.map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <p className="m-0 text-ink-2">
              ¿Prefieres escribir?{' '}
              <a href={`mailto:${site.email}`} className="text-accent">
                {site.email}
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function AngleBlock({ block, n, soft }: { block: EncajaBlock; n: string; soft: boolean }) {
  const titleId = `lp-${block.id}-title`;
  return (
    <section className={soft ? 'section lp-section bg-paper-2' : 'section lp-section'} aria-labelledby={titleId}>
      <div className="wrap">
        {block.qa ? (
          <>
            <SectionHead n={n} id={titleId} copy={{ label: block.label, title: block.title }} />
            <PillarGrid items={block.qa.map((x) => ({ title: x.q, text: x.a }))} variant="quotes" columns={3} />
          </>
        ) : block.steps ? (
          <>
            <SectionHead n={n} id={titleId} copy={{ label: block.label, title: block.title }} />
            <PillarGrid
              items={block.steps.map((s, i) => ({ n: `0${i + 1}`, title: s }))}
              variant="rows"
              headingLevel={3}
            />
          </>
        ) : (
          <div className="lp-split">
            <div className="grid content-start gap-5">
              <SectionLabel n={n}>{block.label}</SectionLabel>
              <SplitReveal as="h2" id={titleId} className="h2 lp-split__title">
                <AccentTitle parts={block.title} />
              </SplitReveal>
            </div>
            <div className="grid content-start gap-6">
              {block.text && (
                <Reveal as="p" className="body-l m-0 text-ink-2">
                  {block.text}
                </Reveal>
              )}
              {block.chips && (
                <Reveal className="lp-chips" delay={0.1}>
                  {block.chipsLabel && <span className="label">{block.chipsLabel}</span>}
                  <ul className="lp-chips__list">
                    {block.chips.map((c) => (
                      <li key={c}>
                        <Chip tone="outline">{c}</Chip>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
