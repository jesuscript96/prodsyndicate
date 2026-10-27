import type { Cta, FaqItem, ProcessStep } from './types';
import { faq } from './faq';
import { primaryCta, secondaryCta } from './nav';
import { processSteps } from './process';
import { site } from '@/site.config';

/**
 * Copy tipado de las páginas de empresa (§8.5–§8.8): /proceso, /emprendedores,
 * /empresas y /nosotros. Donde la guía da el copy, se usa exacto; donde lo deja
 * abierto, se redacta sin cifras ni promesas y se anota en TODO.md con ⚠️.
 * Sin duraciones orientativas ni garantías no confirmadas.
 */

/** Titular con 1–2 palabras de acento en serif cursiva. */
export type TitleParts = { before: string; accent: string; after: string };

export type PageMeta = { title: string; description: string; path: string };

export type HeroCopy = { label: string; h1: TitleParts; intro: string; cta?: Cta; secondary?: Cta };

export type Pillar = { n?: string; title: string; text?: string };

export type SectionCopy = { label: string; title: TitleParts; intro?: string };

export type ProcessPhase = ProcessStep & {
  objective: string;
  weDo: string;
  youGet: string;
  weNeed: string;
};

/** Toma preguntas de la FAQ global por su enunciado exacto (misma respuesta, sin duplicar copy). */
function pickFaq(questions: readonly string[]): FaqItem[] {
  return questions
    .map((q) => faq.find((f) => f.q === q))
    .filter((f): f is FaqItem => Boolean(f));
}

const crumbs = {
  proceso: { name: 'Proceso', href: '/proceso' },
  emprendedores: { name: 'Para emprendedores', href: '/emprendedores' },
  empresas: { name: 'Para empresas', href: '/empresas' },
  nosotros: { name: 'Nosotros', href: '/nosotros' },
} as const;

/* ───────────────────────── /proceso (§8.5) ───────────────────────── */

type PhaseDetail = Pick<ProcessPhase, 'objective' | 'weDo' | 'youGet' | 'weNeed'>;

/** Detalle por fase (base: processSteps). ⚠️ Sin duración orientativa: pendiente de negocio. */
const phaseDetails: readonly PhaseDetail[] = [
  {
    objective: 'Entender tu idea, tu contexto y qué significa éxito para ti.',
    weDo: 'Escuchamos, hacemos preguntas y te decimos con honestidad si podemos ayudarte y por dónde empezaríamos.',
    youGet: 'Una primera orientación sobre el enfoque y los siguientes pasos.',
    weNeed: 'Tu idea tal y como está hoy, aunque no esté definida del todo, y saber quién tomará las decisiones.',
  },
  {
    objective: 'Dejar por escrito qué vamos a construir, qué no, y en qué condiciones.',
    weDo: 'Definimos el alcance, los entregables, los plazos y el presupuesto. Si algo cambia, lo hablamos antes, no después.',
    youGet: 'Una propuesta cerrada con alcance, entregables, plazos y presupuesto. Sin letra pequeña.',
    weNeed: 'Revisar la propuesta, resolver dudas y confirmar el alcance antes de empezar.',
  },
  {
    objective: 'Validar flujos e interfaz antes de escribir código.',
    weDo: 'Diseñamos los flujos y la interfaz y montamos un prototipo navegable que puedes probar.',
    youGet: 'Los flujos, el diseño de la interfaz y un prototipo navegable para validar.',
    weNeed: 'Feedback a tiempo y acceso a los materiales necesarios: marca, contenidos y ejemplos reales.',
  },
  {
    objective: 'Construir el producto en entregas cortas y visibles, ajustando el rumbo con lo que aprendemos.',
    weDo: 'Desarrollamos por sprints, con entregas que puedes ver y probar. Priorizamos juntos lo que viene después.',
    youGet: 'Avances reales en cada entrega, en un entorno donde puedes probarlos, y un tablero compartido con el estado del proyecto.',
    weNeed: 'Probar cada entrega, darnos feedback y decidir prioridades en las reuniones de seguimiento.',
  },
  {
    objective: 'Publicar, medir y seguir mejorando el producto contigo.',
    weDo: 'Preparamos el lanzamiento, publicamos y medimos. Después seguimos contigo con mantenimiento y nuevas versiones.',
    youGet: 'El producto en producción, el código fuente, los diseños y la documentación, según lo acordado en el contrato.',
    weNeed: 'Los accesos necesarios para publicar (dominio, cuentas) y una decisión sobre cómo quieres seguir evolucionando el producto.',
  },
] as const;

export const processPhases: readonly ProcessPhase[] = processSteps.flatMap((step, i) => {
  const detail = phaseDetails[i];
  return detail ? [{ ...step, ...detail }] : [];
});

export const procesoPage = {
  meta: {
    title: 'Cómo trabajamos · Proceso de desarrollo de producto',
    description: 'Un proceso corto, visible y por fases. Sabes qué pasa en cada momento, qué recibes y cuándo.',
    path: '/proceso',
  },
  crumbs: [crumbs.proceso],
  hero: {
    label: 'Proceso',
    h1: { before: 'Cómo trabajamos, ', accent: 'sin sorpresas', after: '.' },
    intro: 'Un proceso corto, visible y por fases. Sabes qué pasa en cada momento, qué recibes y cuándo.',
    cta: secondaryCta,
  },
  timeline: {
    label: 'Las cinco fases',
    title: { before: 'Un camino ', accent: 'claro', after: ', de la primera llamada al lanzamiento.' },
    intro: 'En cada fase sabes qué buscamos, qué hacemos, qué recibes y qué necesitamos de ti.',
  },
  /** Etiquetas de los cuatro bloques de cada fase */
  phaseLabels: { objective: 'Objetivo', weDo: 'Qué hacemos', youGet: 'Qué recibes', weNeed: 'Qué necesitamos de ti' },
  phases: processPhases,
  collaboration: {
    label: 'Cómo colaboramos',
    title: { before: 'Cómo ', accent: 'colaboramos', after: '' },
    intro: 'Trabajar juntos no debería exigirte perseguir a nadie. Así nos organizamos.',
    items: [
      {
        title: 'Canal de comunicación',
        text: 'Un canal directo para dudas y decisiones del día a día, sin cadenas de correos.',
      },
      {
        title: 'Reuniones de seguimiento',
        text: 'Reuniones cortas para revisar avances y decidir prioridades.',
      },
      {
        title: 'Tablero compartido',
        text: 'Un tablero donde ves el estado de cada tarea en todo momento.',
      },
      {
        // ⚠️ Cadencia de entregas pendiente de confirmar con negocio.
        title: 'Entregas semanales o quincenales',
        text: 'Entregas cortas y visibles cada una o dos semanas. Ves avances reales y ajustamos el rumbo.',
      },
    ],
  },
  principles: {
    label: 'Principios',
    title: { before: 'Nuestros ', accent: 'principios', after: '' },
    items: [
      { title: 'Transparencia', text: 'Sabes en qué punto está el proyecto, qué viene después y por qué.' },
      {
        title: 'Entregas pequeñas y frecuentes',
        text: 'Preferimos enseñar avances reales a menudo que una gran entrega al final.',
      },
      { title: 'Decisiones con datos', text: 'Medimos lo que importa y decidimos con lo que aprendemos.' },
      {
        title: 'Código que se puede heredar',
        text: 'Escribimos código claro y documentado, para que tú o tu equipo podáis continuarlo.',
      },
    ],
  },
  expectations: {
    label: 'Qué esperamos de ti',
    title: { before: 'Qué esperamos ', accent: 'de ti', after: '' },
    items: [
      { title: 'Feedback a tiempo', text: 'Revisar cada entrega y decirnos qué funciona y qué no.' },
      {
        title: 'Un interlocutor con capacidad de decisión',
        text: 'Una persona que pueda responder y tomar decisiones sin bloquear el avance.',
      },
      {
        title: 'Acceso a los materiales necesarios',
        text: 'Marca, contenidos, accesos y ejemplos reales cuando los necesitemos.',
      },
    ],
  },
  /** ⚠️ Solo lo que ya afirma la FAQ global. Revisión incluida y periodo de soporte: pendientes. */
  guarantees: {
    label: 'Garantías y soporte',
    title: { before: 'Garantías y ', accent: 'soporte', after: '' },
    items: [
      {
        title: 'Después del lanzamiento',
        text: 'Seguimos contigo: mantenimiento, mejoras y nuevas funcionalidades, con un plan acordado.',
      },
      {
        title: 'Lo que es tuyo',
        text: 'Al terminar recibes el código fuente, los diseños y la documentación, según lo acordado en el contrato.',
      },
    ],
  },
  faq: [
    ...pickFaq(['¿Necesito tener todo definido para empezar?', '¿Qué pasa después del lanzamiento?']),
    {
      q: '¿Cómo sé en qué punto está el proyecto?',
      a: 'Tienes un tablero compartido con el estado de cada tarea, reuniones de seguimiento y entregas cortas y visibles. Ves avances reales, no informes.',
    },
    {
      q: '¿Qué pasa si el alcance cambia durante el proyecto?',
      a: 'Lo hablamos antes, no después. Revisamos juntos prioridades, plazos y presupuesto, y dejamos el cambio por escrito.',
    },
  ] as readonly FaqItem[],
  cta: { primary: secondaryCta, secondary: primaryCta },
} as const;

/* ───────────────────────── /emprendedores (§8.6) ───────────────────────── */

export const emprendedoresPage = {
  meta: {
    title: 'Desarrollo de MVP y apps para emprendedores',
    description:
      'De la idea a un producto real en semanas. Validamos lo esencial y construimos lo mínimo que importa, para que pruebes tu idea con usuarios reales.',
    path: '/emprendedores',
  },
  crumbs: [crumbs.emprendedores],
  hero: {
    label: 'Para emprendedores',
    h1: { before: 'Tu idea, ', accent: 'lista para probarse', after: ' con usuarios reales.' },
    intro: 'De la idea a un producto real en semanas. Validamos lo esencial y construimos lo mínimo que importa.',
    cta: primaryCta,
    secondary: { label: 'Cómo trabajamos', href: '/proceso' },
  },
  pains: {
    label: 'Lo que solemos ver',
    title: { before: 'Lo que ', accent: 'solemos ver', after: '' },
    items: [
      {
        title: 'No sé por dónde empezar',
        text: 'Empezamos por una fase corta de definición: qué construir, qué no, y por qué.',
      },
      {
        title: 'Me da miedo gastar en algo que no funcione',
        text: 'Validamos lo esencial antes de construir y construimos lo mínimo que importa.',
      },
      {
        title: 'No tengo equipo técnico',
        text: 'Nos encargamos del producto completo: diseño, desarrollo y lanzamiento.',
      },
      {
        title: 'Necesito algo que enseñar a inversores o clientes',
        text: 'Primero un prototipo navegable; después, una primera versión real que puedas enseñar.',
      },
    ],
  },
  /** ⚠️ Nombres de las rutas pendientes de validar. Sin duraciones a propósito. */
  routes: {
    label: 'Cómo te ayudamos',
    title: { before: 'Tres ', accent: 'rutas', after: ' de trabajo' },
    intro: 'Según el punto en el que estés, empezamos por una u otra. Puedes encadenarlas o quedarte solo con una.',
    items: [
      { n: '01', title: 'Sprint de validación', text: 'Alcance + prototipo navegable.' },
      { n: '02', title: 'MVP', text: 'Diseño, desarrollo y lanzamiento de la primera versión.' },
      { n: '03', title: 'Evolución', text: 'Mejoras, nuevas funcionalidades y mantenimiento.' },
    ],
  },
  cases: {
    label: 'Casos',
    title: { before: 'Casos ', accent: 'relacionados', after: '' },
  },
  faq: [
    ...pickFaq([
      '¿Necesito tener todo definido para empezar?',
      '¿Cuánto cuesta un proyecto?',
      '¿De quién es el código y el diseño?',
    ]),
    {
      q: '¿Puedo empezar solo con el Sprint de validación?',
      a: 'Sí. Podemos encargarnos del producto completo o únicamente de una fase. El sprint termina con un alcance definido y un prototipo navegable que puedes enseñar a inversores o clientes.',
    },
  ] as readonly FaqItem[],
  cta: { primary: primaryCta },
} as const;

/* ───────────────────────── /empresas (§8.7) ───────────────────────── */

export const empresasPage = {
  meta: {
    title: 'Software a medida y automatización para empresas',
    description:
      'Portales, paneles, integraciones y automatizaciones que encajan con tu forma de trabajar, no al revés. Herramientas digitales que tu equipo realmente usa.',
    path: '/empresas',
  },
  crumbs: [crumbs.empresas],
  hero: {
    label: 'Para empresas',
    h1: { before: 'Herramientas digitales que ', accent: 'tu equipo', after: ' realmente usa.' },
    intro: 'Portales, paneles y herramientas internas que encajan con tu forma de trabajar, no al revés.',
    cta: secondaryCta,
    secondary: { label: 'Cómo trabajamos', href: '/proceso' },
  },
  problems: {
    label: 'Problemas que resolvemos',
    title: { before: 'Problemas que ', accent: 'resolvemos', after: '' },
    items: [
      {
        title: 'Datos dispersos',
        text: 'La información vive en hojas de cálculo, correos y herramientas que no se hablan entre sí.',
      },
      {
        title: 'Procesos manuales',
        text: 'Tu equipo pierde horas en tareas repetitivas que podrían estar automatizadas.',
      },
      {
        title: 'Herramientas que no encajan',
        text: 'Software genérico que obliga a tu equipo a adaptarse a él, y no al revés.',
      },
      {
        title: 'Integraciones que fallan',
        text: 'Conexiones entre sistemas que se rompen, duplican datos o nadie sabe mantener.',
      },
    ],
  },
  howWeWork: {
    label: 'Cómo trabajamos con equipos de empresa',
    title: { before: 'Cómo trabajamos con ', accent: 'equipos', after: ' de empresa' },
    items: [
      {
        n: '01',
        title: 'Alineación con stakeholders',
        text: 'Definimos juntos qué problema resolvemos, para quién y cómo mediremos que funciona.',
      },
      {
        n: '02',
        title: 'Coordinación con IT',
        text: 'Nos coordinamos con tu equipo técnico para accesos, integraciones y despliegue.',
      },
      {
        n: '03',
        title: 'Seguridad y protección de datos',
        text: 'Tratamos los datos de tu empresa con accesos por rol y buenas prácticas de seguridad desde el diseño.',
      },
      {
        n: '04',
        title: 'Formación al equipo',
        text: 'Acompañamos a las personas que van a usar la herramienta para que la adopten desde el primer día.',
      },
      {
        // ⚠️ Alcance del soporte pendiente de confirmar. Copy exacto de la FAQ global.
        n: '05',
        title: 'Soporte',
        text: 'Seguimos contigo: mantenimiento, mejoras y nuevas funcionalidades, con un plan acordado.',
      },
    ],
  },
  deliverables: {
    label: 'Entregables típicos',
    title: { before: 'Entregables ', accent: 'típicos', after: '' },
    items: [
      { title: 'Portales', text: 'Para clientes, proveedores o empleados, con acceso por rol.' },
      { title: 'Paneles', text: 'Datos de distintas fuentes en un solo lugar, para decidir con información.' },
      {
        title: 'Integraciones',
        text: 'Conectamos las herramientas que ya usas para que los datos fluyan sin copiar y pegar.',
      },
      { title: 'Automatizaciones', text: 'Flujos que eliminan trabajo manual entre tus herramientas.' },
      { title: 'Asistentes de IA', text: 'Agentes que responden, clasifican o preparan trabajo a partir de tus datos.' },
    ],
  },
  /** ⚠️ Prácticas a confirmar una a una con la práctica real antes de publicar. */
  security: {
    label: 'Seguridad y cumplimiento',
    title: { before: 'Seguridad y ', accent: 'cumplimiento', after: '' },
    intro: 'Prácticas que aplicamos en cada proyecto y que concretamos contigo según el contexto de tu empresa.',
    items: [
      { title: 'Accesos y roles', text: 'Cada persona ve y hace solo lo que le corresponde, con permisos por rol.' },
      {
        title: 'Cifrado',
        text: 'Datos cifrados en tránsito y en reposo, con los proveedores y servicios que acordemos.',
      },
      { title: 'Copias de seguridad', text: 'Copias periódicas y un plan de recuperación definido contigo.' },
      {
        title: 'Tratamiento de datos conforme a la normativa aplicable',
        text: 'Documentamos quién accede, a qué y para qué, y tratamos los datos conforme a la normativa aplicable.',
      },
    ],
  },
  cases: {
    label: 'Casos',
    title: { before: 'Casos ', accent: 'relacionados', after: '' },
  },
  faq: [
    ...pickFaq([
      '¿Trabajáis con equipos técnicos que ya tenemos?',
      '¿Qué tecnologías usáis?',
      '¿De quién es el código y el diseño?',
    ]),
    {
      q: '¿Podéis integraros con las herramientas que ya usamos?',
      a: 'Sí. Conectamos tus herramientas actuales mediante integraciones y automatizaciones, y nos coordinamos con tu equipo de IT para los accesos y la seguridad.',
    },
  ] as readonly FaqItem[],
  cta: { primary: secondaryCta, secondary: primaryCta },
} as const;

/* ───────────────────────── /nosotros (§8.8) ───────────────────────── */

export const nosotrosPage = {
  meta: {
    title: 'Sobre nosotros · Estudio de producto digital',
    description:
      'Un estudio pequeño con estándares altos. Creemos que un buen producto digital es el resultado de decisiones claras: qué construir, qué no, y por qué.',
    path: '/nosotros',
  },
  crumbs: [crumbs.nosotros],
  /** ⚠️ H1 "estudio pequeño": ajustar si no es cierto. */
  hero: {
    label: 'Nosotros',
    h1: { before: 'Un estudio ', accent: 'pequeño', after: ' con estándares altos.' },
    intro: site.tagline,
    cta: { label: 'Hablemos', href: '/contacto' },
    secondary: { label: 'Ver proyectos', href: '/proyectos' },
  },
  manifesto: {
    label: 'Manifiesto',
    text: 'Creemos que un buen producto digital es el resultado de decisiones claras: qué construir, qué no, y por qué. Nuestro trabajo es ayudarte a tomarlas y llevarlas a producción.',
  },
  principles: {
    label: 'Principios',
    title: { before: 'Cuatro ', accent: 'principios', after: '' },
    items: [
      {
        title: 'Claridad antes que complejidad',
        text: 'Preferimos una solución sencilla que se entiende a una sofisticada que nadie sabe mantener.',
      },
      {
        title: 'Producto antes que pantallas',
        text: 'Diseñamos para resolver un problema y medirlo, no para llenar pantallas.',
      },
      {
        title: 'Entrega continua',
        text: 'Entregas pequeñas y frecuentes: ves avances reales y ajustamos el rumbo contigo.',
      },
      {
        title: 'Honestidad técnica',
        text: 'Te decimos lo que pensamos, también cuando no es lo que esperabas oír.',
      },
    ],
  },
  /** ⚠️ {{NOMBRE}}, rol, frase y foto pendientes. Si hay más personas, ampliar a fichas ({{EQUIPO}}). */
  team: {
    label: 'Equipo',
    title: { before: 'Quién está ', accent: 'detrás', after: '' },
    lead: {
      headline: 'Estudio liderado por {{NOMBRE}}, con una red de especialistas de confianza',
      name: '{{NOMBRE}}',
      role: '{{ROL}}',
    },
  },
  /** ⚠️ Colaboradores: confirmar disciplinas y, si procede, nombres. */
  collaborators: {
    label: 'Cómo nos apoyamos en otros',
    title: { before: 'Cómo nos apoyamos ', accent: 'en otros', after: '' },
    intro: 'Colaboradores de confianza con los que trabajamos cuando el proyecto lo necesita.',
    items: [
      { title: '3D', text: 'Modelado y render cuando el producto necesita imagen propia.' },
      { title: 'Motion', text: 'Animación y vídeo para explicar y dar vida al producto.' },
      { title: 'Copy', text: 'Textos que explican el producto con claridad.' },
      { title: 'Legal', text: 'Asesoría para contratos, privacidad y cumplimiento.' },
    ],
  },
  stack: {
    label: 'Stack y herramientas',
    title: { before: 'Stack y ', accent: 'herramientas', after: '' },
    intro: 'Elegimos según el proyecto: lo que acelera sin atarte.',
  },
  faq: [
    ...pickFaq([
      '¿Hacéis solo diseño o solo desarrollo?',
      '¿Trabajáis con equipos técnicos que ya tenemos?',
      '¿Qué tecnologías usáis?',
    ]),
    {
      q: '¿Quién va a trabajar en mi proyecto?',
      a: 'El estudio lo lidera {{NOMBRE}} y, cuando el proyecto lo necesita, contamos con una red de especialistas de confianza en 3D, motion, copy y legal.',
    },
  ] as readonly FaqItem[],
  cta: { primary: { label: 'Hablemos', href: '/contacto' } },
} as const;
