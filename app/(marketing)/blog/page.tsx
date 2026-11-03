import type { Metadata } from 'next';
import { getAllPosts, getAllTags } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CtaBand } from '@/components/ui/cta-band';
import { PageHero } from '@/components/ui/page-hero';
import { BlogList } from '@/components/blog/blog-list';
import { SubscribeBlock } from '@/components/blog/subscribe-block';
import '@/components/blog/blog.css';

/** §8.9 — Title exacto de la guía (el sufijo de marca lo añade buildMetadata). */
export const metadata: Metadata = buildMetadata({
  title: 'Laboratorio · Notas de producto, diseño y automatización',
  description:
    'Notas sobre producto, diseño, desarrollo y automatización: los métodos que usamos, las decisiones que tomamos y cómo está hecho lo que construimos.',
  path: '/blog',
});

export default function BlogPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <>
      <PageHero
        label="Laboratorio"
        title={
          <>
            Laboratorio: <em className="accent-word text-accent">notas</em> de producto, diseño y automatización.
          </>
        }
        intro="Lo que vamos aprendiendo al construir MVPs, software a medida y automatizaciones: métodos, decisiones y cómo está hecho lo que ves."
      />

      <section className="section--tight pt-0" aria-label="Artículos">
        <div className="wrap grid gap-8">
          <Breadcrumbs items={[{ name: 'Laboratorio', href: '/blog' }]} />
          <BlogList posts={posts} tags={tags} />
        </div>
      </section>

      <SubscribeBlock />

      <CtaBand />
    </>
  );
}
