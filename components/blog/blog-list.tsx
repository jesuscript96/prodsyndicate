'use client';

import { useId, useState } from 'react';
import type { PostMeta } from '@/content/types';
import { PostCard } from './post-card';
import { tagLabel } from './tag-label';

type Props = {
  /** Ordenados de más reciente a más antiguo (getAllPosts) */
  posts: PostMeta[];
  tags: string[];
};

/**
 * Listado con filtros por etiqueta (estado local, chips accesibles con
 * aria-pressed). Sin filtro: destacado (el más reciente) + rejilla. Con filtro:
 * rejilla de los artículos que llevan esa etiqueta.
 */
export function BlogList({ posts, tags }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const labelId = useId();

  const filtered = active ? posts.filter((p) => p.tags.includes(active)) : posts;
  const featured = active ? undefined : filtered[0];
  const grid = active ? filtered : filtered.slice(1);
  const count = filtered.length;

  return (
    <div className="blog-list">
      <div className="blog-toolbar">
        <div className="tag-filter" role="group" aria-labelledby={labelId}>
          <span id={labelId} className="label">
            Tema
          </span>
          <ul className="tag-filter__list">
            <li>
              <button
                type="button"
                className="chip chip--outline tag-filter__btn"
                aria-pressed={active === null}
                onClick={() => setActive(null)}
              >
                Todo
              </button>
            </li>
            {tags.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  className="chip chip--outline tag-filter__btn"
                  aria-pressed={active === t}
                  onClick={() => setActive((cur) => (cur === t ? null : t))}
                >
                  {tagLabel(t)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="label blog-count" aria-live="polite">
          {count === 1 ? '1 artículo' : `${count} artículos`}
          {active ? ` · ${tagLabel(active)}` : ''}
        </p>
      </div>

      {featured && <PostCard post={featured} featured />}

      {grid.length > 0 && (
        <ul className="blog-grid">
          {grid.map((p) => (
            <li key={p.slug}>
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      )}

      {count === 0 && <p className="blog-empty body-l">Todavía no hay artículos con esa etiqueta.</p>}
    </div>
  );
}
