/**
 * Partitura del hero (§6.6c). Todo lo ajustable en un solo sitio.
 *
 * FRAME_KEYS, CHAPTERS y CHIPS son la partitura compartida con la producción
 * del vídeo (§7.3): si cambia el material, se recalibran aquí (§6.8).
 */

export const SEQUENCE_VERSION = 'v2';

export const HERO_SEQUENCE = {
  desktop: {
    base: `/sequence/${SEQUENCE_VERSION}/desktop/f_`,
    ext: 'webp',
    count: 150,
    pad: 4,
    maxPx: 1200,
    pinLength: '+=450%',
    windowSize: 8,
    concurrency: 6,
  },
  mobile: {
    base: `/sequence/${SEQUENCE_VERSION}/mobile/f_`,
    ext: 'webp',
    count: 90,
    pad: 4,
    maxPx: 720,
    pinLength: '+=320%',
    windowSize: 6,
    concurrency: 4,
  },
} as const;

export type HeroSequenceVariant = (typeof HERO_SEQUENCE)[keyof typeof HERO_SEQUENCE];

/** Pósters (contrato en CLAUDE.md). El primero es idéntico al frame 1; el último, a la composición final. */
export const HERO_POSTERS = {
  first: `/sequence/${SEQUENCE_VERSION}/poster-first.webp`,
  firstMobile: `/sequence/${SEQUENCE_VERSION}/poster-first-mobile.webp`,
  last: `/sequence/${SEQUENCE_VERSION}/poster-last.webp`,
} as const;

/** Cada cuántos frames se conserva un bitmap ancla permanente (saltos rápidos). */
export const KEY_STRIDE = 30;

/**
 * [progresoDeScroll 0..1, fracciónDeFrames 0..1]
 * Pendiente baja = "reposo" (se lee el capítulo). Pendiente alta = transformación.
 */
export const FRAME_KEYS: ReadonlyArray<readonly [number, number]> = [
  [0.0, 0.0],
  [0.12, 0.09], // fin del dibujo a lápiz
  [0.2, 0.12], // reposo 01 · boceto completo
  [0.36, 0.37], // losa de UI formada
  [0.43, 0.4], // reposo 02 · UI completa
  [0.62, 0.64], // capas separadas
  [0.69, 0.66], // reposo 03 · capas
  [0.88, 0.9], // reensamblaje + órbita
  [0.95, 0.985],
  [1.0, 1.0], // composición final
];

/**
 * Función pura: progreso de scroll (0..1) → índice de frame (0-based, con decimales).
 * Interpolación lineal por tramos entre FRAME_KEYS; sirve igual para 150 o 90 frames.
 */
export function progressToFrame(p: number, count: number): number {
  const k = FRAME_KEYS;
  const first = k[0];
  const last = k[k.length - 1];
  if (!first || !last || count <= 1) return 0;

  const clamped = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  let f = last[1];

  if (clamped <= first[0]) {
    f = first[1];
  } else {
    for (let i = 1; i < k.length; i++) {
      const prev = k[i - 1];
      const curr = k[i];
      if (!prev || !curr) break;
      if (clamped <= curr[0]) {
        const [p0, f0] = prev;
        const [p1, f1] = curr;
        f = p1 === p0 ? f1 : f0 + ((clamped - p0) / (p1 - p0)) * (f1 - f0);
        break;
      }
    }
  }
  return f * (count - 1);
}

export type ChapterSide = 'left' | 'right';

export type HeroChapter = {
  id: string;
  n: string;
  title: string;
  lead: string;
  text: string;
  /** Progreso de scroll en el que entra / sale el capítulo */
  from: number;
  to: number;
  side: ChapterSide;
};

export const CHAPTERS = [
  {
    id: 'idea',
    n: '01',
    title: 'Idea',
    lead: 'Todo empieza con una conversación.',
    text: 'Entendemos el problema antes de dibujar la primera pantalla.',
    from: 0.04,
    to: 0.2,
    side: 'left',
  },
  {
    id: 'diseno',
    n: '02',
    title: 'Diseño',
    lead: 'De boceto a interfaz.',
    text: 'Una experiencia clara, validada con usuarios reales antes de escribir código.',
    from: 0.26,
    to: 0.44,
    side: 'right',
  },
  {
    id: 'desarrollo',
    n: '03',
    title: 'Desarrollo',
    lead: 'Construido por capas.',
    text: 'Interfaz, lógica, datos y automatizaciones, listos para crecer contigo.',
    from: 0.5,
    to: 0.7,
    side: 'left',
  },
  {
    id: 'lanzamiento',
    n: '04',
    title: 'Lanzamiento',
    lead: 'En producción, y seguimos.',
    text: 'Todo conectado, medido y funcionando. Y no desaparecemos después del lanzamiento.',
    from: 0.76,
    to: 0.96,
    side: 'right',
  },
] as const satisfies ReadonlyArray<HeroChapter>;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

export type HeroChip = {
  id: string;
  label: string;
  /** Progreso en el que aparece / desaparece (1 = se queda hasta el final) */
  at: number;
  until: number;
  /** Posición relativa al lienzo (% del ancho / alto), centro de la etiqueta */
  x: string;
  y: string;
  /** Posición en el lienzo retrato de móvil (4:5); si falta, se usa x/y */
  mx?: string;
  my?: string;
};

/** Posiciones (% del lienzo) calibradas sobre el render v1 de Blender (§6.8): junto a la pieza que nombran. */
export const CHIPS = [
  { id: 'ux', label: 'UX / UI', at: 0.3, until: 0.46, x: '24%', y: '31%', mx: '17%', my: '30%' },
  { id: 'front', label: 'Interfaz', at: 0.52, until: 0.7, x: '25%', y: '28%', mx: '18%', my: '26%' },
  { id: 'logic', label: 'Lógica', at: 0.54, until: 0.7, x: '74%', y: '50%', mx: '81%', my: '49%' },
  { id: 'data', label: 'Datos', at: 0.56, until: 0.7, x: '25%', y: '66%' },
  { id: 'auto', label: 'Automatización', at: 0.58, until: 0.7, x: '75%', y: '79%' },
  { id: 'live', label: 'En producción', at: 0.9, until: 1.0, x: '79%', y: '28%', mx: '74%', my: '84%' },
] as const satisfies ReadonlyArray<HeroChip>;

export type ChipId = (typeof CHIPS)[number]['id'];

/** En móvil solo se muestran 2 chips por capítulo (§6.3). */
export const MOBILE_CHIPS: ReadonlyArray<ChipId> = ['ux', 'front', 'logic', 'live'];

/** Progreso en el que aparece la CTA final del hero (§6.4). */
export const FINAL_CTA_AT = 0.9;

/** Ancla a la que lleva el enlace "Saltar la animación" (§12). La home la define en su primera sección. */
export const HERO_SKIP_TARGET = '#inicio-contenido';
