import { site } from '@/site.config';
import { getAllPosts } from '@/lib/content';
import { absoluteUrl } from '@/lib/seo';

/** RSS 2.0 con las 20 últimas entradas del laboratorio (§10.3). Estático. */
export const dynamic = 'force-static';

const MAX_ITEMS = 20;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** La fecha del frontmatter es YYYY-MM-DD: se publica a las 08:00 UTC para un pubDate estable. */
const toRfc822 = (iso: string) => new Date(`${iso}T08:00:00Z`).toUTCString();

export function GET() {
  const posts = getAllPosts().slice(0, MAX_ITEMS);
  const feedUrl = absoluteUrl('/feed.xml');
  const blogUrl = absoluteUrl('/blog');
  const lastBuild = posts[0] ? toRfc822(posts[0].date) : new Date().toUTCString();

  const items = posts
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`);
      const categories = p.tags.map((t) => `      <category>${escapeXml(t)}</category>`).join('\n');
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(p.date)}</pubDate>
      <description>${escapeXml(p.description)}</description>
${categories}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`Laboratorio · ${site.name}`)}</title>
    <link>${blogUrl}</link>
    <description>${escapeXml('Notas de producto, diseño y automatización.')}</description>
    <language>es</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
