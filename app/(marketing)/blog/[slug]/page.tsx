import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { getServiceSummary } from '@/content/services';
import { getAllPosts, getPostBySlug } from '@/lib/content';
import { articleJsonLd, buildMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/utils';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Chip } from '@/components/ui/chip';
import { CtaBand } from '@/components/ui/cta-band';
import { JsonLd } from '@/components/ui/json-ld';
import { Reveal } from '@/components/ui/reveal';
import { SplitReveal } from '@/components/ui/split-reveal';
import { createMdxComponents } from '@/components/blog/mdx-components';
import { ReadingProgress } from '@/components/blog/reading-progress';
import { RelatedPosts, getRelatedPosts } from '@/components/blog/related-posts';
import { extractHeadings } from '@/components/blog/slugify';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { tagLabel } from '@/components/blog/tag-label';
import '@/components/blog/blog.css';

type Params = { slug: string };

const BODY_ID = 'articulo-contenido';

export function generateStaticParams(): Params[] {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  // La imagen OG la aporta `opengraph-image.tsx` (convención de archivo, tiene prioridad)
  return buildMetadata({
    title: post.meta.title,
    description: post.meta.description,
    path: `/blog/${slug}`,
    type: 'article',
  });
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { meta, content: source } = post;
  const path = `/blog/${slug}`;
  const { content } = await compileMDX({
    source,
    components: createMdxComponents(),
    options: { parseFrontmatter: false },
  });
  const toc = extractHeadings(source);
  const service = meta.service ? getServiceSummary(meta.service) : undefined;
  const related = getRelatedPosts(meta, getAllPosts());
  const updated = meta.updated && meta.updated !== meta.date ? meta.updated : undefined;

  return (
    <>
      <ReadingProgress targetId={BODY_ID} />

      <article className="post">
        <header className="post-hero">
          <div className="wrap post-hero__inner">
            <Breadcrumbs items={[{ name: 'Laboratorio', href: '/blog' }, { name: meta.title, href: path }]} />
            {meta.tags.length > 0 && (
              <Reveal as="ul" className="post-hero__tags" aria-label="Etiquetas">
                {meta.tags.map((t) => (
                  <li key={t}>
                    <Chip>{tagLabel(t)}</Chip>
                  </li>
                ))}
              </Reveal>
            )}
            <SplitReveal as="h1" className="post-hero__title" trigger={false}>
              {meta.title}
            </SplitReveal>
            <Reveal as="p" className="body-l text-ink-2 post-hero__desc" delay={0.15}>
              {meta.description}
            </Reveal>
            <Reveal as="dl" className="post-meta" delay={0.25}>
              <div>
                <dt>Publicado</dt>
                <dd>
                  <time dateTime={meta.date}>{formatDate(meta.date)}</time>
                </dd>
              </div>
              {updated && (
                <div>
                  <dt>Actualizado</dt>
                  <dd>
                    <time dateTime={updated}>{formatDate(updated)}</time>
                  </dd>
                </div>
              )}
              <div>
                <dt>Autor</dt>
                <dd>{meta.author}</dd>
              </div>
              <div>
                <dt>Lectura</dt>
                <dd>{meta.readingMinutes} min</dd>
              </div>
            </Reveal>
          </div>
        </header>

        <div className="wrap post-layout">
          <aside className="post-aside">
            <TableOfContents initial={toc} containerId={BODY_ID} />
          </aside>
          <div id={BODY_ID} className="prose post-body">
            {content}
          </div>
        </div>
      </article>

      <RelatedPosts posts={related} />

      {service ? (
        <CtaBand
          echo={false}
          title={
            <>
              ¿Lo aplicamos a tu <em className="accent-word text-accent">proyecto</em>?
            </>
          }
          text={service.card}
          primary={service.cta}
          secondary={{ label: `Ver ${service.shortTitle}`, href: `/servicios/${service.slug}` }}
        />
      ) : (
        <CtaBand echo={false} />
      )}

      <JsonLd
        data={articleJsonLd({
          title: meta.title,
          description: meta.description,
          path,
          datePublished: meta.date,
          dateModified: meta.updated,
          image: `${path}/opengraph-image`,
          author: meta.author,
        })}
      />
    </>
  );
}
