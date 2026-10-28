/**
 * Partitura del hero de la home (§6.6c). Todo lo ajustable en un solo sitio.
 *
 * FRAME_KEYS, CHAPTERS y CHIPS son la partitura compartida con la producción
 * del vídeo (§7.3): si cambia el material, se recalibran aquí (§6.8).
 * El motor es común a las páginas de servicio: components/story/scroll-story.tsx.
 */
import {
  DEFAULT_FRAME_KEYS,
  progressToFrame as progressToFrameWith,
  type SequenceVariant,
  type StoryChapter,
  type StoryChip,
  type StoryConfig,
} from '@/lib/story';

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
} as const satisfies { desktop: SequenceVariant; mobile: SequenceVariant };

export type HeroSequenceVariant = SequenceVariant;

/** Pósters (contrato en CLAUDE.md). El primero es idéntico al frame 1; el último, a la composición final. */
export const HERO_POSTERS = {
  first: `/sequence/${SEQUENCE_VERSION}/poster-first.webp`,
  firstMobile: `/sequence/${SEQUENCE_VERSION}/poster-first-mobile.webp`,
  last: `/sequence/${SEQUENCE_VERSION}/poster-last.webp`,
} as const;

/** Cada cuántos frames se conserva un bitmap ancla permanente (saltos rápidos). */
export const KEY_STRIDE = 30;

/** Partitura común (lib/story): reposos de los 4 capítulos. */
export const FRAME_KEYS = DEFAULT_FRAME_KEYS;

/** Progreso de scroll (0..1) → índice de frame (0-based, con decimales). */
export function progressToFrame(p: number, count: number): number {
  return progressToFrameWith(p, count, FRAME_KEYS);
}

export type { ChapterSide } from '@/lib/story';
export type HeroChapter = StoryChapter;

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

export type HeroChip = StoryChip;

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

/** Configuración completa de la historia de la home para el motor común. */
export const HOME_STORY: StoryConfig = {
  id: 'home',
  sequence: HERO_SEQUENCE,
  posters: HERO_POSTERS,
  frameKeys: FRAME_KEYS,
  chapters: CHAPTERS,
  chips: CHIPS,
  mobileChips: MOBILE_CHIPS,
  finalCtaAt: FINAL_CTA_AT,
  keyStride: KEY_STRIDE,
  canvasLabel:
    'Animación: un boceto a lápiz se transforma en una aplicación, se abre en capas de interfaz, lógica, datos y automatización, y termina como producto lanzado.',
  lastAlt: 'Composición final: la aplicación terminada en un móvil y un portátil, en producción.',
  srTitle: 'Cómo trabajamos, en cuatro pasos',
  skipTarget: HERO_SKIP_TARGET,
  // En el lanzamiento (texto a la derecha) la composición de portátil + móvil se aparta a la izquierda
  stageShifts: [{ at: 0.7, xPercent: -7 }],
};
