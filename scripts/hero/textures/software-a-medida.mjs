#!/usr/bin/env node
/**
 * Texturas de la escena «Una pieza que encaja» (página Software a medida, §8.3.2).
 * UI abstracta en el estilo de make-textures.mjs: barras redondeadas como texto, sin texto
 * legible ni logos. Escala: 1000 px por unidad de escena.
 *
 *   board.png        plano técnico con rejilla de puntos (2000×1500)
 *   sheet.png        hoja de cálculo (560×400)
 *   email.png        sobre de correo (460×310)
 *   doc.png          documento (360×460)
 *   appA.png         ventana de app con panel y gráfico (600×420)
 *   appB.png         ventana de app con lista (480×360)
 *   chat.png         mensajes (400×280)
 *   folder.png       carpeta (420×320)
 *   postit.png       nota adhesiva (240×240)
 *   piece_face.png   cara de la pieza con ranuras para los módulos (840×525, 16:10)
 *   dashboard.png    panel de gestión a medida del monitor (1900×1188, 16:10)
 *   role_a/b/c.png   insignias de rol (240×240)
 *
 * Uso (desde la raíz del proyecto): node scripts/hero/textures/software-a-medida.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'assets/hero/textures/software-a-medida';
await mkdir(OUT, { recursive: true });

const C = {
  white: '#FFFFFF', paper: '#F7F6F2', paper2: '#F6F6F3', line: '#E8E8E3', ink: '#0B0B0F', ink2: '#3A3A42',
  ink3: '#6B6B76', accent: '#2B3BFF', accentSoft: '#EEF0FF',
};

// ───────────── Utilidades ─────────────
const bar = (x, y, w, h, fill, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" opacity="${o}"/>`;
const box = (x, y, w, h, rx, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const dot = (cx, cy, r, fill, o = 1) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${o}"/>`;
const smooth = (pts) => {
  let s = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    s += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return s;
};
async function png(name, w, h, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/${name}.png`);
}

// ───────────── Plano técnico (2000×1500) ─────────────
{
  let s = `<rect width="2000" height="1500" fill="#EFEFEB"/>`;
  for (let y = 50; y < 1500; y += 100) for (let x = 50; x < 2000; x += 100) s += dot(x, y, 5, C.ink3, 0.32);
  // marco fino interior
  s += box(40, 40, 1920, 1420, 50, 'none', `stroke="${C.ink3}" stroke-opacity="0.25" stroke-width="3"`);
  await png('board', 2000, 1500, s);
}

// ───────────── Hoja de cálculo (560×400) ─────────────
{
  const W = 560, H = 400, HEAD = 54, IDX = 44, COLS = [IDX, 169, 294, 419, W];
  let s = `<rect width="${W}" height="${H}" fill="${C.white}"/>`;
  s += box(0, 0, W, HEAD, 0, C.paper2) + box(0, HEAD, IDX, H - HEAD, 0, C.paper2);
  for (let c = 0; c < 4; c++) s += bar(COLS[c] + 22, 20, 64, 14, C.ink, 0.9);
  for (let r = 0; r < 6; r++) {
    const y = HEAD + r * 57;
    s += `<rect x="0" y="${y + 56}" width="${W}" height="2" fill="${C.line}"/>`;
    s += dot(IDX / 2, y + 28, 5, C.ink3, 0.5);
    for (let c = 0; c < 4; c++) {
      const w = 40 + ((r * 7 + c * 13) % 5) * 14;
      const last = c === 3;
      s += bar(COLS[c] + 22, y + 21, last ? 54 : w, 13, last && r % 2 === 0 ? C.accent : C.ink2, last ? 0.9 : 0.7);
    }
  }
  for (const x of COLS.slice(0, 4)) s += `<rect x="${x}" y="0" width="2" height="${H}" fill="${C.line}"/>`;
  await png('sheet', W, H, s);
}

// ───────────── Sobre (460×310) ─────────────
{
  const W = 460, H = 310;
  let s = `<rect width="${W}" height="${H}" fill="${C.white}"/>`;
  s += `<path d="M14,14 L${W / 2},176 L${W - 14},14" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="M14,${H - 14} L182,160 M${W - 14},${H - 14} L${W - 182},160" fill="none" stroke="${C.ink3}" stroke-opacity="0.45" stroke-width="7" stroke-linecap="round"/>`;
  s += dot(W - 46, 46, 15, C.accent);
  await png('email', W, H, s);
}

// ───────────── Documento (360×460) ─────────────
{
  const W = 360, H = 460;
  let s = `<rect width="${W}" height="${H}" fill="${C.white}"/>`;
  s += bar(40, 46, 170, 20, C.ink);
  const widths = [280, 240, 300, 200, 262, 290, 180, 250, 226];
  widths.forEach((w, i) => (s += bar(40, 104 + i * 32, w, 12, C.ink3, 0.55)));
  s += box(40, 392, 130, 36, 18, C.accentSoft) + bar(66, 404, 78, 12, C.accent);
  await png('doc', W, H, s);
}

// ───────────── Ventana A: panel + gráfico (600×420) ─────────────
{
  const W = 600, H = 420;
  let s = `<rect width="${W}" height="${H}" fill="${C.white}"/>`;
  s += box(0, 0, W, 44, 0, C.paper2) + `<rect x="0" y="43" width="${W}" height="2" fill="${C.line}"/>`;
  [24, 52, 80].forEach((x) => (s += dot(x, 22, 7, C.ink3, 0.5)));
  s += box(0, 45, 150, H - 45, 0, C.paper2);
  [0, 1, 2, 3, 4].forEach((i) => (s += dot(28, 86 + i * 44, 7, i === 0 ? C.accent : C.ink3, i === 0 ? 1 : 0.5) + bar(46, 80 + i * 44, 76 - i * 6, 12, i === 0 ? C.ink : C.ink3, i === 0 ? 0.9 : 0.55)));
  s += box(180, 72, 190, 90, 16, C.accent) + bar(204, 96, 100, 20, C.white) + bar(204, 130, 70, 10, C.white, 0.7);
  s += box(386, 72, 190, 90, 16, C.paper2) + bar(410, 96, 100, 20, C.ink) + bar(410, 130, 70, 10, C.ink3, 0.6);
  s += box(180, 184, 396, 208, 18, C.paper2) + bar(204, 206, 120, 12, C.ink, 0.85);
  const hs = [60, 96, 78, 124, 104, 140, 118];
  hs.forEach((h, i) => (s += box(212 + i * 50, 366 - h, 30, h, 8, i === 5 ? C.accent : C.ink3, i === 5 ? '' : 'opacity="0.42"')));
  await png('appA', W, H, s);
}

// ───────────── Ventana B: lista (480×360) ─────────────
{
  const W = 480, H = 360;
  let s = `<rect width="${W}" height="${H}" fill="${C.white}"/>`;
  s += box(0, 0, W, 44, 0, C.paper2) + `<rect x="0" y="43" width="${W}" height="2" fill="${C.line}"/>`;
  [24, 52, 80].forEach((x) => (s += dot(x, 22, 7, C.ink3, 0.5)));
  s += bar(28, 66, 140, 14, C.ink);
  for (let r = 0; r < 5; r++) {
    const y = 118 + r * 50;
    s += dot(44, y, 14, r === 1 ? C.accentSoft : C.line);
    s += bar(70, y - 14, 150 + (r % 3) * 30, 12, C.ink, 0.85) + bar(70, y + 4, 90 + (r % 2) * 40, 9, C.ink3, 0.5);
    s += box(380, y - 13, 70, 26, 13, r === 1 ? C.accent : C.paper2) + (r === 1 ? bar(398, y - 4, 34, 8, C.white) : bar(398, y - 4, 34, 8, C.ink3, 0.5));
  }
  await png('appB', W, H, s);
}

// ───────────── Mensajes (400×280) ─────────────
{
  const W = 400, H = 280;
  let s = `<rect width="${W}" height="${H}" fill="${C.white}"/>`;
  s += box(28, 34, 230, 74, 26, C.paper2) + bar(54, 56, 150, 12, C.ink, 0.85) + bar(54, 78, 100, 10, C.ink3, 0.55);
  s += box(142, 126, 230, 74, 26, C.accent) + bar(168, 148, 170, 12, C.white) + bar(168, 170, 90, 10, C.white, 0.7);
  s += box(28, 216, 104, 40, 20, C.paper2);
  [56, 80, 104].forEach((x) => (s += dot(x, 236, 6, C.ink3, 0.55)));
  await png('chat', W, H, s);
}

// ───────────── Carpeta (420×320) ─────────────
{
  const W = 420, H = 320;
  let s = `<rect width="${W}" height="${H}" fill="${C.white}"/>`;
  s += box(0, 26, 160, 80, 20, C.line) + box(0, 64, W, H - 64, 22, C.paper2);
  s += `<rect x="0" y="64" width="${W}" height="3" fill="${C.line}"/>`;
  s += bar(40, 130, 170, 16, C.ink, 0.85) + bar(40, 166, 120, 12, C.ink3, 0.5) + bar(40, 194, 140, 12, C.ink3, 0.5);
  s += dot(W - 50, 150, 16, C.accentSoft) + dot(W - 50, 150, 6, C.accent);
  await png('folder', W, H, s);
}

// ───────────── Nota adhesiva (240×240) ─────────────
{
  let s = `<rect width="240" height="240" fill="${C.accentSoft}"/>`;
  s += `<rect x="0" y="0" width="240" height="26" fill="${C.accent}" opacity="0.14"/>`;
  [[62, 150], [98, 120], [134, 90], [170, 132]].forEach(([y, w]) => (s += bar(34, y, w, 13, C.ink2, 0.62)));
  await png('postit', 240, 240, s);
}

// ───────────── Cara de la pieza (840×525) y panel del monitor (1900×1188) ─────────────
// Las ranuras de la pieza coinciden con las tarjetas del panel (misma proporción 16:10 → escala ×2.262).
const SLOT_X = [218, 391, 564, 737], SLOT_Y = [150, 330], SLOT_W = 162, SLOT_H = 102;
{
  const W = 840, H = 525;
  let s = `<rect width="${W}" height="${H}" fill="${C.white}"/>`;
  s += box(0, 0, 119, H, 0, C.paper2) + `<rect x="118" y="0" width="2" height="${H}" fill="${C.line}"/>`;
  s += dot(28, 32, 11, C.ink, 0.85) + bar(46, 26, 50, 10, C.ink, 0.75);
  [0, 1, 2, 3].forEach((i) => (s += dot(28, 84 + i * 30, 5, C.ink3, 0.4) + bar(42, 79 + i * 30, 54 - i * 6, 9, C.ink3, 0.35)));
  s += bar(140, 32, 160, 12, C.ink, 0.8) + bar(140, 52, 90, 8, C.ink3, 0.5);
  for (const y of SLOT_Y) for (const x of SLOT_X) s += box(x - SLOT_W / 2, y - SLOT_H / 2, SLOT_W, SLOT_H, 14, C.paper2, `stroke="${C.ink3}" stroke-opacity="0.32" stroke-width="2.5" stroke-dasharray="12 9"`);
  s += box(137, 404, 681, 96, 14, C.paper2, `stroke="${C.ink3}" stroke-opacity="0.2" stroke-width="2"`);
  [0, 1, 2].forEach((r) => (s += bar(160, 420 + r * 26, 120, 8, C.ink3, 0.3) + bar(320, 420 + r * 26, 200, 8, C.ink3, 0.22) + bar(560, 420 + r * 26, 80, 8, C.ink3, 0.22)));
  await png('piece_face', W, H, s);
}
{
  const W = 1900, H = 1188, K = 2.262;
  const TX = SLOT_X.map((x) => x * K), TY = SLOT_Y.map((y) => y * K), TW = SLOT_W * K, TH = SLOT_H * K;
  let s = `<rect width="${W}" height="${H}" fill="${C.white}"/>`;
  // barra lateral
  s += box(0, 0, 270, H, 0, C.paper2) + `<rect x="269" y="0" width="2" height="${H}" fill="${C.line}"/>`;
  s += dot(60, 72, 24, C.ink) + bar(100, 62, 110, 18, C.ink);
  [0, 1, 2, 3, 4, 5].forEach((i) => (s += dot(60, 176 + i * 66, 10, i === 0 ? C.accent : C.ink3, i === 0 ? 1 : 0.5) + bar(88, 168 + i * 66, 120 - (i % 3) * 14, 15, i === 0 ? C.ink : C.ink3, i === 0 ? 0.9 : 0.55)));
  // cabecera
  s += bar(314, 70, 330, 24, C.ink) + bar(314, 112, 200, 14, C.ink3, 0.6);
  s += box(1560, 62, 210, 60, 30, C.accent) + bar(1612, 85, 106, 14, C.white);
  s += box(1790, 62, 60, 60, 30, C.paper2) + dot(1820, 92, 12, C.ink3, 0.5);
  // fila 1: indicadores
  TX.forEach((cx, i) => {
    const x = cx - TW / 2, y = TY[0] - TH / 2;
    const hl = i === 0;
    s += box(x, y, TW, TH, 28, hl ? C.accent : C.paper2);
    s += bar(x + 36, y + 44, 130, 16, hl ? C.white : C.ink3, hl ? 0.8 : 0.6);
    s += bar(x + 36, y + 92, 180 + (i % 2) * 30, 32, hl ? C.white : C.ink);
    const pts = [0, 1, 2, 3, 4, 5, 6].map((k) => [x + 36 + k * 48, y + 190 - ((k * 37 + i * 11) % 5) * 9 - (k === 6 ? 14 : 0)]);
    s += `<path d="${smooth(pts)}" fill="none" stroke="${hl ? C.white : C.accent}" stroke-width="6" stroke-linecap="round" opacity="${hl ? 0.85 : 1}"/>`;
  });
  // fila 2: barras, línea, equipo (roles), anillo
  {
    const [x, y] = [TX[0] - TW / 2, TY[1] - TH / 2];
    s += box(x, y, TW, TH, 28, C.paper2) + bar(x + 36, y + 36, 120, 14, C.ink, 0.85);
    [70, 110, 92, 140, 120, 164].forEach((h, k) => (s += box(x + 44 + k * 52, y + TH - 30 - h, 32, h, 9, k === 5 ? C.accent : C.ink3, k === 5 ? '' : 'opacity="0.42"')));
  }
  {
    const [x, y] = [TX[1] - TW / 2, TY[1] - TH / 2];
    s += box(x, y, TW, TH, 28, C.paper2) + bar(x + 36, y + 36, 120, 14, C.ink, 0.85);
    const pts = [[x + 40, y + 190], [x + 90, y + 150], [x + 140, y + 170], [x + 190, y + 110], [x + 240, y + 130], [x + 290, y + 84], [x + 330, y + 96]];
    s += `<path d="${smooth(pts)} L${x + 330},${y + 200} L${x + 40},${y + 200} Z" fill="${C.accentSoft}"/>`;
    s += `<path d="${smooth(pts)}" fill="none" stroke="${C.accent}" stroke-width="7" stroke-linecap="round"/>`;
    s += dot(x + 290, y + 84, 10, C.white) + `<circle cx="${x + 290}" cy="${y + 84}" r="10" fill="none" stroke="${C.accent}" stroke-width="6"/>`;
  }
  {
    const [x, y] = [TX[2] - TW / 2, TY[1] - TH / 2];
    s += box(x, y, TW, TH, 28, C.paper2) + bar(x + 36, y + 36, 120, 14, C.ink, 0.85);
    [[C.ink, C.accent], [C.accent, C.ink3], [C.ink3, C.line]].forEach(([av, pill], k) => {
      const yy = y + 86 + k * 52;
      s += dot(x + 56, yy, 17, av) + bar(x + 86, yy - 7, 110 - k * 16, 14, C.ink2, 0.75);
      s += box(x + TW - 110, yy - 11, 74, 22, 11, pill);
    });
  }
  {
    const [x, y] = [TX[3] - TW / 2, TY[1] - TH / 2];
    s += box(x, y, TW, TH, 28, C.paper2) + bar(x + 36, y + 36, 120, 14, C.ink, 0.85);
    const cx = x + TW / 2, cy = y + 146, r = 54;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.line}" stroke-width="22"/>`;
    s += `<path d="M${cx},${cy - r} A${r},${r} 0 1 1 ${cx - r * Math.cos(Math.PI / 5)},${cy + r * Math.sin(Math.PI / 5)}" fill="none" stroke="${C.accent}" stroke-width="22" stroke-linecap="round"/>`;
    s += bar(cx - 30, cy - 8, 60, 16, C.ink);
  }
  // fila 3: tabla
  const tx = TX[0] - TW / 2, tw = TX[3] + TW / 2 - tx;
  s += box(tx, 920, tw, 212, 28, C.paper2) + bar(tx + 36, 950, 160, 14, C.ink, 0.85);
  for (let r = 0; r < 3; r++) {
    const y = 992 + r * 46;
    s += box(tx + 24, y - 16, tw - 48, 38, 12, r % 2 ? C.paper2 : C.white);
    [0, 1, 2, 3].forEach((c) => (s += bar(tx + 56 + c * 330, y - 6, 140 + ((r + c) % 3) * 40, 12, C.ink2, 0.75)));
    s += box(tx + tw - 150, y - 11, 100, 22, 11, r === 0 ? C.accent : r === 1 ? C.accentSoft : C.line);
  }
  await png('dashboard', W, H, s);
}

// ───────────── Insignias de rol (240×240) ─────────────
for (const [k, bg, fg] of [['a', C.accentSoft, C.ink], ['b', C.paper2, C.accent], ['c', C.line, C.ink3]]) {
  let s = `<rect width="240" height="240" fill="${bg}"/>`;
  s += dot(120, 92, 34, fg) + box(56, 142, 128, 96, 48, fg);
  await png(`role_${k}`, 240, 240, s);
}

console.log(`Texturas listas en ${OUT}`);
