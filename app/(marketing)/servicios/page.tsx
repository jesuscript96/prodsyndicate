import type { Metadata } from 'next';
import { faq } from '@/content/faq';
import { primaryCta, secondaryCta } from '@/content/nav';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CtaBand } from '@/components/ui/cta-band';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { JsonLd } from '@/components/ui/json-ld';
import { LinkArrow } from '@/components/ui/link-arrow';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { SplitReveal } from '@/components/ui/split-reveal';
import { HowToChoose } from '@/components/services/how-to-choose';
import { LayersExploded } from '@/components/services/layers-exploded';
import { ProcessSummary } from '@/components/services/process-summary';
import { ServiceLines } from '@/components/services/service-lines';
import { Transversal } from '@/components/services/transversal';
import '@/components/services/services.css';

/** §8.2 — Índice de servicios. Copy exacto de la guía. */
export const metadata: Metadata = buildMetadata({
  title: 'Servicios · Productos digitales a medida',
  description:
    'MVPs, software a medida, automatización con IA y productos creativos. Descubre cómo diseñamos y construimos productos digitales de la idea al lanzamiento.',
  path: '/servicios',
});

const briefFaq = faq.slice(0, 3);

export default function ServicesIndexPage() {
  return (
    <>
      <div className="wrap services-crumbs">
        <Breadcrumbs items={[{ name: 'Servicios', href: '/servicios' }]} />
      </div>

      {/* 1. Hero + LayersExploded */}
      <PageHero
        className="services-hero"
        label="Servicios"
        title={
          <>
            Todo lo necesario para <em className="accent-word text-accent">construir</em> tu producto digital.
          </>
        }
        intro="Cuatro formas de trabajar contigo, un mismo estándar: diseño cuidado, código sólido y entrega por fases."
        cta={primaryCta}
        secondary={secondaryCta}
        analyticsLocation="services-hero"
        visual={<LayersExploded />}
      />

      {/* 2. Las 4 líneas */}
      <section id="lineas" className="section" aria-labelledby="lineas-title">
        <div className="wrap">
          <div className="sec-head">
            <SectionLabel n="01">Las 4 líneas</SectionLabel>
            <SplitReveal as="h2" id="lineas-title" className="h2">
              Cuatro <em className="accent-word">líneas</em>, un mismo estándar.
            </SplitReveal>
          </div>
          <ServiceLines />
        </div>
      </section>

      {/* 3. Transversal a todo */}
      <section id="transversal" className="section--tight section hairline" aria-labelledby="transversal-title">
        <div className="wrap">
          <div className="sec-head">
            <SectionLabel n="02">Transversal a todo</SectionLabel>
            <SplitReveal as="h2" id="transversal-title" className="h2">
              Lo que va <em className="accent-word">siempre</em> incluido.
            </SplitReveal>
          </div>
          <Transversal />
        </div>
      </section>

      {/* 4. Cómo elegir */}
      <section id="como-elegir" className="section hairline" aria-labelledby="elegir-title">
        <div className="wrap">
          <div className="sec-head">
            <SectionLabel n="03">Cómo elegir</SectionLabel>
            <SplitReveal as="h2" id="elegir-title" className="h2">
              Si tu situación es… te <em className="accent-word">conviene</em>…
            </SplitReveal>
            <Reveal as="p" className="body-l text-ink-2">
              Cuatro puntos de partida habituales y la línea de trabajo que mejor encaja con cada uno.
            </Reveal>
          </div>
          <Reveal>
            <HowToChoose />
          </Reveal>
        </div>
      </section>

      {/* 5. Proceso resumido */}
      <section id="proceso" className="section hairline" aria-labelledby="proceso-title">
        <div className="wrap">
          <div className="sec-head">
            <SectionLabel n="04">Proceso</SectionLabel>
            <SplitReveal as="h2" id="proceso-title" className="h2">
              Así <em className="accent-word">trabajamos</em>, en cinco pasos.
            </SplitReveal>
          </div>
          <ProcessSummary />
          <Reveal className="pt-8">
            <LinkArrow href="/proceso">Ver el proceso completo</LinkArrow>
          </Reveal>
        </div>
      </section>

      {/* 6. FAQ breve */}
      <section id="faq" className="section hairline" aria-labelledby="faq-title">
        <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="sec-head mb-0">
            <SectionLabel n="05">FAQ</SectionLabel>
            <SplitReveal as="h2" id="faq-title" className="h2">
              Preguntas <em className="accent-word">frecuentes</em>.
            </SplitReveal>
            <Reveal as="p" className="text-ink-2">
              Las tres que más nos hacen antes de empezar.
            </Reveal>
          </div>
          <Reveal>
            <FaqAccordion items={briefFaq} headingLevel={3} />
          </Reveal>
        </div>
        <JsonLd data={faqJsonLd(briefFaq)} />
      </section>

      <CtaBand />
    </>
  );
}
