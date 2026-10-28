import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServiceSummary, serviceSlugs } from '@/content/services';
import { getServiceDetail } from '@/content/services-detail';
import type { Cta } from '@/content/types';
import { getPostsByService, getProjectsForService } from '@/lib/content';
import { buildMetadata, faqJsonLd, serviceJsonLd } from '@/lib/seo';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CtaBand } from '@/components/ui/cta-band';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { JsonLd } from '@/components/ui/json-ld';
import { LinkArrow } from '@/components/ui/link-arrow';
import { Marquee } from '@/components/ui/marquee';
import { ProjectCard } from '@/components/ui/project-card';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { SplitReveal } from '@/components/ui/split-reveal';
import { CreativeDemo } from '@/components/services/creative-demo';
import { DeliverableIcon } from '@/components/services/deliverable-icon';
import { PostTeaser } from '@/components/services/post-teaser';
import { ServiceStory } from '@/components/services/service-story';
import { SERVICE_STORIES } from '@/content/service-stories';
import '@/components/services/services.css';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return serviceSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const detail = getServiceDetail(slug);
  if (!detail) return {};
  return buildMetadata({
    title: detail.seo.title,
    description: detail.seo.description,
    path: `/servicios/${slug}`,
  });
}

const contactCta: Cta = { label: 'Cuéntanos tu idea', href: '/contacto' };

/** §8.3 — Plantilla de página de servicio. Secciones (1)–(9). */
export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const detail = getServiceDetail(slug);
  const summary = getServiceSummary(slug);
  if (!detail || !summary) notFound();

  const path = `/servicios/${detail.slug}`;
  const isAgenda = detail.cta.href.includes('#agenda');
  const bandSecondary: Cta = isAgenda ? contactCta : { label: 'Agenda una llamada de 15 min', href: '/contacto#agenda' };

  // Los MDX de proyectos y blog los crea otro módulo: estas secciones se renderizan solo si hay contenido.
  const projects = getProjectsForService(detail.slug, 2);
  const posts = getPostsByService(detail.slug, 2);

  const isCreative = detail.slug === 'productos-creativos';

  return (
    <>
      {/* (1) Hero: historia por scroll con la escena 3D propia del servicio */}
      <ServiceStory detail={detail} />

      <div className="wrap services-crumbs pt-10">
        <Breadcrumbs
          items={[
            { name: 'Servicios', href: '/servicios' },
            { name: summary.shortTitle, href: path },
          ]}
        />
      </div>

      {/* (2) Para quién es */}
      <section id="para-quien" className="section" aria-labelledby="para-quien-title">
        <div className="wrap">
          <div className="sec-head">
            <SectionLabel n="01">Para quién es</SectionLabel>
            <SplitReveal as="h2" id="para-quien-title" className="h2">
              Para <em className="accent-word">quién</em> es.
            </SplitReveal>
          </div>
          <ul className="forwho">
            {detail.forWho.map((who, i) => (
              <Reveal key={who} as="li" delay={i * 0.06}>
                <span className="forwho__n" aria-hidden="true">
                  0{i + 1}
                </span>
                <span>{who}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Productos creativos: demostración interactiva con el puntero (§8.3.4) */}
      {isCreative && (
        <section id="pruebalo" className="section hairline" aria-labelledby="pruebalo-title">
          <div className="wrap grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="sec-head mb-0">
              <SectionLabel>Pruébalo</SectionLabel>
              <SplitReveal as="h2" id="pruebalo-title" className="h2">
                Mueve el <em className="accent-word">puntero</em>.
              </SplitReveal>
              <Reveal as="p" className="body-l text-ink-2">
                Una losa con capas en profundidad que responde al ratón y al scroll. Con movimiento reducido se queda quieta.
              </Reveal>
            </div>
            <CreativeDemo />
          </div>
        </section>
      )}

      {/* (3) Qué entregamos */}
      <section id="entregamos" className="section hairline" aria-labelledby="entregamos-title">
        <div className="wrap">
          <div className="sec-head">
            <SectionLabel n="02">Qué entregamos</SectionLabel>
            <SplitReveal as="h2" id="entregamos-title" className="h2">
              Qué <em className="accent-word">entregamos</em>.
            </SplitReveal>
          </div>
          <ul className="deliverables">
            {detail.deliverables.map((d, i) => (
              <Reveal key={d.text} as="li" delay={(i % 3) * 0.06}>
                <span className="deliverables__icon">
                  <DeliverableIcon name={d.icon} />
                </span>
                <span>{d.text}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* (4) Cómo lo hacemos */}
      <section id="como" className="section hairline" aria-labelledby="como-title">
        <div className="wrap">
          <div className="sec-head">
            <SectionLabel n="03">Cómo lo hacemos</SectionLabel>
            <SplitReveal as="h2" id="como-title" className="h2">
              Cómo lo <em className="accent-word">hacemos</em>.
            </SplitReveal>
          </div>
          <ol className="steps">
            {detail.steps.map((step, i) => (
              <Reveal key={step.title} as="li" delay={0.04}>
                <span className="steps__n">0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="pt-8">
            <LinkArrow href="/proceso">Ver el proceso completo</LinkArrow>
          </Reveal>
        </div>
      </section>

      {/* (5) Casos de uso */}
      <section id="casos-de-uso" className="section hairline" aria-labelledby="casos-de-uso-title">
        <div className="wrap">
          <div className="sec-head">
            <SectionLabel n="04">Casos de uso</SectionLabel>
            <SplitReveal as="h2" id="casos-de-uso-title" className="h2">
              Casos de <em className="accent-word">uso</em>.
            </SplitReveal>
          </div>
          <ul className="usecases">
            {detail.useCases.map((u, i) => (
              <Reveal key={u} as="li" delay={(i % 3) * 0.05}>
                {u}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* (6) Tecnología */}
      <section id="tecnologia" className="section--tight section hairline" aria-labelledby="tecnologia-title">
        <div className="wrap">
          <div className="sec-head mb-8">
            <SectionLabel n="05">Tecnología</SectionLabel>
            <h2 id="tecnologia-title" className="h4">
              Con qué lo construimos
            </h2>
          </div>
        </div>
        <Marquee items={detail.stack} label={`Tecnología para ${summary.title}`} duration={32} />
      </section>

      {/* (7) Casos relacionados — solo si hay proyectos */}
      {projects.length > 0 && (
        <section id="casos" className="section hairline" aria-labelledby="casos-title">
          <div className="wrap">
            <div className="sec-head flex flex-wrap items-end justify-between gap-4 max-w-none">
              <div className="grid gap-4">
                <SectionLabel n="06">Casos relacionados</SectionLabel>
                <SplitReveal as="h2" id="casos-title" className="h2">
                  Casos <em className="accent-word">relacionados</em>.
                </SplitReveal>
              </div>
              <LinkArrow href="/proyectos">Ver todos los proyectos</LinkArrow>
            </div>
            <div className="related">
              {projects.map((p) => (
                <ProjectCard key={p.slug} project={p} sizes="(min-width: 1024px) 45vw, 90vw" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Artículos relacionados — solo si hay posts */}
      {posts.length > 0 && (
        <section id="articulos" className="section hairline" aria-labelledby="articulos-title">
          <div className="wrap">
            <div className="sec-head flex flex-wrap items-end justify-between gap-4 max-w-none">
              <div className="grid gap-4">
                <SectionLabel n={projects.length ? '07' : '06'}>Artículos relacionados</SectionLabel>
                <SplitReveal as="h2" id="articulos-title" className="h2">
                  Artículos <em className="accent-word">relacionados</em>.
                </SplitReveal>
              </div>
              <LinkArrow href="/blog">Ver el blog</LinkArrow>
            </div>
            <div className="related">
              {posts.map((p) => (
                <PostTeaser key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* (8) FAQ */}
      <section id="faq" className="section hairline" aria-labelledby="faq-title">
        <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="sec-head mb-0">
            <SectionLabel>FAQ</SectionLabel>
            <SplitReveal as="h2" id="faq-title" className="h2">
              Preguntas <em className="accent-word">frecuentes</em>.
            </SplitReveal>
          </div>
          <Reveal>
            <FaqAccordion items={detail.faq} headingLevel={3} />
          </Reveal>
        </div>
        <JsonLd data={faqJsonLd(detail.faq)} />
      </section>

      {/* (9) CTA */}
      <CtaBand primary={detail.cta} secondary={bandSecondary} echoSrc={SERVICE_STORIES[detail.slug].posters.last} />

      <JsonLd
        data={serviceJsonLd({
          name: summary.title,
          description: detail.seo.description,
          path,
          serviceType: detail.serviceType,
        })}
      />
    </>
  );
}
