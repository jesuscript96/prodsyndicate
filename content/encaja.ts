import type { FaqItem } from './types';
import type { TitleParts } from './company';

/**
 * Landings de la campaña «Encaja» (anuncios de Meta y Google para dueños de empresas de 10 a 50
 * personas). Una sola estructura y tres ángulos: Tiempo, Decisión y Camino. El titular de cada
 * hero repite el anuncio que lleva a ella. Fuente: discovery del 4/11/2026 y
 * docs/encaja/propuesta-landings.md. Pendientes de negocio en TODO.md (⚠️ Encaja).
 *
 * Tono pedido por el negocio: la solución se cuenta como resultado para el dueño (tiempo que
 * recupera, control, no depender de nadie), no como tecnología. Sin cifras inventadas: cuánto
 * tiempo se ahorra se calcula con cada cliente en la llamada.
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

export type EncajaOutcome = { title: string; text: string };

export type EncajaLanding = {
  slug: EncajaSlug;
  /** Nombre interno del ángulo, para analítica */
  angle: 'tiempo' | 'decision' | 'camino';
  meta: { title: string; description: string; og: string };
  hero: { label: string; title: TitleParts; intro: string; visual: EncajaVisual };
  pains: { label: string; title: TitleParts; items: readonly string[]; chips?: readonly string[] };
  /** Lo que cambia para el dueño: un resultado por cada dolor */
  outcomes: { title: TitleParts; items: readonly EncajaOutcome[] };
  blocks: readonly EncajaBlock[];
  /** Línea que conecta el caso real con el ángulo */
  caseIntro: string;
  faq: readonly FaqItem[];
  /** One pager en PDF que recibe al reservar */
  onePager: {
    audience: string;
    headline: TitleParts;
    lead: string;
    /** «Hoy» → «Con AUTOMATO», fila a fila */
    pairs: readonly { before: string; after: string }[];
  };
};

/* ───────────── Comunes ───────────── */

export const encajaCta = { label: 'Agenda una llamada', href: '#contacto' } as const;

export const encajaCallNote = '30 minutos por videollamada, gratis y sin compromiso.';

/** Precio con la redacción que confirmó el negocio el 5/11/2026. */
export const encajaPrice = 'Desde 3.000 € en 6 meses.';

/** Cuánto tiempo se ahorra no se promete en cifras: se calcula con cada cliente. */
export const encajaTimeNote = 'Cuánto tiempo exactamente depende de tu empresa: lo calculamos contigo en la llamada.';

export const encajaOutcomesLabel = 'Lo que cambia';

/**
 * Caso real descrito por el negocio en el discovery (en pasado: «lo que se hizo fue una
 * aplicación…»). Sin nombre, sector ni cifras; el negocio confirmó el 5/11/2026 que se puede
 * publicar así.
 */
export const encajaCase = {
  label: 'Un caso real',
  title: { before: 'Un socio que hacía de ', accent: 'administrativo', after: ' comercial' },
  parts: [
    {
      title: 'Antes',
      text: 'Una empresa con un equipo comercial de varias personas. Uno de los socios pasaba buena parte del día haciendo de administrativo: perseguía por Excel y WhatsApp cómo iba cada venta y ayudaba a cada comercial con sus presupuestos.',
    },
    {
      title: 'Qué hicimos',
      text: 'Llevamos su forma de vender a una herramienta hecha a su medida, con los mismos pasos que el equipo ya conocía.',
    },
    {
      title: 'Después',
      text: 'El socio dejó de reconstruir a mano cómo iba cada venta: ahora lo ve de un vistazo, todo en un solo sitio y más seguro que en hojas sueltas.',
    },
  ],
} as const;

export const encajaSteps = {
  label: 'Cómo funciona',
  title: { before: 'De la llamada al ', accent: 'primer resultado', after: '' },
  items: [
    {
      n: '01',
      title: 'Llamada de 30 minutos',
      text: 'Nos cuentas qué te quita más tiempo y sales con una idea de cómo quedaría.',
    },
    {
      n: '02',
      title: 'Propuesta cerrada en pocos días',
      text: 'Qué haremos, en cuánto tiempo y por cuánto. Si hay que ajustar algo, lo hablamos antes, no después.',
    },
    {
      n: '03',
      title: 'Empezamos por lo que más duele',
      text: 'Un solo proceso para empezar. Ves un primer resultado en 2 a 4 semanas.',
    },
    {
      n: '04',
      title: 'Seguimos contigo',
      text: 'Si funciona, vamos a por lo siguiente, al ritmo de tu empresa.',
    },
  ],
} as const;

export const encajaWho = {
  label: 'Quién está detrás',
  title: { before: 'Alguien que entiende tu ', accent: 'negocio', after: '' },
  paragraphs: [
    'Detrás de AUTOMATO hay un programador, product manager y consultor de negocio con experiencia en venture capital. Lleva ocho años trabajando con negocios distintos, convirtiendo problemas del día a día en soluciones que ahorran tiempo.',
    'Trabajamos como una persona más de tu equipo: cerca, rápido y sin la carga de una contratación.',
  ],
} as const;

export const encajaMeeting = {
  title: 'Qué esperar de la llamada',
  items: [
    '30 minutos por videollamada, gratis y sin compromiso.',
    'Hablamos de lo que más tiempo te quita.',
    'Sales con una idea de cómo quedaría y de cuánto tiempo te puede ahorrar.',
    'En pocos días recibes una propuesta cerrada.',
    'Y un siguiente paso claro, aunque sea que no te conviene.',
  ],
} as const;

export const encajaClosing = {
  title: { before: 'Software que ', accent: 'encaja', after: ' con tu empresa, no al revés.' },
  text: 'Elige un hueco y te llega la invitación con el enlace de Google Meet.',
} as const;

/**
 * Asistente con IA de las landings (components/encaja/assistant, docs/encaja/asistente.md).
 * El aviso de DeepSeek es la información previa al consentimiento para la transferencia
 * internacional (política de privacidad, §6): no quitarlo ni suavizarlo.
 */
export const encajaAssistant = {
  launcher: '¿Tienes dudas?',
  title: 'Asistente de AUTOMATO',
  badge: 'IA',
  intro:
    'Soy un asistente con inteligencia artificial. Te ayudo a ver si lo que necesitas encaja con lo que hacemos y, si quieres, te propongo un hueco para la llamada.',
  notice:
    'Lo que escribas se envía a DeepSeek, un proveedor con servidores en China, para generar las respuestas. No incluyas datos personales ni confidenciales.',
  start: 'Entendido, empezar',
  greeting: 'Cuéntame qué es lo que más tiempo os quita en la empresa, o pregúntame lo que quieras sobre cómo trabajamos.',
  placeholder: 'Escribe tu pregunta…',
  footer: 'Asistente con IA: puede equivocarse. Lo que cuenta es lo que hablemos en la llamada.',
  limit: 'Hemos llegado al límite de esta conversación. Lo mejor es seguir en la llamada: elige un hueco abajo o déjanos tus datos.',
  starters: {
    tiempo: ['¿Cuánto cuesta?', '¿Funciona con mis Excel?', 'Hago de administrativo, ¿por dónde empezaríais?'],
    crecer: ['¿Cuánto cuesta?', 'No sé por dónde empezar', '¿Y si mi equipo no lo usa?'],
    procesos: ['¿Cuánto cuesta?', '¿Conectáis Odoo o HubSpot?', '¿Dónde usáis la IA?'],
  } satisfies Record<EncajaSlug, readonly string[]>,
} as const;

const faqPrice: FaqItem = {
  q: '¿Cuánto cuesta?',
  a: `${encajaPrice} Tras la llamada te enviamos una propuesta cerrada con lo que haremos, los plazos y el presupuesto. Si hay que ajustar algo, lo hablamos antes, no después.`,
};
const faqTools: FaqItem = {
  q: '¿Funciona con lo que ya uso?',
  a: 'Sí. Partimos de lo que ya usáis, como vuestras hojas de cálculo, el correo o el CRM, para que nadie tenga que copiar datos de un sitio a otro.',
};
const faqOwnership: FaqItem = {
  q: '¿De quién es lo que hacemos?',
  a: 'Tuyo. Al terminar recibes el código fuente, los diseños y la documentación, según lo acordado en el contrato.',
};

/* ───────────── One pager (PDF) ───────────── */

/**
 * One pager A4 de cada landing: va enlazado en la invitación de Google Calendar al reservar y en
 * la pantalla de confirmación. Se genera con `npm run encaja:presentaciones` a partir de este
 * archivo (scripts/encaja/build-presentations.mjs) y se sirve desde public/encaja/.
 */
export const encajaPresentationPath = (slug: EncajaSlug) => `/encaja/presentacion-${slug}.pdf`;

/** Línea de tiempo del one pager: solo plazos y precio reales, sin cifras inventadas. */
export const encajaTimeline = [
  { big: '30 min', title: 'Llamada', text: 'Gratis y sin compromiso.' },
  { big: 'Pocos días', title: 'Propuesta cerrada', text: 'Qué, cuándo y cuánto.' },
  { big: '2–4 sem.', title: 'Primer resultado', text: 'Con un solo proceso.' },
  { big: '6 meses', title: 'Desde 3.000 €', text: 'Seguimos contigo.' },
] as const;

/** El caso real en dos líneas, para el one pager. */
export const encajaCaseShort = {
  before: 'Un socio perseguía por Excel y WhatsApp cómo iba cada venta de su equipo.',
  after: 'Ahora lo ve todo de un vistazo, en un solo sitio y sin preguntar a nadie.',
} as const;

/* ───────────── Las tres landings ───────────── */

export const encajaLandings: readonly EncajaLanding[] = [
  {
    slug: 'tiempo',
    angle: 'tiempo',
    meta: {
      title: 'Correos, hojas de cálculo y post-its no son un sistema',
      description:
        'Si diriges tu empresa y acabas haciendo de administrativo, te quitamos esa operativa de encima. Llamada de 30 minutos, gratis.',
      og: '/encaja/og-tiempo.png',
    },
    hero: {
      label: 'Software a medida para empresas',
      title: { before: 'Correos, hojas de cálculo y post-its ', accent: 'no son un sistema', after: '.' },
      intro:
        'Diriges tu empresa y acabas haciendo de administrativo. Nos llevamos ese trabajo de encima para que vuelvas a lo que solo tú sabes hacer.',
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
    outcomes: {
      title: { before: 'Tu tiempo, de vuelta a ', accent: 'tu negocio', after: '' },
      items: [
        {
          title: 'Recuperas tus horas',
          text: 'Las que hoy se van en revisar, copiar y preguntar vuelven a lo que solo tú sabes hacer.',
        },
        {
          title: 'Sabes cómo va todo',
          text: 'Pedidos, stock y proyectos de un vistazo, sin perseguir a nadie por WhatsApp.',
        },
        {
          title: 'La empresa no depende de ti',
          text: 'Si faltas una semana, cada cosa sigue en su sitio.',
        },
      ],
    },
    blocks: [
      {
        id: 'un-sitio',
        label: 'Todo en su sitio',
        title: { before: '«pedidos_FINAL_v3 (2).xlsx» no es un ', accent: 'sistema de gestión', after: '.' },
        text: 'Lo que hoy está repartido entre hojas, correos y mensajes, en un solo sitio y siempre al día. Sabes cómo va tu empresa sin tener que preguntar.',
      },
      {
        id: 'sin-copiar',
        label: 'Lo repetitivo, solo',
        title: { before: 'Ctrl+C, Ctrl+V no es una ', accent: 'estrategia', after: '.' },
        text: 'Lo que hoy copias a mano de un sitio a otro se hace solo. Esas horas vuelven a ti.',
      },
    ],
    caseIntro: 'El socio que dejó de reconstruir en Excel cómo iba cada venta.',
    faq: [faqPrice, faqTools, faqOwnership],
    onePager: {
      audience: 'Para quien dirige su empresa y ha acabado haciendo de administrativo.',
      headline: { before: 'Deja de hacer de administrativo en ', accent: 'tu propia empresa', after: '.' },
      lead: 'Nos llevamos de encima la operativa que hoy te come el día, para que vuelvas a lo que solo tú sabes hacer.',
      pairs: [
        { before: 'Haces de administrativo en tu propia empresa.', after: 'Recuperas tus horas para dirigir.' },
        { before: 'Preguntas por WhatsApp cómo va cada pedido.', after: 'Ves cómo va todo de un vistazo.' },
        { before: 'Si faltas una semana, nadie encuentra nada.', after: 'Cada cosa sigue en su sitio sin ti.' },
      ],
    },
  },
  {
    slug: 'crecer',
    angle: 'decision',
    meta: {
      title: 'Tu empresa ha crecido. Tus herramientas, todavía no',
      description:
        'Ordenamos cómo trabaja tu empresa, empezando por lo que más tiempo os quita. Primer resultado en 2 a 4 semanas. Llamada de 30 minutos, gratis.',
      og: '/encaja/og-crecer.png',
    },
    hero: {
      label: 'Software a medida para empresas',
      title: { before: 'Tu empresa ha ', accent: 'crecido', after: '. Tus herramientas, todavía no.' },
      intro:
        'Lo que funcionaba cuando erais pocos se queda corto ahora. Te ayudamos a ordenar cómo trabaja tu empresa, empezando por lo que más tiempo os quita.',
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
    outcomes: {
      title: { before: 'Crecer sin que todo ', accent: 'pase por ti', after: '' },
      items: [
        {
          title: 'Tu equipo da abasto',
          text: 'Más trabajo sin que cada decisión tenga que pasar por ti.',
        },
        {
          title: 'Quien llega aprende antes',
          text: 'Cada cosa se hace siempre igual y está a la vista de todos.',
        },
        {
          title: 'Creces con control',
          text: 'Sabes cómo va el negocio, aunque cada mes haya más que vigilar.',
        },
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
            a: 'Empezamos por un solo proceso. En 2 a 4 semanas ves un primer resultado y decides si seguimos.',
          },
          {
            q: '¿Por dónde empiezo?',
            a: 'En la llamada elegimos juntos lo que más tiempo te quita y te enseñamos cómo quedaría.',
          },
          {
            q: '¿Y si mi equipo no lo usa?',
            a: 'Partimos de cómo ya trabaja tu equipo, sin obligarle a cambiar su manera de hacer las cosas. Y les acompañamos al principio.',
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
    caseIntro: 'Una empresa cuyo equipo comercial creció más rápido que su manera de organizarse.',
    faq: [
      faqPrice,
      {
        q: '¿Cuánto tarda?',
        a: 'Ves un primer resultado en 2 a 4 semanas. Empezamos por un solo proceso y crecemos desde ahí.',
      },
      faqOwnership,
    ],
    onePager: {
      audience: 'Para empresas que han crecido más rápido que su manera de trabajar.',
      headline: { before: 'Que tu empresa crezca ', accent: 'sin que todo pase por ti', after: '.' },
      lead: 'Ordenamos cómo trabaja tu equipo hoy, empezando por lo que más tiempo os quita.',
      pairs: [
        { before: 'Entra más trabajo y el equipo no da abasto.', after: 'El equipo da abasto sin que todo pase por ti.' },
        { before: 'Cada persona nueva tarda semanas en arrancar.', after: 'Quien llega aprende antes: todo se hace igual.' },
        { before: 'Todo depende de ti o de una sola persona.', after: 'Creces sin perder el control.' },
      ],
    },
  },
  {
    slug: 'procesos',
    angle: 'camino',
    meta: {
      title: 'Antes de hablar de IA, hablemos de tus procesos',
      description:
        'Entendemos cómo trabaja tu empresa y te quitamos de encima lo que más se repite, con lo que ya usas. Llamada de 30 minutos, gratis.',
      og: '/encaja/og-procesos.png',
    },
    hero: {
      label: 'Software a medida para empresas',
      title: { before: 'Antes de hablar de IA, hablemos de ', accent: 'tus procesos', after: '.' },
      intro:
        'Buena parte del trabajo aburrido de tu empresa ya puede hacerse solo. Empezamos por entender cómo trabajáis y te quitamos de encima lo que más se repite.',
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
    outcomes: {
      title: { before: 'Lo que se repite, ', accent: 'que se haga solo', after: '' },
      items: [
        {
          title: 'Nadie copia datos a mano',
          text: 'Lo que entra por un lado aparece donde tiene que aparecer.',
        },
        {
          title: 'Nada vive en una sola cabeza',
          text: 'Cada proceso queda claro para todo el equipo, aunque alguien falte.',
        },
        {
          title: 'Tecnología donde ahorra tiempo',
          text: 'También la IA, pero solo donde de verdad te quita trabajo.',
        },
      ],
    },
    blocks: [
      {
        id: 'metodo',
        label: 'El método',
        title: { before: 'Primero tus procesos, ', accent: 'después la tecnología', after: '' },
        steps: [
          'Vemos cómo trabajáis hoy, paso a paso.',
          'Elegimos lo que más se repite o más duele.',
          'Lo dejamos funcionando a vuestra manera.',
          'Y lo conectamos con lo que ya usáis.',
        ],
      },
      {
        id: 'conectado',
        label: 'Conectado',
        title: { before: 'Tu ERP, tu CRM y tu correo, por fin ', accent: 'hablando entre ellos', after: '.' },
        text: 'Lo que pasa en un programa aparece en el otro, sin que nadie lo copie. Partimos de lo que ya tienes, sin obligarte a cambiarlo todo.',
        chipsLabel: 'Por ejemplo',
        chips: ['Excel y Google Sheets', 'Odoo', 'HubSpot', 'Google Workspace', 'WhatsApp Business'],
      },
      {
        id: 'a-medida',
        label: 'A tu medida',
        title: { before: 'Herramientas internas hechas a ', accent: 'tu forma de trabajar', after: '.' },
        text: 'Tu equipo deja de repetir a mano lo de cada día y tú dejas de revisarlo todo. Si la IA ahorra trabajo, la usamos; si no, no.',
      },
    ],
    caseIntro: 'Del Excel y los grupos de WhatsApp a tenerlo todo en un solo sitio.',
    faq: [
      faqPrice,
      {
        q: '¿Necesito tener claro qué quiero?',
        a: 'No. Lo vemos juntos en la llamada, partiendo de cómo trabajáis hoy.',
      },
      faqTools,
    ],
    onePager: {
      audience: 'Para empresas con herramientas que no se hablan entre ellas.',
      headline: { before: 'Lo que hoy se hace a mano, ', accent: 'que se haga solo', after: '.' },
      lead: 'Entendemos cómo trabajáis y te quitamos de encima lo que más se repite, con lo que ya usas.',
      pairs: [
        { before: 'Los datos se copian a mano de un programa a otro.', after: 'Lo que entra por un lado aparece en el otro.' },
        { before: 'Hay procesos que solo están en la cabeza de alguien.', after: 'Cada proceso, claro para todo el equipo.' },
        { before: 'Te hablan de IA sin decirte para qué.', after: 'Tecnología solo donde ahorra tiempo.' },
      ],
    },
  },
] as const;

export const encajaSlugs = encajaLandings.map((l) => l.slug);

export function getEncajaLanding(slug: string): EncajaLanding | undefined {
  return encajaLandings.find((l) => l.slug === slug);
}
