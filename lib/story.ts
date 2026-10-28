/**
 * Motor de historias por scroll (§6.2–§6.8), compartido por el hero de la home y
 * las páginas de servicio: tipos, partitura por defecto y mapeo scroll → frame.
 */

/** [progresoDeScroll 0..1, fracciónDeFrames 0..1]. Pendiente baja = reposo; alta = transformación. */
export type FrameKeys = ReadonlyArray<readonly [number, number]>;

export type SequenceVariant = {
  /** Prefijo de URL de los frames: `${base}0001.webp` */
  base: string;
  ext: 'webp';
  count: number;
  pad: number;
  /** Tope de resolución interna del canvas */
  maxPx: number;
  /** Longitud del pin de ScrollTrigger (`+=450%`) */
  pinLength: string;
  /** Frames decodificados a cada lado del actual */
  windowSize: number;
  /** Descargas simultáneas */
  concurrency: number;
};

export type ChapterSide = 'left' | 'right';

export type StoryChapter = {
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

export type StoryChip = {
  id: string;
  label: string;
  /** Progreso en el que aparece / desaparece (1 = se queda hasta el final) */
  at: number;
  until: number;
  /** Centro de la etiqueta en % del lienzo cuadrado (escritorio) */
  x: string;
  y: string;
  /** Centro en el lienzo retrato 4:5 (móvil); si falta, x/y */
  mx?: string;
  my?: string;
};

export type StoryConfig = {
  /** Identificador (analítica y atributos data-) */
  id: string;
  sequence: { desktop: SequenceVariant; mobile: SequenceVariant };
  /** first = frame 1 (LCP), firstMobile = frame 1 móvil, last = composición final */
  posters: { first: string; firstMobile: string; last: string };
  frameKeys: FrameKeys;
  chapters: ReadonlyArray<StoryChapter>;
  chips: ReadonlyArray<StoryChip>;
  /** En móvil solo se muestran estas etiquetas (≈ 2 por capítulo, §6.3) */
  mobileChips: ReadonlyArray<string>;
  /** Progreso en el que aparece la CTA final */
  finalCtaAt: number;
  /** Cada cuántos frames se conserva un bitmap ancla */
  keyStride: number;
  /** Descripción del canvas para lectores de pantalla */
  canvasLabel: string;
  /** Alt de la composición final (versión estática) */
  lastAlt: string;
  /** Título del bloque sr-only con la narrativa completa */
  srTitle: string;
  /** Destino del enlace "Saltar la animación" */
  skipTarget: string;
  /**
   * Escritorio: desplazamientos laterales del escenario (xPercent) a partir de cada progreso,
   * para apartar el objeto del lado donde va el texto del capítulo. Se encadenan en orden.
   */
  stageShifts?: ReadonlyArray<{ at: number; xPercent: number }>;
};

/** Partitura común: los reposos de los 4 capítulos (§6.5). Las escenas se producen sobre ella. */
export const DEFAULT_FRAME_KEYS: FrameKeys = [
  [0.0, 0.0],
  [0.12, 0.09], // fin de la intro
  [0.2, 0.12], // reposo 01
  [0.36, 0.37],
  [0.43, 0.4], // reposo 02
  [0.62, 0.64],
  [0.69, 0.66], // reposo 03
  [0.88, 0.9],
  [0.95, 0.985],
  [1.0, 1.0], // composición final
];

/** Ventanas de los 4 capítulos (progreso de scroll) y lado del texto. */
export const CHAPTER_WINDOWS = [
  { from: 0.04, to: 0.2, side: 'left' },
  { from: 0.26, to: 0.44, side: 'right' },
  { from: 0.5, to: 0.7, side: 'left' },
  { from: 0.76, to: 0.96, side: 'right' },
] as const satisfies ReadonlyArray<{ from: number; to: number; side: ChapterSide }>;

/**
 * Función pura: progreso de scroll (0..1) → índice de frame (0-based, con decimales).
 * Interpolación lineal por tramos entre las claves; sirve para cualquier número de frames.
 */
export function progressToFrame(p: number, count: number, keys: FrameKeys = DEFAULT_FRAME_KEYS): number {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last || count <= 1) return 0;

  const clamped = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  let f = last[1];

  if (clamped <= first[0]) {
    f = first[1];
  } else {
    for (let i = 1; i < keys.length; i++) {
      const prev = keys[i - 1];
      const curr = keys[i];
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

/** Secuencia estándar de una página de servicio: /sequence/<slug>/<versión>/{desktop,mobile}/f_NNNN.webp */
export function serviceSequence(
  slug: string,
  version: string,
  counts: { desktop: number; mobile: number } = { desktop: 120, mobile: 72 },
): Pick<StoryConfig, 'sequence' | 'posters'> {
  const root = `/sequence/${slug}/${version}`;
  return {
    sequence: {
      desktop: {
        base: `${root}/desktop/f_`,
        ext: 'webp',
        count: counts.desktop,
        pad: 4,
        maxPx: 1200,
        pinLength: '+=380%',
        windowSize: 8,
        concurrency: 6,
      },
      mobile: {
        base: `${root}/mobile/f_`,
        ext: 'webp',
        count: counts.mobile,
        pad: 4,
        maxPx: 720,
        pinLength: '+=280%',
        windowSize: 6,
        concurrency: 4,
      },
    },
    posters: {
      first: `${root}/poster-first.webp`,
      firstMobile: `${root}/poster-first-mobile.webp`,
      last: `${root}/poster-last.webp`,
    },
  };
}
