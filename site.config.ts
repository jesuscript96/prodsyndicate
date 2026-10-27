/**
 * Configuración central del sitio (§4.4). Todo lo que lleva {{LLAVES}} es un
 * dato pendiente de negocio: se rellena aquí y se propaga a toda la web.
 * Ver TODO.md.
 */
/**
 * URL pública (canonical, OG, sitemap, JSON-LD; solo se usa en servidor).
 * Orden: NEXT_PUBLIC_SITE_URL → dominio de producción de Vercel → URL del despliegue
 * de preview → local. Así un despliegue en Vercel nunca publica enlaces a localhost.
 */
function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3200';
}

export const site = {
  name: '{{MARCA}}',
  legalName: '{{RAZÓN_SOCIAL}}',
  url: siteUrl(),
  locale: 'es',
  email: 'hola@{{DOMINIO}}',
  calendarUrl: process.env.NEXT_PUBLIC_CAL_URL ?? '',
  tagline: 'Productos digitales a medida, de la idea al lanzamiento.',
  description:
    'Diseñamos y construimos MVPs, software a medida y automatizaciones con IA. De la idea al lanzamiento, con diseño de alto nivel y desarrollo eficiente.',
  /** ⚠️ Zona geográfica declarada en JSON-LD `Service.areaServed`. */
  areaServed: 'ES',
  social: { linkedin: '', x: '', github: '' },
} as const;

export type Site = typeof site;
