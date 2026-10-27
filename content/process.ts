import type { ProcessStep } from './types';

/** Proceso en 5 pasos (§6.9 sección 6). ⚠️ Validar plazos y cadencias con negocio. */
export const processSteps: readonly ProcessStep[] = [
  {
    n: '01',
    title: 'Hablamos',
    text: 'Una llamada de 15–30 minutos para entender tu idea, tu contexto y qué significa éxito para ti.',
  },
  {
    n: '02',
    title: 'Propuesta clara',
    text: 'Alcance, entregables, plazos y presupuesto por escrito. Sin letra pequeña.',
  },
  {
    n: '03',
    title: 'Diseño y prototipo',
    text: 'Flujos, interfaz y un prototipo navegable que validas antes de escribir código.',
  },
  {
    n: '04',
    title: 'Desarrollo por sprints',
    text: 'Entregas cortas y visibles cada una o dos semanas. Ves avances reales y ajustamos el rumbo.',
  },
  {
    n: '05',
    title: 'Lanzamiento y evolución',
    text: 'Publicamos, medimos y seguimos mejorando contigo con mantenimiento y nuevas versiones.',
  },
] as const;

/** Marquesina de tecnología (§6.9 sección 7). Editable según el stack real. */
export const techStack: readonly string[] = [
  'Next.js',
  'React',
  'TypeScript',
  'Supabase',
  'PostgreSQL',
  'Webflow',
  'n8n',
  'Make',
  'Power Automate',
  'Vercel',
] as const;
