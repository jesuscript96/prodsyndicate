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
};

export default nextConfig;
