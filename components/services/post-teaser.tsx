import Link from 'next/link';
import type { PostMeta } from '@/content/types';
import { formatDate } from '@/lib/utils';
import { Chip } from '@/components/ui/chip';

/** Tarjeta breve de artículo (título, descripción, fecha y lectura) para "Artículos relacionados". */
export function PostTeaser({ post }: { post: PostMeta }) {
  return (
    <article className="post-teaser">
      <div className="flex flex-wrap items-center gap-2">
        {post.tags.slice(0, 2).map((t) => (
          <Chip key={t} tone="neutral">
            {t}
          </Chip>
        ))}
      </div>
      <h3 className="h4">
        <Link href={`/blog/${post.slug}`} className="post-teaser__link">
          {post.title}
        </Link>
      </h3>
      <p className="text-ink-2">{post.description}</p>
      <p className="label">
        <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min de lectura
      </p>
    </article>
  );
}
