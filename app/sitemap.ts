import type { MetadataRoute } from 'next';
import { serviceSlugs } from '@/content/services';
import { getAllLegal, getAllPosts, getAllProjects } from '@/lib/content';
import { absoluteUrl } from '@/lib/seo';

type Entry = MetadataRoute.Sitemap[number];

/** Rutas fijas (§10.3). Los artículos, proyectos y legales salen de lib/content. */
const FIXED = ['/', '/servicios', '/proyectos', '/proceso', '/emprendedores', '/empresas', '/nosotros', '/blog', '/contacto'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entry = (path: string, extra: Partial<Entry> = {}): Entry => ({ url: absoluteUrl(path), lastModified: now, ...extra });

  return [
    ...FIXED.map((p) => entry(p, { changeFrequency: 'monthly', priority: p === '/' ? 1 : 0.8 })),
    ...serviceSlugs.map((slug) => entry(`/servicios/${slug}`, { changeFrequency: 'monthly', priority: 0.9 })),
    ...getAllProjects().map((p) => entry(`/proyectos/${p.slug}`, { changeFrequency: 'yearly', priority: 0.7 })),
    ...getAllPosts().map((p) =>
      entry(`/blog/${p.slug}`, { lastModified: new Date(p.updated ?? p.date), changeFrequency: 'yearly', priority: 0.6 }),
    ),
    ...getAllLegal().map((l) =>
      entry(`/legal/${l.slug}`, { lastModified: new Date(l.updated), changeFrequency: 'yearly', priority: 0.2 }),
    ),
  ];
}
