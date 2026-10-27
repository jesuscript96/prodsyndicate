import type { PostMeta } from '@/content/types';
import { LinkArrow } from '@/components/ui/link-arrow';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { SplitReveal } from '@/components/ui/split-reveal';
import { cn } from '@/lib/utils';
import { PostCard } from './post-card';

/**
 * Relacionados: misma etiqueta o mismo servicio (puntuación por coincidencias,
 * desempate por fecha). Si no llega a `min`, se completa con los más recientes.
 */
export function getRelatedPosts(current: PostMeta, all: PostMeta[], max = 3, min = 2): PostMeta[] {
  const others = all.filter((p) => p.slug !== current.slug);
  const scored = others
    .map((p) => ({
      p,
      score:
        (current.service && p.service === current.service ? 2 : 0) +
        p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (a.p.date < b.p.date ? 1 : -1))
    .map((x) => x.p);
  const picked = scored.slice(0, max);
  for (const p of others) {
    if (picked.length >= min) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked;
}

export function RelatedPosts({ posts }: { posts: PostMeta[] }) {
  if (!posts.length) return null;
  return (
    <section className="section--tight hairline" aria-labelledby="relacionados-title">
      <div className="wrap related">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-4">
            <SectionLabel>Relacionados</SectionLabel>
            <SplitReveal as="h2" id="relacionados-title" className="h2">
              Sigue <em className="accent-word text-accent">leyendo</em>.
            </SplitReveal>
          </div>
          <Reveal>
            <LinkArrow href="/blog">Todos los artículos</LinkArrow>
          </Reveal>
        </div>
        <ul className={cn('related__grid', posts.length >= 3 && 'related__grid--3')}>
          {posts.map((p) => (
            <li key={p.slug}>
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
