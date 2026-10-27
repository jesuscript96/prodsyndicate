import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { getAllLegal, getLegalBySlug } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/utils';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CtaBand } from '@/components/ui/cta-band';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllLegal().map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalBySlug(slug);
  if (!doc) return {};
  return buildMetadata({ title: doc.meta.title, description: doc.meta.description, path: `/legal/${slug}` });
}

/** Última palabra del título en serif cursiva (p. ej. «Política de *privacidad*»). */
function AccentTitle({ text }: { text: string }) {
  const i = text.lastIndexOf(' ');
  if (i < 0) return <em className="accent-word text-accent">{text}</em>;
  return (
    <>
      {text.slice(0, i + 1)}
      <em className="accent-word text-accent">{text.slice(i + 1)}</em>
    </>
  );
}

/**
 * §8.12 — Página legal desde MDX (content/legal/*.mdx). Cabecera sobria con el
 * mismo hueco que `.page-hero` para la píldora flotante, un único H1 y el cuerpo
 * en `.prose` a columna estrecha. Legal no tiene índice: la miga es solo el documento.
 */
export default async function LegalPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const doc = getLegalBySlug(slug);
  if (!doc) notFound();

  const path = `/legal/${slug}`;
  const { content } = await compileMDX({ source: doc.content, options: { parseFrontmatter: false } });

  return (
    <>
      <article>
        <header className="page-hero">
          <div className="wrap wrap--narrow grid gap-8">
            <Breadcrumbs items={[{ name: doc.meta.title, href: path }]} />
            <div className="grid gap-4">
              <p className="label">Legal</p>
              <h1 className="display-l max-w-[14ch]">
                <AccentTitle text={doc.meta.title} />
              </h1>
              <p className="font-mono text-sm text-ink-3">
                Última actualización:{' '}
                <time dateTime={doc.meta.updated} className="text-ink-2">
                  {formatDate(doc.meta.updated)}
                </time>
              </p>
            </div>
          </div>
        </header>

        <div className="wrap wrap--narrow pb-[var(--section-y)]">
          <div className="prose hairline pt-10">{content}</div>
        </div>
      </article>

      <CtaBand echo={false} />
    </>
  );
}
