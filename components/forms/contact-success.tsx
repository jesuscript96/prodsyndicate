'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { PostMeta } from '@/content/types';
import { CalendarFacade } from './calendar-facade';

type Props = {
  /** Dos artículos recomendados (getLatestPosts(2) desde el server component). */
  posts: PostMeta[];
};

/** Estado de éxito del asistente (§8.10): mensaje, botón de agenda y 2 artículos. */
export function ContactSuccess({ posts }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className="card wizard success" data-state="success">
      <div className="grid gap-3">
        <p className="label">Mensaje enviado</p>
        <h2 ref={heading} tabIndex={-1} className="h3 wizard__title">
          ¡Recibido! Te escribiremos en breve.
        </h2>
        <p className="body text-ink-2 max-w-[48ch]">
          Si prefieres adelantar la conversación, elige un hueco en la agenda.
        </p>
      </div>

      <CalendarFacade from="contact-success" label="Agendar una llamada" />

      {posts.length > 0 && (
        <div className="success__posts">
          <h3 className="h4">Mientras tanto, dos lecturas</h3>
          <ul>
            {posts.slice(0, 2).map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="post-mini">
                  <span className="post-mini__title">{p.title}</span>
                  <span className="post-mini__meta">
                    {p.description} · {p.readingMinutes} min
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
