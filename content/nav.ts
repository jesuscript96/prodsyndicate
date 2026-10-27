import type { Cta } from './types';

/** Navegación (§3.2) */
export const mainNav: readonly Cta[] = [
  { label: 'Proyectos', href: '/proyectos' },
  { label: 'Proceso', href: '/proceso' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Blog', href: '/blog' },
] as const;

export const companyNav: readonly Cta[] = [
  { label: 'Proyectos', href: '/proyectos' },
  { label: 'Proceso', href: '/proceso' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/contacto' },
] as const;

export const audienceNav: readonly Cta[] = [
  { label: 'Para emprendedores', href: '/emprendedores' },
  { label: 'Para empresas', href: '/empresas' },
] as const;

export const legalNav: readonly Cta[] = [
  { label: 'Privacidad', href: '/legal/privacidad' },
  { label: 'Cookies', href: '/legal/cookies' },
  { label: 'Aviso legal', href: '/legal/aviso-legal' },
] as const;

export const primaryCta: Cta = { label: 'Cuéntanos tu idea', href: '/contacto' };
export const secondaryCta: Cta = { label: 'Agenda una llamada', href: '/contacto#agenda' };
