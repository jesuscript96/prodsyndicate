/**
 * Hojas de sprites de los objetos 3D (scripts/build-props.mjs): 48 frames en una rejilla 8 × 6,
 * en public/props/<nombre>/sheet.webp. El frame se elige con background-position.
 */
export const SPRITE_COLS = 8;
export const SPRITE_ROWS = 6;
export const SPRITE_FRAMES = 48;

export const spriteUrl = (name: string) => `/props/${name}/sheet.webp`;

/** background-position del frame (admite decimales y valores fuera de rango: da la vuelta). */
export function spriteFrame(frame: number): string {
  const f = ((Math.floor(frame) % SPRITE_FRAMES) + SPRITE_FRAMES) % SPRITE_FRAMES;
  const c = f % SPRITE_COLS, r = Math.floor(f / SPRITE_COLS);
  // Redondeo: el servidor y el navegador serializan igual (sin avisos de hidratación)
  return `${+((c / (SPRITE_COLS - 1)) * 100).toFixed(3)}% ${+((r / (SPRITE_ROWS - 1)) * 100).toFixed(3)}%`;
}
