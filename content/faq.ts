import type { FaqItem } from './types';

/**
 * FAQ global (§8.11). ⚠️ Las respuestas comerciales (precios, plazos, propiedad,
 * soporte) deben confirmarse con negocio antes de publicar. Ver TODO.md.
 */
export const faq: readonly FaqItem[] = [
  {
    q: '¿Cuánto cuesta un proyecto?',
    a: 'Depende del alcance. Tras una primera llamada te enviamos una propuesta cerrada con entregables, plazos y presupuesto. Si hay que ajustar el alcance, lo hablamos antes, no después.',
  },
  {
    q: '¿Cuánto tarda un MVP?',
    a: 'Normalmente entre 4 y 10 semanas, según la complejidad.',
  },
  {
    q: '¿Necesito tener todo definido para empezar?',
    a: 'No. Si solo tienes una idea, empezamos por una fase corta de definición.',
  },
  {
    q: '¿De quién es el código y el diseño?',
    a: 'Tuyo. Al terminar recibes el código fuente, los diseños y la documentación, según lo acordado en el contrato.',
  },
  {
    q: '¿Trabajáis con equipos técnicos que ya tenemos?',
    a: 'Sí. Podemos encargarnos de una parte (diseño, front-end, automatización) y coordinarnos con tu equipo.',
  },
  {
    q: '¿Qué pasa después del lanzamiento?',
    a: 'Seguimos contigo: mantenimiento, mejoras y nuevas funcionalidades, con un plan acordado.',
  },
  {
    q: '¿Qué tecnologías usáis?',
    a: 'Elegimos según el proyecto: Next.js y React, Supabase o PostgreSQL, y plataformas como Webflow, n8n o Make cuando aceleran sin atarte.',
  },
  {
    q: '¿Hacéis solo diseño o solo desarrollo?',
    a: 'Podemos encargarnos del producto completo o únicamente de una fase.',
  },
] as const;
