/**
 * Configuración central del sitio (§4.4). Todo lo que lleva {{LLAVES}} es un
 * dato pendiente de negocio: se rellena aquí y se propaga a toda la web.
 * Ver TODO.md.
 */

/** Dominio de producción. El apex redirige a `www` en Vercel, así que la canónica lleva `www`. */
const PRODUCTION_DOMAIN = 'automatoagency.art';
const PRODUCTION_URL = `https://www.${PRODUCTION_DOMAIN}`;

/**
 * URL pública (canonical, OG, sitemap, JSON-LD; solo se usa en servidor).
 * Orden: NEXT_PUBLIC_SITE_URL → producción (dominio propio) → URL del despliegue
 * de preview → local. Así un despliegue en Vercel nunca publica enlaces a localhost.
 */
function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_ENV === 'production') return PRODUCTION_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3200';
}

export const site = {
  name: 'AUTOMATO',
  legalName: 'Jesús Valenzuela Chuliá',
  domain: PRODUCTION_DOMAIN,
  url: siteUrl(),
  locale: 'es',
  email: `hola@${PRODUCTION_DOMAIN}`,
  calendarUrl: process.env.NEXT_PUBLIC_CAL_URL ?? '',
  tagline: 'Productos digitales a medida, de la idea al lanzamiento.',
  description:
    'Diseñamos y construimos MVPs, software a medida y automatizaciones con IA. De la idea al lanzamiento, con diseño de alto nivel y desarrollo eficiente.',
  /** ⚠️ Zona geográfica declarada en JSON-LD `Service.areaServed`. */
  areaServed: 'ES',
  social: { linkedin: '', x: '', github: '' },
} as const;

export type Site = typeof site;
