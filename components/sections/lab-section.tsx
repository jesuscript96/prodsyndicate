import Link from 'next/link';
import { getLatestPosts } from '@/lib/content';
import { getServiceSummary } from '@/content/services';
import { formatDate } from '@/lib/utils';
import { Chip } from '@/components/ui/chip';
import { LinkArrow } from '@/components/ui/link-arrow';
import { Reveal } from '@/components/ui/reveal';
import { SectionHead } from './section-head';
import './sections.css';

/**
 * Sección 9 · Laboratorio (`05 — Laboratorio`, §6.9): 3 últimas entradas del blog
 * como tarjetas tipográficas (etiqueta, título, fecha, tiempo de lectura).
 * Sin artículos publicados la sección no se renderiza.
 */
export function LabSection() {
  const posts = getLatestPosts(3);
  if (!posts.length) return null;

  return (
    <section id="laboratorio" className="section content-auto" aria-labelledby="home-lab-title">
      <div className="wrap">
        <div className="sec-head__row">
          <SectionHead
            n="05"
            label="Laboratorio"
            id="home-lab-title"
            title={
              <>
                Lo que <em className="accent-word text-accent">probamos</em> y aprendemos.
              </>
            }
            text="Experimentos, demos y notas técnicas de lo que construimos."
          />
          <LinkArrow href="/blog" className="sec-head__aside">
            Ver todos los artículos
          </LinkArrow>
        </div>
        <ul className="lab-grid">
          {posts.map((post, i) => {
            const tag = post.tags[0] ?? (post.service ? getServiceSummary(post.service)?.shortTitle : undefined);
            return (
              <li key={post.slug}>
                <Reveal as="article" className="lab-card" delay={i * 0.08}>
                  <div className="lab-card__meta">{tag && <Chip>{tag}</Chip>}</div>
                  <h3 className="lab-card__title">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="label">
                    <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min de lectura
                  </p>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
