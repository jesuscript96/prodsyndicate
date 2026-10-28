import { CHAPTER_WINDOWS, DEFAULT_FRAME_KEYS, serviceSequence, type StoryChapter, type StoryConfig } from '@/lib/story';
import type { ServiceSlug } from './types';

/**
 * Historias por scroll de las páginas de servicio (mismo motor que el hero de la home).
 * Cada escena se renderiza en Blender (scripts/hero/scenes/<slug>.py) sobre la partitura común
 * DEFAULT_FRAME_KEYS: reposos de los capítulos en las fracciones 0.09–0.12, 0.37–0.40, 0.64–0.66 y 0.90–1.
 * Los capítulos resumen el contenido de la guía para cada servicio (§8.3.1–§8.3.4): sin cifras ni promesas nuevas.
 * Las etiquetas (chips) se calibran sobre los frames reales (§6.8).
 */

type ChapterCopy = Pick<StoryChapter, 'id' | 'n' | 'title' | 'lead' | 'text'>;

const withWindows = (copy: readonly [ChapterCopy, ChapterCopy, ChapterCopy, ChapterCopy]): StoryChapter[] =>
  copy.map((c, i) => ({ ...c, ...CHAPTER_WINDOWS[i]! }));

export type ServiceStoryCopy = {
  /** Titular corto del bloque final; la palabra entre *asteriscos* va en serif cursiva */
  finalTitle: string;
};

export const SERVICE_STORY_COPY: Record<ServiceSlug, ServiceStoryCopy> = {
  mvp: { finalTitle: '¿Tienes una idea? *Hablemos.*' },
  'software-a-medida': { finalTitle: '¿Hablamos de tu *empresa*?' },
  'automatizacion-ia': { finalTitle: '¿Qué proceso *automatizamos* primero?' },
  'productos-creativos': { finalTitle: '¿Tienes algo que *lanzar*?' },
};

const base = {
  frameKeys: DEFAULT_FRAME_KEYS,
  finalCtaAt: 0.9,
  keyStride: 30,
  skipTarget: '#para-quien',
  srTitle: 'Cómo lo hacemos, en cuatro pasos',
} as const;

export const SERVICE_STORIES: Record<ServiceSlug, StoryConfig> = {
  mvp: {
    ...base,
    id: 'mvp',
    ...serviceSequence('mvp', 'v1'),
    chapters: withWindows([
      {
        id: 'descubrimiento',
        n: '01',
        title: 'Descubrimiento',
        lead: 'Muchas ideas, una conversación.',
        text: 'Una sesión de trabajo para entender el problema y mapear todas las funcionalidades posibles.',
      },
      {
        id: 'alcance',
        n: '02',
        title: 'Alcance',
        lead: 'Lo esencial, primero.',
        text: 'Cada idea va a esencial, deseable o futuro. El MVP lleva solo lo esencial.',
      },
      {
        id: 'construccion',
        n: '03',
        title: 'Construcción',
        lead: 'Lo mínimo que importa, bien hecho.',
        text: 'Diseño y desarrollo por sprints cortos y visibles, hasta tener un producto funcional.',
      },
      {
        id: 'lanzamiento',
        n: '04',
        title: 'Lanzamiento',
        lead: 'Con usuarios reales.',
        text: 'Publicamos y medimos el uso real para decidir el siguiente paso con datos.',
      },
    ]),
    chips: [
      { id: 'futuro', label: 'Futuro', at: 0.3, until: 0.46, x: '15%', y: '34%', mx: '14%', my: '36%' },
      { id: 'deseable', label: 'Deseable', at: 0.32, until: 0.46, x: '16%', y: '56%', mx: '15%', my: '56%' },
      { id: 'esencial', label: 'Esencial', at: 0.34, until: 0.46, x: '16%', y: '67%', mx: '15%', my: '64%' },
      { id: 'bien-hecho', label: 'Bien hecho', at: 0.54, until: 0.7, x: '73%', y: '36%', mx: '75%', my: '38%' },
      { id: 'usuarios', label: 'Usuarios reales', at: 0.9, until: 1, x: '25%', y: '26%', mx: '24%', my: '30%' },
      { id: 'medicion', label: 'Medición', at: 0.92, until: 1, x: '26%', y: '73%', mx: '25%', my: '70%' },
    ],
    mobileChips: ['esencial', 'bien-hecho', 'medicion'],
    canvasLabel:
      'Animación: una nube de ideas se ordena en esencial, deseable y futuro; lo esencial se ensambla en la pantalla de un móvil que se lanza a usuarios reales y se mide.',
    lastAlt: 'Móvil de pie con la interfaz del MVP, unido por hilos finos a cinco avatares de usuarios, junto a un gráfico de barras en crecimiento.',
    // La matriz del capítulo 2 es ancha y el texto va a la derecha: se aparta; en el 3 vuelve al centro
    stageShifts: [
      { at: 0.2, xPercent: -7 },
      { at: 0.45, xPercent: 0 },
      { at: 0.7, xPercent: -8 },
    ],
  },
  'software-a-medida': {
    ...base,
    id: 'software-a-medida',
    ...serviceSequence('software-a-medida', 'v1'),
    chapters: withWindows([
      {
        id: 'analisis',
        n: '01',
        title: 'Análisis',
        lead: 'Herramientas que no hablan entre sí.',
        text: 'Hojas de cálculo, correos y aplicaciones sueltas: empezamos entendiendo cómo trabaja de verdad tu equipo.',
      },
      {
        id: 'flujos',
        n: '02',
        title: 'Flujos',
        lead: 'Tus procesos, en un mapa.',
        text: 'Diseñamos los flujos alrededor de tu operación real, no al revés.',
      },
      {
        id: 'a-medida',
        n: '03',
        title: 'A medida',
        lead: 'Una pieza que encaja.',
        text: 'Una aplicación web a medida, integrada con lo que ya usáis: ERP, CRM o facturación.',
      },
      {
        id: 'en-uso',
        n: '04',
        title: 'En uso',
        lead: 'Un solo panel para todo el equipo.',
        text: 'Roles y permisos, los datos en un mismo sitio y un equipo formado para usarlo.',
      },
    ]),
    chips: [
      { id: 'hojas', label: 'Hojas de cálculo', at: 0.11, until: 0.2, x: '16%', y: '50%', mx: '22%', my: '47%' },
      { id: 'email', label: 'Email', at: 0.12, until: 0.2, x: '81%', y: '82%', mx: '79%', my: '77%' },
      { id: 'mapa', label: 'Mapa de procesos', at: 0.3, until: 0.46, x: '30%', y: '36%', mx: '28%', my: '38%' },
      { id: 'erp', label: 'ERP', at: 0.54, until: 0.7, x: '75%', y: '42%', mx: '77%', my: '47%' },
      { id: 'crm', label: 'CRM', at: 0.56, until: 0.7, x: '37%', y: '67%', mx: '33%', my: '65%' },
      { id: 'roles', label: 'Roles y permisos', at: 0.9, until: 1, x: '18%', y: '31%', mx: '22%', my: '33%' },
    ],
    mobileChips: ['hojas', 'mapa', 'erp'],
    canvasLabel:
      'Animación: herramientas de trabajo dispersas se ordenan en un mapa de procesos, una pieza de software a medida encaja en el hueco central, se integra con otros sistemas y se convierte en un panel de gestión compartido por todo el equipo.',
    lastAlt: 'Monitor con un panel de gestión a medida y tres insignias de usuario conectadas, que representan roles y permisos.',
    // El plano técnico es ancho: se aparta del lado del texto en los capítulos 2 (derecha), 3 (izquierda) y 4 (derecha)
    stageShifts: [
      { at: 0.2, xPercent: -8 },
      { at: 0.45, xPercent: 5 },
      { at: 0.7, xPercent: -6 },
    ],
  },
  'automatizacion-ia': {
    ...base,
    id: 'automatizacion-ia',
    ...serviceSequence('automatizacion-ia', 'v1'),
    chapters: withWindows([
      {
        id: 'mapa',
        n: '01',
        title: 'Mapa',
        lead: 'Trabajo manual que se repite.',
        text: 'Detectamos las tareas que copian datos de un sitio a otro y las priorizamos por impacto.',
      },
      {
        id: 'conexion',
        n: '02',
        title: 'Conexión',
        lead: 'Tus herramientas, conectadas.',
        text: 'Automatizaciones con n8n, Make o Power Automate e integraciones por API entre lo que ya usáis.',
      },
      {
        id: 'ia',
        n: '03',
        title: 'IA',
        lead: 'Solo donde aporta.',
        text: 'Asistentes y agentes que clasifican, extraen y responden con tus datos, dentro del flujo.',
      },
      {
        id: 'monitorizacion',
        n: '04',
        title: 'Monitorización',
        lead: 'Funciona solo, y lo vigilamos.',
        text: 'Monitorización y alertas para saber qué ha pasado en cada ejecución.',
      },
    ]),
    chips: [
      { id: 'manual', label: 'Manual', at: 0.11, until: 0.2, x: '35%', y: '56%', mx: '35%', my: '52%' },
      { id: 'trigger', label: 'Trigger', at: 0.3, until: 0.46, x: '18%', y: '29%', mx: '18%', my: '32%' },
      { id: 'api', label: 'API', at: 0.32, until: 0.46, x: '37%', y: '60%', mx: '37%', my: '59%' },
      { id: 'ia', label: 'IA', at: 0.54, until: 0.7, x: '56%', y: '36%', mx: '56%', my: '37%' },
      { id: 'alertas', label: 'Alertas', at: 0.9, until: 1, x: '41%', y: '33%', mx: '42%', my: '36%' },
      { id: 'hecho', label: 'Hecho', at: 0.92, until: 1, x: '74%', y: '71%', mx: '74%', my: '67%' },
    ],
    mobileChips: ['manual', 'api', 'ia', 'hecho'],
    canvasLabel:
      'Animación: una pila de documentos movidos a mano se convierte en un flujo de nodos conectados; los datos lo recorren, una esfera de IA los clasifica y llegan ordenados a bandejas vigiladas por un panel de monitorización.',
    lastAlt: 'Flujo automatizado: herramientas conectadas a un nodo de integración y a una esfera de IA que reparte los datos en tres bandejas, bajo un panel de monitorización.',
    // El grafo es ancho: se aparta del lado del texto en los capítulos 2 (derecha), 3 (izquierda) y 4 (derecha)
    stageShifts: [
      { at: 0.2, xPercent: -6 },
      { at: 0.45, xPercent: 6 },
      { at: 0.7, xPercent: -6 },
    ],
  },
  'productos-creativos': {
    ...base,
    id: 'productos-creativos',
    ...serviceSequence('productos-creativos', 'v1'),
    chapters: withWindows([
      {
        id: 'lienzo',
        n: '01',
        title: 'Lienzo',
        lead: 'Una idea en blanco.',
        text: 'Dirección creativa y prototipo: definimos qué tiene que sentir quien llegue a tu web.',
      },
      {
        id: 'identidad',
        n: '02',
        title: 'Identidad',
        lead: 'Forma, color y tipografía.',
        text: 'Un lenguaje visual propio, coherente en cada pantalla.',
      },
      {
        id: 'movimiento',
        n: '03',
        title: 'Movimiento',
        lead: 'El diseño también se mueve.',
        text: 'Interacción, animación y 3D cuando explican algo, no como adorno.',
      },
      {
        id: 'publicacion',
        n: '04',
        title: 'Publicación',
        lead: 'Espectacular, y también rápida.',
        text: 'Optimizada para móvil y accesible, con una versión estática para quien prefiere menos movimiento.',
      },
    ]),
    chips: [
      { id: 'direccion', label: 'Dirección creativa', at: 0.11, until: 0.2, x: '79%', y: '58%', mx: '76%', my: '68%' },
      { id: 'tipografia', label: 'Tipografía', at: 0.3, until: 0.46, x: '33%', y: '76%', mx: '34%', my: '70%' },
      { id: 'forma', label: 'Forma y color', at: 0.32, until: 0.46, x: '62%', y: '76%', mx: '64%', my: '70%' },
      { id: 'motion', label: 'Motion', at: 0.54, until: 0.7, x: '84%', y: '70%', mx: '80%', my: '70%' },
      { id: '3d', label: '3D', at: 0.56, until: 0.7, x: '62%', y: '82%', mx: '60%', my: '74%' },
      { id: 'accesible', label: 'Accesible y rápida', at: 0.9, until: 1, x: '48%', y: '24%', mx: '50%', my: '88%' },
    ],
    mobileChips: ['direccion', 'forma', 'motion'],
    canvasLabel:
      'Animación: una ventana de navegador en blanco se llena con la identidad de una marca, con forma, color y tipografía; los elementos cobran movimiento y profundidad, y la experiencia se publica en escritorio y móvil.',
    lastAlt: 'Ventana de navegador y móvil mostrando la misma experiencia digital, con un anillo ultramar flotando delante.',
    // Lanzamiento con el texto a la derecha: la composición final se aparta un poco a la izquierda
    stageShifts: [{ at: 0.7, xPercent: -6 }],
  },
};
