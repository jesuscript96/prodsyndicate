import { ImageResponse } from 'next/og';
import { site } from '@/site.config';
import { getAllPosts, getPostBySlug } from '@/lib/content';
import { formatDate } from '@/lib/utils';

/**
 * OG dinámica por artículo (§10.4): fondo blanco, título grande, nombre del
 * sitio en estilo mono y un punto ultramar. Sin fuentes externas: fuente por defecto.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `Artículo del laboratorio de ${site.name}`;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

const INK = '#0b0b0f';
const INK_3 = '#6b6b76';
const LINE = '#e8e8e3';
const ACCENT = '#2b3bff';

export default async function OgImage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.meta.title ?? site.tagline;
  const description = post?.meta.description ?? site.description;
  const dateLine = post ? `${formatDate(post.meta.date)} · ${post.meta.readingMinutes} min de lectura` : '';
  const fontSize = title.length > 70 ? 54 : title.length > 45 ? 62 : 72;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: '#ffffff',
          color: INK,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'monospace',
              fontSize: 22,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: INK_3,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 999, background: ACCENT }} />
            <span>{site.name}</span>
            <span style={{ color: LINE }}>/</span>
            <span>Laboratorio</span>
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 20,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: INK_3,
            }}
          >
            {dateLine}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize,
              fontWeight: 600,
              lineHeight: 1.04,
              letterSpacing: -2.5,
              maxWidth: 1000,
              display: 'block',
              lineClamp: 3,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.4,
              color: '#3a3a42',
              maxWidth: 900,
              display: 'block',
              lineClamp: 2,
            }}
          >
            {description}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${LINE}`, paddingTop: 24 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 20, letterSpacing: 2, textTransform: 'uppercase', color: INK_3 }}>
            {post?.meta.tags.join(' · ') ?? ''}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 20, letterSpacing: 2, color: INK_3 }}>
            {site.url.replace(/^https?:\/\//, '')}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
