import type { Cta, FaqItem, ServiceSlug } from './types';
import { getServiceSummary } from './services';

/**
 * Detalle de cada página de servicio (§8.3). Copy EXACTO de la guía (§8.3.1–§8.3.4).
 * Los ⚠️ se mantienen tal cual: son datos pendientes de validar con negocio (ver TODO.md).
 *
 * - `seo.title` va SIN el sufijo ` | {{MARCA}}`: lo añade `buildMetadata` a partir de `site.name`.
 * - `h1` marca la palabra acento entre *asteriscos*; se renderiza con `<AccentTitle />`
 *   (`components/services/accent-title.tsx`) como `<em className="accent-word text-accent">`.
 * - Donde la guía solo da el título (pasos de 3 servicios, respuestas de FAQ, 3 puntos del índice)
 *   el copy es un borrador sin cifras, anotado en `pending` del informe.
 */

export type DeliverableIcon =
  | 'list-checks'
  | 'app-window'
  | 'layout-template'
  | 'rocket'
  | 'bar-chart'
  | 'file-text'
  | 'search'
  | 'pen-tool'
  | 'plug'
  | 'key-round'
  | 'graduation-cap'
  | 'map'
  | 'workflow'
  | 'network'
  | 'bot'
  | 'bell'
  | 'palette'
  | 'mouse-pointer'
  | 'code'
  | 'box'
  | 'gauge'
  | 'upload';

export type ServiceDeliverable = { icon: DeliverableIcon; text: string };

export type ServiceStep = { title: string; text: string };

export type ServiceDetail = {
  slug: ServiceSlug;
  seo: { title: string; description: string };
  /** H1 con la palabra acento entre *asteriscos* (1–2 palabras). */
  h1: string;
  intro: string;
  /** Para quién es (3 perfiles) */
  forWho: readonly string[];
  /** 3 puntos para la tarjeta grande del índice /servicios */
  highlights: readonly [string, string, string];
  /** Qué entregamos (6 puntos con icono de lucide) */
  deliverables: readonly ServiceDeliverable[];
  /** Cómo lo hacemos (4–5 pasos) */
  steps: readonly ServiceStep[];
  useCases: readonly string[];
  /** Marquesina de tecnología propia (editable) */
  stack: readonly string[];
  /** 4 preguntas (JSON-LD FAQPage) */
  faq: readonly FaqItem[];
  cta: Cta;
  /** `serviceType` del JSON-LD Service */
  serviceType: string;
};

const mvp: ServiceDetail = {
  slug: 'mvp',
  seo: {
    title: 'Desarrollo de MVP a medida para emprendedores',
    description:
      'Convierte tu idea en un MVP real: diseño, desarrollo y lanzamiento de tu primera versión, con foco en validar y aprender rápido.',
  },
  h1: 'De la idea a un *MVP* que puedes enseñar a usuarios reales.',
  intro:
    'Un MVP no es un producto a medias: es la versión más pequeña que te permite validar lo importante. Te ayudamos a decidir qué entra y qué no, y lo construimos bien.',
  forWho: [
    'Fundadores/as con una idea y sin equipo técnico',
    'Equipos que quieren validar antes de invertir más',
    'Startups que preparan una ronda y necesitan un producto que enseñar',
  ],
  highlights: [
    'Definición del alcance del MVP (qué sí, qué no, qué después)',
    'Prototipo navegable en Figma',
    'Producto funcional en producción (web o móvil)',
  ],
  deliverables: [
    { icon: 'list-checks', text: 'Definición del alcance del MVP (qué sí, qué no, qué después).' },
    { icon: 'app-window', text: 'Prototipo navegable en Figma.' },
    { icon: 'layout-template', text: 'Diseño de interfaz listo para desarrollo.' },
    { icon: 'rocket', text: 'Producto funcional en producción (web o móvil).' },
    { icon: 'bar-chart', text: 'Analítica básica para medir el uso real.' },
    { icon: 'file-text', text: 'Documentación y traspaso del código ⚠️ (según contrato).' },
  ],
  steps: [
    { title: 'Descubrimiento', text: 'Una sesión de trabajo y un mapa de funcionalidades.' },
    { title: 'Alcance del MVP', text: 'Matriz esencial / deseable / futuro.' },
    { title: 'Prototipo validado', text: 'Pruebas con usuarios reales antes de programar ⚠️ (nº de usuarios).' },
    { title: 'Construcción por sprints', text: 'Entregas cortas y visibles.' },
    { title: 'Lanzamiento y medición', text: 'Publicación y primeras métricas.' },
  ],
  useCases: [
    'Marketplace sencillo',
    'SaaS vertical',
    'App de reservas',
    'Herramienta para comunidades',
    'Panel con suscripciones y pagos',
  ],
  stack: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Pasarela de pago (p. ej. Stripe)', 'Vercel'],
  faq: [
    {
      q: '¿Qué diferencia hay entre MVP y prototipo?',
      a: 'El prototipo es una maqueta navegable para validar flujos y diseño antes de programar; no tiene lógica real. El MVP es un producto funcional en producción, con usuarios y datos reales, y solo lo mínimo necesario para validar tu hipótesis.',
    },
    {
      q: '¿Cuánto tarda? ⚠️',
      a: 'Normalmente entre 4 y 10 semanas, según la complejidad. Tras la primera llamada te damos una estimación concreta para tu caso.',
    },
    {
      q: '¿Puedo ampliar el MVP después?',
      a: 'Sí. El MVP se construye sobre una base pensada para crecer: nuevas funcionalidades, integraciones o versiones se añaden por fases, sin empezar de cero.',
    },
    {
      q: '¿Necesito saber de tecnología?',
      a: 'No. Te explicamos cada decisión en lenguaje claro y tú decides sobre producto y prioridades; de la parte técnica nos encargamos nosotros.',
    },
  ],
  cta: { label: 'Cuéntanos tu idea', href: '/contacto' },
  serviceType: 'Desarrollo de MVP',
};

const softwareAMedida: ServiceDetail = {
  slug: 'software-a-medida',
  seo: {
    title: 'Software a medida para empresas: portales, paneles y herramientas internas',
    description:
      'Diseñamos y desarrollamos software a medida que encaja con tus procesos: portales de clientes, paneles de operaciones, herramientas internas e integraciones.',
  },
  h1: 'Software que *encaja* con tu empresa, no al revés.',
  intro:
    'Portales, paneles de control, herramientas internas y plataformas diseñadas alrededor de tus procesos reales.',
  forWho: [
    'Pymes con procesos en hojas de cálculo y correo',
    'Equipos de operaciones',
    'Empresas que han superado una herramienta genérica',
  ],
  highlights: ['Análisis de procesos', 'Diseño UX de flujos', 'Aplicación web a medida'],
  deliverables: [
    { icon: 'search', text: 'Análisis de procesos.' },
    { icon: 'pen-tool', text: 'Diseño UX de flujos.' },
    { icon: 'app-window', text: 'Aplicación web a medida.' },
    { icon: 'plug', text: 'Integraciones (ERP, CRM, facturación).' },
    { icon: 'key-round', text: 'Roles y permisos.' },
    { icon: 'graduation-cap', text: 'Formación y documentación.' },
  ],
  steps: [
    {
      title: 'Análisis de procesos',
      text: 'Hablamos con quien usa cada herramienta y dibujamos el flujo real, con sus atajos y excepciones.',
    },
    {
      title: 'Diseño de flujos',
      text: 'Prototipo navegable de las pantallas clave, validado con tu equipo antes de programar.',
    },
    {
      title: 'Construcción por sprints',
      text: 'Entregas cortas y visibles; empezamos por lo que más trabajo quita.',
    },
    {
      title: 'Integraciones y datos',
      text: 'Conectamos ERP, CRM o facturación y migramos lo que ya tienes.',
    },
    {
      title: 'Formación y traspaso',
      text: 'Documentación, sesiones con el equipo y un plan de mantenimiento acordado.',
    },
  ],
  useCases: [
    'Portal de clientes',
    'Panel de operaciones',
    'Gestión de pedidos y stock',
    'CRM a medida',
    'Herramienta de presupuestos',
  ],
  stack: ['Next.js', 'TypeScript', 'PostgreSQL / Supabase', 'APIs e integraciones'],
  faq: [
    {
      q: '¿Software a medida o herramienta existente?',
      a: 'Si una herramienta del mercado cubre lo que necesitas, te lo diremos. El software a medida tiene sentido cuando tus procesos son parte de tu ventaja y las herramientas genéricas te obligan a adaptarte a ellas.',
    },
    {
      q: '¿Se integra con lo que ya usamos?',
      a: 'Sí. Diseñamos integraciones con tu ERP, CRM, facturación u otras herramientas a través de sus APIs, para que los datos fluyan sin duplicar trabajo.',
    },
    {
      q: '¿Quién lo mantiene?',
      a: 'Nosotros, si quieres: mantenimiento, mejoras y soporte con un plan acordado. Si prefieres que lo asuma tu equipo, lo entregamos documentado y con formación.',
    },
    {
      q: '¿Cómo se gestionan seguridad y datos?',
      a: 'Definimos roles y permisos por usuario, trabajamos con conexiones cifradas y copias de seguridad, y elegimos alojamiento acorde al RGPD. Revisamos contigo qué datos se guardan, dónde y quién accede.',
    },
  ],
  cta: { label: 'Agenda una llamada', href: '/contacto#agenda' },
  serviceType: 'Desarrollo de software a medida',
};

const automatizacionIa: ServiceDetail = {
  slug: 'automatizacion-ia',
  seo: {
    title: 'Automatización de procesos e IA para empresas',
    description:
      'Conectamos tus herramientas y automatizamos tareas repetitivas con n8n, Make, Power Automate y asistentes de IA, solo donde aportan valor real.',
  },
  h1: 'Procesos que *se hacen solos*, con IA donde de verdad aporta.',
  intro: 'Conectamos tus herramientas, eliminamos trabajo manual y añadimos IA solo donde mejora el resultado.',
  forWho: [
    'Equipos que copian datos entre herramientas',
    'Operaciones, ventas y atención al cliente saturadas',
    'Negocios que quieren usar IA sin perderse',
  ],
  highlights: [
    'Mapa de procesos priorizado por impacto',
    'Automatizaciones (n8n, Make, Power Automate según el caso)',
    'Asistentes y agentes de IA con tus datos',
  ],
  deliverables: [
    { icon: 'map', text: 'Mapa de procesos priorizado por impacto.' },
    { icon: 'workflow', text: 'Automatizaciones (n8n, Make, Power Automate según el caso).' },
    { icon: 'network', text: 'Integraciones por API.' },
    { icon: 'bot', text: 'Asistentes y agentes de IA con tus datos.' },
    { icon: 'bell', text: 'Monitorización y alertas.' },
    { icon: 'graduation-cap', text: 'Documentación y formación.' },
  ],
  steps: [
    {
      title: 'Mapa de procesos',
      text: 'Inventario de tareas repetitivas y priorización por impacto y esfuerzo.',
    },
    {
      title: 'Diseño del flujo',
      text: 'Qué se automatiza, qué se revisa a mano y dónde aporta la IA.',
    },
    {
      title: 'Construcción e integraciones',
      text: 'n8n, Make, Power Automate o código, conectados por API a tus herramientas.',
    },
    {
      title: 'Pruebas con datos reales',
      text: 'Validamos cada flujo contigo antes de activarlo.',
    },
    {
      title: 'Monitorización y mejora',
      text: 'Alertas, registro de ejecuciones y ajustes según lo que ocurre en producción.',
    },
  ],
  useCases: [
    'Alta de clientes automatizada',
    'Facturación y cobros',
    'Clasificación y respuesta de emails o tickets',
    'Informes automáticos',
    'Extracción de datos de documentos',
  ],
  stack: ['n8n', 'Make', 'Power Automate', 'APIs e integraciones', 'Asistentes de IA', 'Supabase'],
  faq: [
    {
      q: '¿Qué procesos merece la pena automatizar?',
      a: 'Los repetitivos, frecuentes y con reglas claras: copiar datos entre herramientas, enviar avisos, generar documentos o informes. Empezamos por un mapa de procesos y priorizamos por impacto y facilidad.',
    },
    {
      q: '¿Es seguro usar IA con datos de mi empresa? ⚠️',
      a: 'Depende de cómo se use. Definimos qué datos se envían y a qué proveedor, aplicamos las opciones de privacidad disponibles y documentamos cada flujo. Lo revisamos contigo antes de activarlo.',
    },
    {
      q: '¿Qué pasa si falla una automatización?',
      a: 'Cada flujo incluye monitorización y alertas: si algo falla, lo sabes y sabemos dónde. Diseñamos los procesos para que se puedan reintentar o completar a mano sin perder datos.',
    },
    {
      q: '¿No-code o código?',
      a: 'Lo que mejor encaje: n8n, Make o Power Automate cuando aceleran y no te atan; código cuando necesitas más control, rendimiento o lógica compleja. A menudo, una combinación de ambos.',
    },
  ],
  cta: { label: 'Agenda una llamada', href: '/contacto#agenda' },
  serviceType: 'Automatización de procesos e IA',
};

const productosCreativos: ServiceDetail = {
  slug: 'productos-creativos',
  seo: {
    title: 'Webs inmersivas y productos creativos interactivos',
    description:
      'Experiencias web con animación, 3D y storytelling por scroll: lanzamientos, herramientas interactivas y formatos digitales con identidad propia.',
  },
  h1: 'Experiencias digitales con *identidad propia*.',
  intro:
    'Webs inmersivas, herramientas interactivas y formatos digitales donde el diseño y la animación forman parte del producto.',
  forWho: ['Marcas que lanzan algo nuevo', 'Creadores y estudios', 'Proyectos culturales y educativos'],
  highlights: [
    'Dirección creativa y prototipo',
    'Diseño de interacción y motion',
    'Desarrollo front-end avanzado (animación, 3D si procede)',
  ],
  deliverables: [
    { icon: 'palette', text: 'Dirección creativa y prototipo.' },
    { icon: 'mouse-pointer', text: 'Diseño de interacción y motion.' },
    { icon: 'code', text: 'Desarrollo front-end avanzado (animación, 3D si procede).' },
    { icon: 'box', text: 'Producción de assets 3D/vídeo ⚠️.' },
    { icon: 'gauge', text: 'Optimización de rendimiento y accesibilidad.' },
    { icon: 'upload', text: 'Publicación y mantenimiento.' },
  ],
  steps: [
    {
      title: 'Dirección creativa',
      text: 'Concepto, referencias y guion de la experiencia: qué cuenta y cómo se mueve.',
    },
    {
      title: 'Prototipo de interacción',
      text: 'Pruebas de motion y 3D para validar la idea antes de producir.',
    },
    {
      title: 'Producción de assets',
      text: 'Ilustración, 3D o vídeo ⚠️ según el proyecto, optimizados para web.',
    },
    {
      title: 'Desarrollo front-end',
      text: 'Animación, scroll y 3D integrados en un sitio rápido y accesible.',
    },
    {
      title: 'Rendimiento y publicación',
      text: 'Medición en dispositivos reales, ajustes y lanzamiento.',
    },
  ],
  useCases: [
    'Web de lanzamiento con storytelling por scroll',
    'Configurador de producto',
    'Herramienta interactiva educativa',
    'Experiencia para un evento',
  ],
  stack: ['Next.js', 'GSAP', 'Three.js / React Three Fiber', 'Rive / Lottie', 'Blender'],
  faq: [
    {
      q: '¿Funcionará bien en móvil?',
      a: 'Sí. Diseñamos la experiencia para móvil desde el principio: versiones adaptadas de cada animación, recursos optimizados y una alternativa ligera cuando el dispositivo no da más de sí.',
    },
    {
      q: '¿Puede ser accesible y espectacular a la vez?',
      a: 'Sí, y es nuestro estándar: texto real en HTML, navegación por teclado, contraste suficiente y respeto a la preferencia de movimiento reducido. La animación suma, nunca sustituye al contenido.',
    },
    {
      q: '¿Quién produce el 3D o el vídeo?',
      a: 'Podemos producirlo nosotros, trabajar con tu equipo o coordinarnos con un estudio especializado ⚠️. Lo definimos en la propuesta según el alcance.',
    },
    {
      q: '¿Cuánto pesa?',
      a: 'Lo justo. Optimizamos cada recurso (imágenes, secuencias, modelos 3D), cargamos por fases y medimos el rendimiento real en dispositivos de gama media antes de publicar.',
    },
  ],
  cta: { label: 'Cuéntanos tu idea', href: '/contacto' },
  serviceType: 'Experiencias web interactivas y productos creativos',
};

export const serviceDetails: Readonly<Record<ServiceSlug, ServiceDetail>> = {
  mvp,
  'software-a-medida': softwareAMedida,
  'automatizacion-ia': automatizacionIa,
  'productos-creativos': productosCreativos,
};

export function getServiceDetail(slug: string): ServiceDetail | undefined {
  // Solo slugs declarados en content/services.ts
  if (!getServiceSummary(slug)) return undefined;
  return serviceDetails[slug as ServiceSlug];
}
