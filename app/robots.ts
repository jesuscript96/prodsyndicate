import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

/** §10.3 — Todo indexable salvo la API; el sitemap vive en /sitemap.xml. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
