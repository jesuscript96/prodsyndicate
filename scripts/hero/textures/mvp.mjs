#!/usr/bin/env node
/**
 * Texturas de la escena «Lo mínimo que importa» (servicio «MVP para emprendedores»).
 * UI abstracta: barras redondeadas como texto, sin texto legible ni logos.
 *
 *   assets/hero/textures/mvp/idea_00.png … idea_13.png     caras de las tarjetas de idea (tamaños variados)
 *   assets/hero/textures/mvp/block_{header,chart,list,cta}.png  bloques esenciales (= trozos exactos de la UI del móvil)
 *   assets/hero/textures/mvp/phone_base.png                pantalla vacía (barra de estado + tabs)
 *   assets/hero/textures/mvp/phone_ui.png                  pantalla completa (los 4 bloques en su sitio)
 *   assets/hero/textures/mvp/cards.json                    catálogo: tamaño en unidades de escena, color del cuerpo,
 *                                                          radio y posición del bloque en la pantalla del móvil
 *
 * Escala: 1600 px por unidad de escena (la pantalla del móvil mide 0.475×1.03 → 760×1648).
 * Uso (desde la raíz del proyecto): node scripts/hero/textures/mvp.mjs
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'assets/hero/textures/mvp';
await mkdir(OUT, { recursive: true });
const PPU = 1600;

const C = {
  white: '#FFFFFF', paper: '#F7F6F2', paper2: '#F6F6F3', line: '#E8E8E3', ink: '#0B0B0F',
  ink3: '#6B6B76', accent: '#2B3BFF', accentSoft: '#EEF0FF',
};

// ───────────── Utilidades ─────────────
let seed = 23;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const jit = (a) => (rnd() - 0.5) * 2 * a;
const bar = (x, y, w, h, fill, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" opacity="${o}"/>`;
const rrect = (x, y, w, h, rx, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const circ = (cx, cy, r, fill, o = 1, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${o}" ${extra}/>`;
const ring = (cx, cy, r, stroke, w, o = 1) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${w}" opacity="${o}"/>`;
const stroke = (c, w) => `stroke="${c}" stroke-width="${w}"`;
const path = (d, c, w, o = 1, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}" ${extra}/>`;
const smooth = (pts) => {
  let s = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    s += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return s;
};
const poly = (pts) => `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}`;
const svg = (w, h, body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}</svg>`;
const png = (w, h, body, bg, file) => sharp(Buffer.from(svg(w, h, body, bg))).png().toFile(`${OUT}/${file}`);
/** Trazo "a mano": deriva suave de senos + jitter mínimo. */
function handify(pts, amp = 2.0) {
  const f1 = rnd() * 6, f2 = rnd() * 6;
  return pts.map(([x, y], i) => [x + Math.sin(i * 0.35 + f1) * amp + jit(0.5), y + Math.cos(i * 0.29 + f2) * amp + jit(0.5)]);
}

// ───────────── Pantalla del móvil (760×1648) y sus bloques ─────────────
const PW = 760, PH = 1648, PM = 46, CW = 668;
const chartPts = (ox, oy) => [[40, 400], [140, 350], [240, 372], [340, 282], [440, 318], [540, 210], [628, 236]].map(([x, y]) => [x + ox, y + oy]);
const DRAW = {
  header: (ox, oy) => // 668×210
    circ(ox + 54, oy + 105, 44, C.ink) + bar(ox + 124, oy + 80, 250, 22, C.ink) + bar(ox + 124, oy + 120, 160, 16, C.ink3, 0.6) +
    rrect(ox + 500, oy + 70, 168, 70, 35, C.accentSoft) + bar(ox + 538, oy + 97, 92, 16, C.accent),
  chart: (ox, oy) => { // 668×480 (fondo paper2)
    const p = chartPts(ox, oy);
    return bar(ox + 40, oy + 44, 200, 20, C.ink) + bar(ox + 40, oy + 82, 120, 14, C.ink3, 0.6) +
      `<path d="${smooth(p)} L${ox + 628},${oy + 420} L${ox + 40},${oy + 420} Z" fill="${C.accentSoft}"/>` +
      path(smooth(p), C.accent, 9) +
      circ(ox + 540, oy + 210, 15, C.white, 1, stroke(C.accent, 8)) +
      `<rect x="${ox + 40}" y="${oy + 419}" width="588" height="3" fill="${C.line}"/>`;
  },
  list: (ox, oy) => // 668×400
    [66, 200, 334].map((y, i) =>
      circ(ox + 46, oy + y, 28, i === 0 ? C.accentSoft : C.line) + bar(ox + 96, oy + y - 18, 300 - i * 40, 18, C.ink) +
      bar(ox + 96, oy + y + 12, 180 - i * 20, 12, C.ink3, 0.55) + rrect(ox + 540, oy + y - 20, 128, 40, 20, C.paper2)).join(''),
  cta: (ox, oy) => bar(ox + 254, oy + 57, 160, 16, C.white), // 668×130 (fondo ultramar, píldora)
};
const BLOCKS = {
  header: { y: 130, h: 210, bg: C.white, r: 0.025 },
  chart: { y: 380, h: 480, bg: C.paper2, r: 0.025 },
  list: { y: 900, h: 400, bg: C.white, r: 0.025 },
  cta: { y: 1340, h: 130, bg: C.accent, r: 0.0406 },
};
const phoneBase = () =>
  bar(PM, 44, 90, 16, C.ink) + circ(650, 52, 9, C.ink) + circ(690, 52, 9, C.ink3, 0.5) +
  `<rect x="0" y="1540" width="${PW}" height="2" fill="${C.line}"/>` +
  [120, 293, 467, 640].map((x, i) => circ(x, 1600, 14, i === 0 ? C.accent : C.ink3, i === 0 ? 1 : 0.5)).join('');
await png(PW, PH, phoneBase(), C.white, 'phone_base.png');
await png(PW, PH, phoneBase() + Object.entries(BLOCKS).map(([k, b]) => rrect(PM, b.y, CW, b.h, b.r * PPU, b.bg) + DRAW[k](PM, b.y)).join(''), C.white, 'phone_ui.png');
for (const [k, b] of Object.entries(BLOCKS)) await png(CW, b.h, DRAW[k](0, 0), b.bg, `block_${k}.png`);

// ───────────── Tarjetas de idea (tamaños en unidades de escena) ─────────────
const IDEAS = [
  { w: 0.30, h: 0.22, draw: (W) => [0, 1, 2].map((i) => { const y = 70 + i * 106; return bar(44, y - 10, 170 + (i % 2) * 40, 20, C.ink, 0.9) + rrect(W - 136, y - 22, 92, 44, 22, i === 1 ? C.accent : C.line) + circ(i === 1 ? W - 68 : W - 114, y, 16, C.white); }).join('') },
  { w: 0.26, h: 0.26, draw: () => { let s = bar(44, 44, 150, 18, C.ink); for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const i = r * 5 + c; s += rrect(44 + c * 66, 100 + r * 66, 50, 50, 12, i === 7 ? C.accent : i % 3 === 0 ? C.line : C.white, i === 7 || i % 3 === 0 ? '' : stroke(C.line, 3)); } return s; } },
  { w: 0.34, h: 0.20, draw: () => bar(44, 50, 200, 20, C.ink) + rrect(44, 150, 456, 12, 6, C.line) + rrect(44, 150, 260, 12, 6, C.accent) + circ(304, 156, 24, C.white, 1, stroke(C.accent, 8)) + bar(44, 220, 120, 14, C.ink3, 0.6) + bar(380, 220, 120, 14, C.ink3, 0.6) },
  { w: 0.24, h: 0.30, draw: (W) => circ(W / 2, 130, 70, C.ink) + bar(112, 240, 160, 20, C.ink) + bar(142, 280, 100, 14, C.ink3, 0.6) + [0, 1, 2].map((i) => rrect(52 + i * 96, 340, 84, 40, 20, i === 0 ? C.accentSoft : C.line) + bar(72 + i * 96, 355, 44, 10, i === 0 ? C.accent : C.ink3, i === 0 ? 1 : 0.6)).join('') },
  { w: 0.32, h: 0.22, draw: () => bar(44, 44, 170, 18, C.ink) + [60, 110, 80, 150, 130, 200].map((h, i) => rrect(44 + i * 76, 300 - h, 52, h, 14, i === 5 ? C.accent : C.ink3, i === 5 ? '' : 'opacity="0.45"')).join('') + `<rect x="44" y="300" width="452" height="3" fill="${C.line}"/>` },
  { w: 0.28, h: 0.28, draw: () => { const cx = 224, cy = 190, r = 110, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 0.72; const pts = Array.from({ length: 25 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / 24; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }); return ring(cx, cy, r, C.line, 34) + path(poly(pts), C.accent, 34) + bar(174, 180, 100, 20, C.ink) + bar(44, 370, 160, 16, C.ink3, 0.6) + bar(260, 370, 140, 16, C.ink3, 0.6); } },
  { w: 0.36, h: 0.18, draw: () => rrect(44, 44, 488, 76, 38, C.white, stroke(C.line, 4)) + ring(92, 82, 16, C.ink3, 6) + path('M104,94 L118,108', C.ink3, 6) + bar(140, 74, 180, 16, C.ink3, 0.5) + rrect(44, 160, 120, 48, 24, C.accentSoft) + bar(70, 179, 68, 10, C.accent) + rrect(180, 160, 140, 48, 24, C.line) + bar(206, 179, 88, 10, C.ink3, 0.7) + rrect(336, 160, 100, 48, 24, C.line) + bar(362, 179, 48, 10, C.ink3, 0.7) },
  { w: 0.26, h: 0.22, draw: () => [0, 1, 2, 3, 4].map((i) => circ(70 + i * 68, 120, 26, i < 3 ? C.accent : C.line)).join('') + bar(44, 200, 250, 20, C.ink) + bar(44, 240, 160, 14, C.ink3, 0.6) },
  { w: 0.30, h: 0.26, draw: () => path('M60,340 C140,300 160,200 240,210 S360,120 420,90', C.ink3, 7, 0.8, 'stroke-dasharray="18 16"') + circ(300, 170, 34, C.accent) + circ(300, 170, 12, C.white) + bar(44, 370, 180, 14, C.ink3, 0.6) },
  { w: 0.22, h: 0.22, draw: () => [0, 1, 2].flatMap((j) => [0, 1, 2].map((i) => circ(72 + i * 104, 72 + j * 104, 34, i === 1 && j === 1 ? C.accent : C.line))).join('') },
  { w: 0.34, h: 0.24, draw: () => rrect(44, 44, 456, 70, 20, C.white, stroke(C.line, 4)) + bar(70, 73, 160, 12, C.ink3, 0.5) + rrect(44, 140, 456, 70, 20, C.white, stroke(C.line, 4)) + bar(70, 169, 220, 12, C.ink3, 0.5) + rrect(44, 250, 456, 80, 40, C.ink) + bar(214, 283, 116, 14, C.white) },
  { w: 0.28, h: 0.20, draw: () => ring(100, 110, 46, C.ink, 10) + circ(134, 78, 14, C.accent) + bar(176, 86, 200, 20, C.ink) + bar(176, 124, 130, 14, C.ink3, 0.6) + bar(44, 230, 300, 14, C.ink3, 0.4) },
  { w: 0.30, h: 0.30, draw: () => { const pts = Array.from({ length: 70 }, (_, k) => [240 + (30 + k * 2.4) * Math.cos(k * 0.42), 230 + (22 + k * 1.7) * Math.sin(k * 0.42)]); return path(poly(handify(pts, 2.5)), C.ink, 7, 0.85) + path(poly(handify([[330, 380], [360, 395], [400, 412], [430, 420]], 1.5)), C.ink, 6) + path('M404,398 L432,421 L402,432', C.ink, 6); } },
  { w: 0.26, h: 0.24, draw: () => [70, 190, 310].map((y, i) => (i < 2 ? rrect(44, y - 26, 52, 52, 14, C.ink) + path(`M58,${y} L74,${y + 16} L104,${y - 16}`, C.white, 7) : rrect(44, y - 26, 52, 52, 14, C.white, stroke(C.line, 4))) + bar(124, y - 10, 230 - i * 40, 20, C.ink, i < 2 ? 0.9 : 0.5)).join('') },
];
const catalog = Object.entries(BLOCKS).map(([k, b]) => ({
  name: k, file: `block_${k}.png`, w: CW / PPU, h: b.h / PPU, r: b.r, bg: b.bg, essential: true,
  block: [0, (PH / 2 - (b.y + b.h / 2)) / PPU],
}));
for (let i = 0; i < IDEAS.length; i++) {
  const c = IDEAS[i];
  const W = Math.round(c.w * PPU), H = Math.round(c.h * PPU);
  const file = `idea_${String(i).padStart(2, '0')}.png`;
  await png(W, H, c.draw(W, H), C.paper, file);
  catalog.push({ name: `idea_${i}`, file, w: c.w, h: c.h, r: 0.022, bg: C.paper, essential: false });
}
await writeFile(`${OUT}/cards.json`, JSON.stringify({ ppu: PPU, phone: [PW, PH], cards: catalog }, null, 1));
console.log(`Texturas listas en ${OUT} (${catalog.length} tarjetas)`);
