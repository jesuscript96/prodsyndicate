#!/usr/bin/env node
/**
 * Texturas de la escena «Identidad que se mueve» (Productos creativos e interactivos).
 * UI abstracta: barras redondeadas como texto, sin texto legible ni logos. Paleta §7.2.
 *
 *   assets/hero/textures/productos-creativos/canvas_blank.png  lienzo vacío de la ventana (1360×880)
 *   assets/hero/textures/productos-creativos/canvas_grid.png   retícula fina (1360×880)
 *   assets/hero/textures/productos-creativos/canvas_ui.png     experiencia publicada (1360×880)
 *   assets/hero/textures/productos-creativos/card_a.png        tarjeta de contenido «imagen» (720×500)
 *   assets/hero/textures/productos-creativos/card_b.png        impresión RGBA para la tarjeta de vidrio (520×360)
 *   assets/hero/textures/productos-creativos/card_c.png        tarjeta «dato» (440×300)
 *   assets/hero/textures/productos-creativos/phone_ui.png      la misma experiencia en móvil (540×1170)
 *
 * Uso: node scripts/hero/textures/productos-creativos.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'assets/hero/textures/productos-creativos';
await mkdir(OUT, { recursive: true });

const C = {
  white: '#FFFFFF', paper: '#F6F6F3', line: '#E8E8E3', ink: '#0B0B0F', ink2: '#3A3A42', ink3: '#6B6B76',
  accent: '#2B3BFF', accentSoft: '#EEF0FF',
};

const bar = (x, y, w, h, fill, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" opacity="${o}"/>`;
const rect = (x, y, w, h, r, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);
const save = (name, w, h, body) => sharp(svg(w, h, body)).png().toFile(`${OUT}/${name}`);

// ───────────── Lienzo (1360×880) ─────────────
const CW = 1360, CH = 880;

// Vacío: blanco puro
await save('canvas_blank.png', CW, CH, rect(0, 0, CW, CH, 0, C.white));

// Retícula: 12 columnas + líneas base cada 40 px, en gris cálido muy suave
{
  let s = rect(0, 0, CW, CH, 0, C.white);
  const m = 80, gut = 24, cols = 12;
  const cw = (CW - 2 * m - gut * (cols - 1)) / cols;
  for (let i = 0; i < cols; i++) s += rect(m + i * (cw + gut), 0, cw, CH, 0, C.paper);
  for (let y = 40; y < CH; y += 40) s += rect(0, y, CW, 2.5, 0, C.line);
  for (let i = 0; i <= cols; i++) {
    const x = i === cols ? CW - m : m + i * (cw + gut) - gut / 2;
    s += rect(x, 0, 2.5, CH, 0, C.line);
  }
  // Dos guías de composición en ultramar (muy finas)
  s += rect(0, 300, CW, 2, 0, C.accent, 'opacity="0.35"');
  s += rect(680, 0, 2, CH, 0, C.accent, 'opacity="0.35"');
  await save('canvas_grid.png', CW, CH, s);
}

// Experiencia publicada: titular grande a la izquierda, bloque visual a la derecha, fila de tarjetas
function uiCanvas() {
  let s = rect(0, 0, CW, CH, 0, C.white);
  // navegación
  s += `<circle cx="112" cy="82" r="18" fill="${C.ink}"/>` + bar(148, 74, 110, 16, C.ink);
  s += bar(620, 75, 70, 14, C.ink3, 0.6) + bar(716, 75, 90, 14, C.ink3, 0.6) + bar(832, 75, 60, 14, C.ink3, 0.6);
  s += rect(1098, 58, 168, 48, 24, C.ink) + bar(1142, 75, 80, 14, C.white);
  // titular (tres barras gruesas de tinta) + subtítulo + botón
  s += bar(92, 200, 520, 54, C.ink) + bar(92, 282, 430, 54, C.ink) + bar(92, 364, 300, 54, C.accent);
  s += bar(94, 470, 360, 16, C.ink3, 0.6) + bar(94, 504, 280, 16, C.ink3, 0.6);
  s += rect(92, 574, 220, 60, 30, C.accent) + bar(140, 596, 124, 16, C.white);
  s += rect(334, 574, 190, 60, 30, C.white, `stroke="${C.line}" stroke-width="3"`) + bar(380, 596, 98, 16, C.ink);
  // bloque visual a la derecha: panel con un arco y un disco ultramar
  s += rect(720, 170, 548, 470, 44, C.paper);
  s += `<path d="M 792 560 C 860 330 1080 300 1200 420" fill="none" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>`;
  s += `<circle cx="1120" cy="330" r="74" fill="${C.accent}"/>`;
  s += `<circle cx="1120" cy="330" r="30" fill="${C.white}"/>`;
  s += bar(792, 586, 150, 14, C.ink3, 0.6) + bar(792, 612, 100, 12, C.ink3, 0.45);
  // fila de tarjetas
  [0, 1, 2].forEach((i) => {
    const x = 92 + i * 400;
    s += rect(x, 690, 376, 130, 28, i === 1 ? C.accentSoft : C.paper);
    s += `<circle cx="${x + 46}" cy="${755}" r="20" fill="${i === 1 ? C.accent : C.ink}"/>`;
    s += bar(x + 86, 735, 190 - i * 30, 16, C.ink) + bar(x + 86, 765, 130, 12, C.ink3, 0.55);
  });
  return s;
}
await save('canvas_ui.png', CW, CH, uiCanvas());

// ───────────── Tarjetas de contenido (parallax) ─────────────
// A: «imagen» — gran placeholder con disco ultramar y arco, barras debajo
await save('card_a.png', 720, 500, (() => {
  let s = rect(0, 0, 720, 500, 0, C.white);
  s += rect(36, 36, 648, 300, 30, C.paper);
  s += `<path d="M 90 300 C 200 120 420 110 560 210" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>`;
  s += `<circle cx="560" cy="150" r="54" fill="${C.accent}"/><circle cx="560" cy="150" r="22" fill="${C.white}"/>`;
  s += bar(40, 376, 300, 24, C.ink) + bar(40, 420, 220, 14, C.ink3, 0.6) + bar(40, 448, 160, 14, C.ink3, 0.45);
  s += rect(560, 390, 120, 46, 23, C.accent) + bar(592, 407, 56, 12, C.white);
  return s;
})());

// B: impresión RGBA sobre vidrio esmerilado — solo barras (sin fondo)
await save('card_b.png', 520, 360, (() => {
  let s = '';
  s += `<circle cx="66" cy="70" r="26" fill="${C.ink}"/>` + bar(110, 54, 180, 18, C.ink) + bar(110, 86, 120, 12, C.ink3, 0.6);
  s += bar(40, 150, 440, 16, C.ink2, 0.8) + bar(40, 184, 380, 16, C.ink2, 0.8) + bar(40, 218, 300, 16, C.ink2, 0.8);
  s += rect(40, 272, 150, 48, 24, C.accent) + bar(78, 290, 74, 12, C.white);
  s += rect(210, 272, 120, 48, 24, C.white, `stroke="${C.ink}" stroke-width="3"`) + bar(240, 290, 60, 12, C.ink);
  return s;
})());

// C: «dato» — cifra grande como barra de tinta, mini-gráfico de barras, pill ultramar
await save('card_c.png', 440, 300, (() => {
  let s = rect(0, 0, 440, 300, 0, C.white);
  s += bar(36, 40, 120, 14, C.ink3, 0.6);
  s += bar(36, 76, 230, 44, C.ink);
  s += rect(320, 70, 84, 36, 18, C.accentSoft) + bar(342, 83, 40, 10, C.accent);
  const hs = [60, 90, 70, 120, 100, 150, 130];
  hs.forEach((h, i) => (s += rect(36 + i * 54, 260 - h, 36, h, 12, i === 5 ? C.accent : C.line)));
  return s;
})());

// ───────────── Móvil (540×1170): la misma experiencia ─────────────
await save('phone_ui.png', 540, 1170, (() => {
  let s = rect(0, 0, 540, 1170, 0, C.white);
  s += `<circle cx="52" cy="60" r="14" fill="${C.ink}"/>` + bar(80, 53, 80, 14, C.ink);
  s += rect(440, 40, 60, 40, 20, C.ink) + bar(456, 55, 28, 10, C.white);
  s += bar(40, 150, 420, 46, C.ink) + bar(40, 220, 340, 46, C.ink) + bar(40, 290, 230, 46, C.accent);
  s += bar(40, 376, 300, 14, C.ink3, 0.6) + bar(40, 404, 220, 14, C.ink3, 0.6);
  s += rect(40, 460, 180, 54, 27, C.accent) + bar(82, 480, 96, 14, C.white);
  s += rect(40, 560, 460, 330, 36, C.paper);
  s += `<path d="M 96 840 C 160 650 330 630 440 730" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>`;
  s += `<circle cx="400" cy="680" r="56" fill="${C.accent}"/><circle cx="400" cy="680" r="22" fill="${C.white}"/>`;
  s += rect(40, 930, 460, 110, 26, C.accentSoft) + `<circle cx="86" cy="985" r="18" fill="${C.accent}"/>` + bar(120, 970, 200, 14, C.ink) + bar(120, 996, 140, 10, C.ink3, 0.55);
  s += rect(0, 1090, 540, 80, 0, C.white) + rect(0, 1090, 540, 2, 0, C.line);
  [90, 210, 330, 450].forEach((x, i) => (s += `<circle cx="${x}" cy="1128" r="10" fill="${i === 0 ? C.accent : C.ink3}" opacity="${i === 0 ? 1 : 0.5}"/>`));
  return s;
})());

console.log(`Texturas listas en ${OUT}`);
