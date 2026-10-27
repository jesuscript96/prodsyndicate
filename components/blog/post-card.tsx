import Link from 'next/link';
import type { PostMeta } from '@/content/types';
import { Chip } from '@/components/ui/chip';
import { cn, formatDate } from '@/lib/utils';
import { tagLabel } from './tag-label';

type Props = {
  post: PostMeta;
  /** Tarjeta grande (artículo destacado): título mayor y dos columnas en escritorio */
  featured?: boolean;
  /** Nivel del encabezado del título (h2 en el destacado, h3 en la rejilla) */
  headingLevel?: 2 | 3;
  className?: string;
};

/**
 * Tarjeta tipográfica de artículo (sin portada): fecha, lectura, título,
 * descripción y etiquetas. Compartida entre servidor y cliente (sin hooks).
 */
export function PostCard({ post, featured = false, headingLevel, className }: Props) {
  const Heading = (headingLevel ?? (featured ? 2 : 3)) === 2 ? 'h2' : 'h3';
  return (
    <article className={cn('post-card', featured && 'post-card--featured', className)}>
      <p className="post-card__meta label">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingMinutes} min de lectura</span>
        {featured && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-accent">Último artículo</span>
          </>
        )}
      </p>
      <Heading className="post-card__title">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </Heading>
      <p className="post-card__desc">{post.description}</p>
      {post.tags.length > 0 && (
        <ul className="post-card__tags" aria-label="Etiquetas">
          {post.tags.map((t) => (
            <li key={t}>
              <Chip tone="outline">{tagLabel(t)}</Chip>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
