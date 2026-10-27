import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { categoryLabels } from '@/content/services';
import { getAllProjects, getNextProject, getProjectBySlug } from '@/lib/content';
import { articleJsonLd, buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Chip } from '@/components/ui/chip';
import { CtaBand } from '@/components/ui/cta-band';
import { ImageReveal } from '@/components/ui/image-reveal';
import { JsonLd } from '@/components/ui/json-ld';
import { Reveal } from '@/components/ui/reveal';
import { SplitReveal } from '@/components/ui/split-reveal';
import { ConceptNotice } from '@/components/projects/concept-notice';
import { projectMdxComponents } from '@/components/projects/mdx-components';
import { NextProject } from '@/components/projects/next-project';
import '@/components/projects/projects.css';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return buildMetadata({
    title: `${project.meta.title} · Caso de estudio`,
    description: project.meta.summary,
    path: `/proyectos/${slug}`,
    image: project.meta.cover.src,
    type: 'article',
  });
}

/** §8.4 — Plantilla de caso: hero · resumen en 3 bloques · galería · decisiones · siguiente proyecto · CTA. */
export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { meta, content: source } = project;
  const path = `/proyectos/${slug}`;
  const { content } = await compileMDX({
    source,
    components: projectMdxComponents,
    options: { parseFrontmatter: false },
  });
  const next = getNextProject(slug);
  const categories = meta.categories.map((c) => categoryLabels[c]).join(' · ');

  return (
    <>
      <article className="case">
        <header className="case-hero">
          <div className="wrap case-hero__inner">
            <Breadcrumbs items={[{ name: 'Proyectos', href: '/proyectos' }, { name: meta.title, href: path }]} />
            <Reveal as="p" className="label">
              Caso de estudio{categories ? ` · ${categories}` : ''}
            </Reveal>
            <SplitReveal as="h1" className="display-l case-hero__title" trigger={false}>
              {meta.title}
            </SplitReveal>
            <Reveal as="p" className="body-l text-ink-2 case-hero__summary" delay={0.15}>
              {meta.summary}
            </Reveal>
            <Reveal as="dl" className="case-facts" delay={0.25}>
              <div>
                <dt>Cliente</dt>
                <dd>{meta.client}</dd>
              </div>
              <div>
                <dt>Año</dt>
                <dd>{meta.year}</dd>
              </div>
              {meta.services.length > 0 && (
                <div>
                  <dt>Servicios</dt>
                  <dd>
                    <ul className="case-facts__chips">
                      {meta.services.map((s) => (
                        <li key={s}>
                          <Chip>{s}</Chip>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {meta.stack.length > 0 && (
                <div className="case-facts__wide">
                  <dt>Stack</dt>
                  <dd>
                    <ul className="case-facts__chips">
                      {meta.stack.map((t) => (
                        <li key={t}>
                          <Chip tone="outline">{t}</Chip>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </Reveal>
            {meta.isConcept && <ConceptNotice />}
          </div>
        </header>

        <div className="wrap wrap--wide">
          <ImageReveal className="case-cover" radius={24}>
            <Image
              src={meta.cover.src}
              alt={meta.cover.alt}
              fill
              priority
              sizes="(min-width: 1440px) 1376px, 96vw"
            />
          </ImageReveal>
        </div>

        <div className="wrap prose case-body">{content}</div>
      </article>

      {next && next.slug !== slug && <NextProject project={next} />}

      <CtaBand
        echo={false}
        title={
          <>
            Hablemos de tu <em className="accent-word text-accent">proyecto</em>.
          </>
        }
        text="Cuéntanos qué quieres construir y te decimos, con honestidad, cómo lo abordaríamos."
        primary={{ label: 'Hablemos de tu proyecto', href: '/contacto' }}
      />

      <JsonLd
        data={articleJsonLd({
          type: 'CreativeWork',
          title: meta.title,
          description: meta.summary,
          path,
          datePublished: String(meta.year),
          image: meta.cover.src,
        })}
      />
    </>
  );
}
