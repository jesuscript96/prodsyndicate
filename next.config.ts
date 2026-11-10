import type { NextConfig } from 'next';

/**
 * Cabeceras de seguridad (§15.2). La CSP se añade en modo report-only
 * cuando se conozcan los dominios finales de analítica, Turnstile y agenda.
 */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
];

const nextConfig: NextConfig = {
  // Cache Components (Next 16) queda desactivado a propósito: todo el sitio es
  // estático (SSG + generateStaticParams) y el modelo clásico evita envolver la
  // lectura de MDX en 'use cache' / <Suspense>. Reactivar si aparecen datos dinámicos.
  reactStrictMode: true,
  // CSS (Tailwind, pequeño) incrustado en el <head> en producción: quita la hoja que
  // bloqueaba el primer pintado en móvil (Lighthouse: «Render-blocking requests»).
  experimental: {
    inlineCss: true,
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      // Frames de las historias, versionados: caché inmutable en producción (§7.7). En desarrollo
      // no, porque se regeneran a menudo sin cambiar la versión.
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/sequence/:path*',
              headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
          ]
        : []),
      { source: '/(.*)', headers: securityHeaders },
    ];
  },
  // Landings que publica Valme OS por pull request en public/lp/<slug>/index.html. Next sirve
  // public sólo por ruta exacta, así que sin esto /lp/<slug> daría 404. La barra final la
  // redirige Next sola a /lp/<slug> y conserva la query de los anuncios.
  async rewrites() {
    return [{ source: '/lp/:slug', destination: '/lp/:slug/index.html' }];
  },
};

export default nextConfig;
