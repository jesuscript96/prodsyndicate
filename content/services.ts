import type { ProjectCategory, ServiceSlug, ServiceSummary } from './types';

/** Las 4 líneas de servicio (§3.1, §6.9 sección 4). Copy de la guía. */
export const services: readonly ServiceSummary[] = [
  {
    slug: 'mvp',
    title: 'MVP para emprendedores',
    shortTitle: 'MVP',
    menuLine: 'De la idea a un producto real en semanas.',
    card: 'De la idea a un producto real en semanas. Validamos lo esencial y construimos lo mínimo que importa.',
    icon: 'rocket',
    cta: { label: 'Cuéntanos tu idea', href: '/contacto' },
    category: 'mvp',
  },
  {
    slug: 'software-a-medida',
    title: 'Software a medida',
    shortTitle: 'Software a medida',
    menuLine: 'Portales, paneles y herramientas internas.',
    card: 'Portales, paneles y herramientas internas que encajan con tu forma de trabajar, no al revés.',
    icon: 'layout-panel',
    cta: { label: 'Agenda una llamada', href: '/contacto#agenda' },
    category: 'empresa',
  },
  {
    slug: 'automatizacion-ia',
    title: 'Automatización e IA',
    shortTitle: 'Automatización e IA',
    menuLine: 'Flujos que eliminan trabajo manual.',
    card: 'Flujos que eliminan trabajo manual: integraciones, agentes y procesos conectados entre tus herramientas.',
    icon: 'workflow',
    cta: { label: 'Agenda una llamada', href: '/contacto#agenda' },
    category: 'automatizacion',
  },
  {
    slug: 'productos-creativos',
    title: 'Productos creativos e interactivos',
    shortTitle: 'Productos creativos',
    menuLine: 'Experiencias web con identidad propia.',
    card: 'Experiencias web y herramientas con identidad propia, donde el diseño es parte del producto.',
    icon: 'sparkles',
    cta: { label: 'Cuéntanos tu idea', href: '/contacto' },
    category: 'creativo',
  },
] as const;

export const serviceSlugs = services.map((s) => s.slug) as ServiceSlug[];

export function getServiceSummary(slug: string): ServiceSummary | undefined {
  return services.find((s) => s.slug === slug);
}

export function getServiceByCategory(category: ProjectCategory): ServiceSummary | undefined {
  return services.find((s) => s.category === category);
}

export const categoryLabels: Record<ProjectCategory, string> = {
  mvp: 'MVP',
  empresa: 'Empresa',
  automatizacion: 'Automatización',
  creativo: 'Creativo',
};
