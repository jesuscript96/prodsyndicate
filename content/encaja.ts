import type { FaqItem } from './types';
import type { TitleParts } from './company';

/**
 * Landings de la campaña «Encaja» (anuncios de Meta y Google para dueños de empresas de 10 a 50
 * personas). Una sola estructura y tres ángulos: Tiempo, Decisión y Camino. El titular de cada
 * hero repite el anuncio que lleva a ella. Fuente: discovery del 4/11/2026 y
 * docs/encaja/propuesta-landings.md. Pendientes de negocio en TODO.md (⚠️ Encaja).
 */

export type EncajaSlug = 'tiempo' | 'crecer' | 'procesos';

export type EncajaVisual =
  | { type: 'image'; src: string; alt: string; width: number; height: number }
  | { type: 'flow' };

/** Bloque propio del ángulo: un titular de anuncio y su desarrollo. */
export type EncajaBlock = {
  id: string;
  label: string;
  title: TitleParts;
  text?: string;
  /** Preguntas con respuesta (las dudas de «Decisión») */
  qa?: readonly { q: string; a: string }[];
  /** Pasos numerados (el método de «Camino») */
  steps?: readonly string[];
  /** Etiquetas (procesos o herramientas) */
  chips?: readonly string[];
  chipsLabel?: string;
};

export type EncajaLanding = {
  slug: EncajaSlug;
  /** Nombre interno del ángulo, para analítica */
  angle: 'tiempo' | 'decision' | 'camino';
  meta: { title: string; description: string; og: string };
  hero: { label: string; title: TitleParts; intro: string; visual: EncajaVisual };
  pains: { label: string; title: TitleParts; items: readonly string[]; chips?: readonly string[] };
  blocks: readonly EncajaBlock[];
  /** Línea que conecta el caso real con el ángulo */
  caseIntro: string;
  faq: readonly FaqItem[];
};

/* ───────────── Comunes ───────────── */

export const encajaCta = { label: 'Agenda una llamada', href: '#contacto' } as const;

export const encajaCallNote = '30 minutos por videollamada, gratis y sin compromiso.';

/**
 * ⚠️ Precio dado por el negocio el 4/11/2026: «a partir de 3.000 € en 6 meses».
 * Interpretado como precio de partida por seis meses de trabajo; confirmar la redacción.
 */
export const encajaPrice = 'Desde 3.000 € por seis meses de trabajo.';

/**
 * Caso real descrito por el negocio en el discovery (en pasado: «lo que se hizo fue una
 * aplicación…»). Sin nombre, sector ni cifras. ⚠️ Confirmar que se puede publicar así.
 */
export const encajaCase = {
  label: 'Un caso real',
  title: { before: 'Un socio que hacía de ', accent: 'administrativo', after: ' comercial' },
  parts: [
    {
      title: 'Punto de partida',
      text: 'Una empresa con un equipo comercial de varias personas. Uno de los socios pasaba buena parte del día haciendo de administrativo: reconstruía en Excels y grupos de WhatsApp cómo iba cada venta y ayudaba a cada comercial a preparar sus presupuestos.',
    },
    {
      title: 'Qué hicimos',
      text: 'Una aplicación a medida en la que cada comercial tiene su usuario y dirección lo ve todo. Lo que vivía en Excel y en WhatsApp pasó a la aplicación, con pasos validados y la misma operativa a la que el equipo ya estaba acostumbrado.',
    },
    {
      title: 'Cómo quedó',
      text: 'Ventas, presupuestos y dudas en un solo sitio, con acceso por persona y más seguridad que en hojas sueltas y chats.',
    },
  ],
} as const;

export const encajaSteps = {
  label: 'Cómo funciona',
  title: { before: 'De la llamada a tu ', accent: 'herramienta', after: '' },
  items: [
    {
      n: '01',
      title: 'Llamada de 30 minutos',
      text: 'Nos cuentas el proceso que más tiempo te quita y sales con una idea de cómo quedaría.',
    },
    {
      n: '02',
      title: 'Propuesta cerrada en pocos días',
      text: 'Qué haremos, en cuánto tiempo y por cuánto. Si hay que ajustar el alcance, lo hablamos antes, no después.',
    },
    {
      n: '03',
      title: 'Piloto con un solo proceso',
      text: 'Empezamos por lo que más duele. Ves un primer resultado en 2 a 4 semanas.',
    },
    {
      n: '04',
      title: 'Crecemos contigo',
      text: 'Si funciona, seguimos con el siguiente proceso, al ritmo de tu empresa.',
    },
  ],
} as const;

export const encajaWho = {
  label: 'Quién está detrás',
  title: { before: 'Alguien que entiende tu ', accent: 'negocio', after: '' },
  paragraphs: [
    'Detrás de AUTOMATO hay un programador, product manager y consultor de negocio con experiencia en venture capital. Lleva ocho años trabajando con negocios distintos, convirtiendo problemas operativos en herramientas digitales.',
    'Trabajamos como una persona más de tu equipo: cerca, rápido y sin la carga de una contratación.',
  ],
} as const;

export const encajaMeeting = {
  title: 'Qué esperar de la llamada',
  items: [
    '30 minutos por videollamada, gratis y sin compromiso.',
    'Hablamos del proceso que más tiempo te quita.',
    'Sales con una idea de cómo quedaría tu herramienta.',
    'En pocos días recibes una propuesta cerrada.',
    'Y un siguiente paso claro, aunque sea que no te conviene.',
  ],
} as const;

export const encajaClosing = {
  title: { before: 'Software que ', accent: 'encaja', after: ' con tu empresa, no al revés.' },
  text: 'Déjanos tus datos y te escribimos para cerrar día y hora de la llamada.',
} as const;

const faqPrice: FaqItem = {
  q: '¿Cuánto cuesta?',
  a: `${encajaPrice} Tras la llamada te enviamos una propuesta cerrada con entregables, plazos y presupuesto. Si hay que ajustar el alcance, lo hablamos antes, no después.`,
};
const faqTools: FaqItem = {
  q: '¿Funciona con lo que ya uso?',
  a: 'Sí. Conectamos la herramienta con lo que ya usáis, como vuestras hojas de cálculo, el correo o el CRM, para que los datos fluyan sin copiar y pegar.',
};
const faqOwnership: FaqItem = {
  q: '¿De quién es la herramienta?',
  a: 'Tuya. Al terminar recibes el código fuente, los diseños y la documentación, según lo acordado en el contrato.',
};

/* ───────────── Presentaciones (PDF) ───────────── */

/**
 * Presentación de cada landing: va enlazada en la invitación de Google Calendar al reservar y en
 * la pantalla de confirmación. Se genera con `npm run encaja:presentaciones` a partir de este
 * archivo (scripts/encaja/build-presentations.mjs) y se sirve desde public/encaja/.
 */
export const encajaPresentationPath = (slug: EncajaSlug) => `/encaja/presentacion-${slug}.pdf`;

export const encajaDeckCommon = {
  kicker: 'Antes de nuestra llamada',
  meetingNote: 'Treinta minutos por videollamada, gratis y sin compromiso. Esto es lo que puedes esperar.',
  prepare: {
    title: { before: 'Cómo ', accent: 'prepararla', after: '' },
    items: [
      'Piensa en el proceso que más tiempo te quita. Con uno basta.',
      'Ten a mano un ejemplo real: la hoja de cálculo, el correo o el pedido de siempre.',
      'Si otra persona lo vive a diario, puede unirse. Dínoslo y la añadimos a la invitación.',
    ],
  },
  helpTitle: { before: 'Cómo te ', accent: 'ayudamos', after: '' },
  goodbye: 'Nos vemos en la llamada.',
} as const;

export const encajaDecks: Record<EncajaSlug, { lead: string; quote: string; quoteNote?: string }> = {
  tiempo: {
    lead: 'Para quien dirige su empresa y ha acabado haciendo de administrativo.',
    quote: '«Actúo como un administrativo, cuando debería estar pensando en lo importante.»',
    quoteNote: 'Si alguna vez lo has pensado, esta llamada es para ti.',
  },
  crecer: {
    lead: 'Para empresas que han crecido más rápido que sus herramientas.',
    quote: 'Lo que funcionaba cuando erais pocos se queda corto ahora.',
  },
  procesos: {
    lead: 'Para empresas con herramientas que no se hablan entre ellas.',
    quote: 'Primero tus procesos. La tecnología, después.',
  },
};

/* ───────────── Las tres landings ───────────── */

export const encajaLandings: readonly EncajaLanding[] = [
  {
    slug: 'tiempo',
    angle: 'tiempo',
    meta: {
      title: 'Correos, hojas de cálculo y post-its no son un sistema',
      description:
        'Si diriges tu empresa y acabas haciendo de administrativo, convertimos tu operativa en una herramienta hecha a tu medida. Llamada de 30 minutos, gratis.',
      og: '/encaja/og-tiempo.png',
    },
    hero: {
      label: 'Software a medida para empresas',
      title: { before: 'Correos, hojas de cálculo y post-its ', accent: 'no son un sistema', after: '.' },
      intro:
        'Diriges tu empresa y acabas haciendo de administrativo. No es falta de orden: es que tu operativa no tiene dónde vivir. La convertimos en una herramienta hecha a tu medida.',
      visual: {
        type: 'image',
        src: '/encaja/hero-tiempo.webp',
        alt: 'Una bandeja de entrada con 47 correos, una hoja de cálculo con errores, mensajes preguntando cuál es la última versión y notas adhesivas como «Llamar a almacén» o «Revisar stock antes del viernes».',
        width: 860,
        height: 1000,
      },
    },
    pains: {
      label: '¿Te suena?',
      title: {
        before: '¿Cuántas horas a la semana se te van pasando datos ',
        accent: 'de un sitio a otro',
        after: '?',
      },
      items: [
        'Eres el dueño y actúas como administrativo.',
        'Haces Excels para saber cómo va todo, porque nadie más puede dártelo.',
        'Preguntas por WhatsApp qué pedidos y qué ventas siguen abiertos.',
        'Si tú faltas una semana, nadie sabe dónde está cada cosa.',
      ],
      chips: ['Pedidos', 'Stock', 'Turnos y vacaciones', 'Seguimiento de proyectos'],
    },
    blocks: [
      {
        id: 'un-sitio',
        label: 'Un sitio para cada cosa',
        title: { before: '«pedidos_FINAL_v3 (2).xlsx» no es un ', accent: 'sistema de gestión', after: '.' },
        text: 'Cada persona con su usuario. Cada pedido, cada turno y cada proyecto en un solo sitio, con una sola versión de los datos. Tú entras y ves cómo va todo, sin preguntar.',
      },
      {
        id: 'sin-copiar',
        label: 'Lo repetitivo, solo',
        title: { before: 'Ctrl+C, Ctrl+V no es una ', accent: 'estrategia', after: '.' },
        text: 'Lo que hoy pasas a mano de una herramienta a otra pasa solo. Y tú vuelves a lo que solo tú sabes hacer: pensar en tu negocio.',
      },
    ],
    caseIntro: 'El socio que dejó de reconstruir en Excel cómo iba cada venta.',
    faq: [faqPrice, faqTools, faqOwnership],
  },
  {
    slug: 'crecer',
    angle: 'decision',
    meta: {
      title: 'Tu empresa ha crecido. Tus herramientas, todavía no',
      description:
        'Diseñamos la herramienta que tu empresa necesita ahora, empezando por un solo proceso. Primer resultado en 2 a 4 semanas. Llamada de 30 minutos, gratis.',
      og: '/encaja/og-crecer.png',
    },
    hero: {
      label: 'Software a medida para empresas',
      title: { before: 'Tu empresa ha ', accent: 'crecido', after: '. Tus herramientas, todavía no.' },
      intro:
        'Lo que funcionaba cuando erais pocos se queda corto ahora. Diseñamos la herramienta que tu empresa necesita hoy, empezando por un solo proceso.',
      visual: {
        type: 'image',
        src: '/encaja/hero-crecer.webp',
        alt: 'Una curva ultramar que sube desde una pequeña cuadrícula, rotulada «tus herramientas», hasta un punto alto rotulado «tu empresa».',
        width: 1040,
        height: 900,
      },
    },
    pains: {
      label: '¿Te suena?',
      title: { before: 'Señales de que ', accent: 'ya toca', after: '' },
      items: [
        'Ha entrado más trabajo y el equipo no da abasto.',
        'Cada persona nueva tarda semanas en saber cómo se hace cada cosa.',
        'Todo pasa por ti, o por una sola persona.',
        'Sabes que hay que digitalizarse, pero no por dónde empezar.',
      ],
    },
    blocks: [
      {
        id: 'dudas',
        label: 'Las dudas',
        title: { before: 'Las tres dudas ', accent: 'de siempre', after: ', resueltas' },
        qa: [
          {
            q: '¿Y si no funciona?',
            a: 'Empezamos por un piloto con un solo proceso. En 2 a 4 semanas ves un primer resultado y decides si seguimos.',
          },
          {
            q: '¿Por dónde empiezo?',
            a: 'En la llamada elegimos juntos el proceso que más tiempo te quita y te enseñamos cómo quedaría.',
          },
          {
            q: '¿Y si mi equipo no la usa?',
            a: 'La herramienta sigue la operativa que tu equipo ya conoce, con sus mismos pasos. Y les acompañamos al principio para que la adopten desde el primer día.',
          },
        ],
      },
      {
        id: 'inversion',
        label: 'La inversión',
        title: {
          before: 'Digitalizarte no es un gasto. Es la ',
          accent: 'inversión',
          after: ' que llevas tiempo aplazando.',
        },
        text: `${encajaPrice} Trabajamos como una persona más de tu equipo, sin la carga de una contratación.`,
      },
    ],
    caseIntro: 'Una empresa cuyo equipo comercial creció más rápido que sus herramientas.',
    faq: [
      faqPrice,
      {
        q: '¿Cuánto tarda?',
        a: 'Ves un primer resultado en 2 a 4 semanas. Empezamos por un solo proceso y crecemos desde ahí.',
      },
      faqOwnership,
    ],
  },
  {
    slug: 'procesos',
    angle: 'camino',
    meta: {
      title: 'Antes de hablar de IA, hablemos de tus procesos',
      description:
        'Entendemos cómo trabaja tu empresa, construimos la herramienta y la conectamos con lo que ya usas. Llamada de 30 minutos, gratis.',
      og: '/encaja/og-procesos.png',
    },
    hero: {
      label: 'Software a medida para empresas',
      title: { before: 'Antes de hablar de IA, hablemos de ', accent: 'tus procesos', after: '.' },
      intro:
        'Hoy un programa ya puede quitarte buena parte del trabajo aburrido. Primero entendemos cómo trabaja tu empresa. Después construimos la herramienta y la conectamos con lo que ya usas.',
      visual: { type: 'flow' },
    },
    pains: {
      label: '¿Te suena?',
      title: { before: 'Tu negocio no cabe en una ', accent: 'hoja de cálculo', after: '.' },
      items: [
        'Tu CRM no sabe lo que pasa en tu Excel de pedidos.',
        'Los datos se copian a mano de un programa a otro.',
        'Hay procesos que solo existen en la cabeza de alguien.',
      ],
    },
    blocks: [
      {
        id: 'metodo',
        label: 'El método',
        title: { before: 'Del proceso a la ', accent: 'herramienta', after: '' },
        steps: [
          'Vemos cómo trabajáis hoy, paso a paso.',
          'Elegimos el proceso que más se repite o más duele.',
          'Lo convertimos en una herramienta con vuestra operativa de siempre.',
          'La conectamos con lo que ya usáis.',
        ],
      },
      {
        id: 'conectado',
        label: 'Conectado',
        title: { before: 'Tu ERP, tu CRM y tu correo, por fin ', accent: 'hablando entre ellos', after: '.' },
        text: 'Partimos de lo que ya tienes en lugar de obligarte a cambiarlo todo.',
        chipsLabel: 'Por ejemplo',
        chips: ['Excel y Google Sheets', 'Odoo', 'HubSpot', 'Google Workspace', 'WhatsApp Business'],
      },
      {
        id: 'a-medida',
        label: 'A medida',
        title: { before: 'Herramientas internas hechas a ', accent: 'tu forma de trabajar', after: '.' },
        text: 'Aplicaciones web a medida para tu equipo. Y, donde de verdad aporta, un asistente de IA que prepara el trabajo repetitivo.',
      },
    ],
    caseIntro: 'Del Excel y los grupos de WhatsApp a una aplicación con pasos validados.',
    faq: [
      faqPrice,
      {
        q: '¿Necesito tener claro qué quiero?',
        a: 'No. Lo vemos juntos en la llamada, partiendo de cómo trabajáis hoy.',
      },
      faqTools,
    ],
  },
] as const;

export const encajaSlugs = encajaLandings.map((l) => l.slug);

export function getEncajaLanding(slug: string): EncajaLanding | undefined {
  return encajaLandings.find((l) => l.slug === slug);
}
