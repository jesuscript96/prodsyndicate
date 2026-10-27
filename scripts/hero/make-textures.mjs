#!/usr/bin/env node
/**
 * Texturas del hero 3D (§7.6): pantallas abstractas, sin texto legible ni logos.
 *
 *   assets/hero/textures/sheet_01.png … sheet_19.png  hoja con el boceto a lápiz en progreso (1500×2000)
 *   assets/hero/textures/slab_graphite.png             recorte de la pantalla dibujada a lápiz (900×1200)
 *   assets/hero/textures/slab_ink.png                  las mismas líneas pasadas a tinta (900×1200)
 *   assets/hero/textures/ui_slab.png                   interfaz final (900×1200)
 *   assets/hero/textures/layer_{ui,logic,data,auto}.png  capas (RGBA, 900×1200)
 *   assets/hero/textures/phone_ui.png, laptop_ui.png   pantallas de los dispositivos
 *   assets/hero/textures/sketch.json                   posición de la punta del lápiz por frame (uv de la hoja)
 *
 * Uso: node scripts/hero/make-textures.mjs
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'assets/hero/textures';
await mkdir(OUT, { recursive: true });

const C = {
  white: '#FFFFFF', paper: '#F7F6F2', paper2: '#F6F6F3', line: '#E8E8E3', ink: '#0B0B0F', ink2: '#3A3A42',
  ink3: '#6B6B76', accent: '#2B3BFF', accentSoft: '#EEF0FF', graphite: '#45454D',
};

// ───────────── Utilidades ─────────────
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const jit = (a) => (rnd() - 0.5) * 2 * a;

const lerp = (a, b, t) => a + (b - a) * t;
const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);

/** Rectángulo redondeado como polilínea (sentido horario desde arriba-izquierda). */
function roundRectPts(x, y, w, h, r, seg = 6) {
  const pts = [];
  const corners = [
    [x + w - r, y + r, -Math.PI / 2, 0],
    [x + w - r, y + h - r, 0, Math.PI / 2],
    [x + r, y + h - r, Math.PI / 2, Math.PI],
    [x + r, y + r, Math.PI, (3 * Math.PI) / 2],
  ];
  pts.push([x + r, y]);
  for (const [cx, cy, a0, a1] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = lerp(a0, a1, i / seg);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  pts.push([x + r, y]);
  return pts;
}
function circlePts(cx, cy, r, seg = 28, start = -Math.PI / 2, sweep = Math.PI * 2.08) {
  return Array.from({ length: seg + 1 }, (_, i) => {
    const a = start + (sweep * i) / seg;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}
function ellipsePts(cx, cy, rx, ry, seg = 36, sweep = Math.PI * 2.12) {
  return Array.from({ length: seg + 1 }, (_, i) => {
    const a = -Math.PI * 0.9 + (sweep * i) / seg;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}
/** Subdivide para que el jitter parezca trazo a mano. */
function densify(pts, step = 18) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const n = Math.max(1, Math.round(dist(a, b) / step));
    for (let k = 1; k <= n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
  }
  return out;
}
function handify(pts, amp = 2.2) {
  const d = densify(pts);
  // Deriva suave (no ruido blanco): suma de senos con fase aleatoria
  const f1 = rnd() * 6, f2 = rnd() * 6;
  return d.map(([x, y], i) => [x + Math.sin(i * 0.35 + f1) * amp + jit(0.6), y + Math.cos(i * 0.29 + f2) * amp + jit(0.6)]);
}
function length(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  return L;
}
/** Polilínea recortada a la fracción t de su longitud; devuelve [puntos, punta]. */
function partial(pts, t) {
  if (t <= 0) return [[], pts[0]];
  if (t >= 1) return [pts, pts[pts.length - 1]];
  const target = length(pts) * t;
  let acc = 0;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (acc + d >= target) {
      const k = (target - acc) / d;
      const tip = [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
      out.push(tip);
      return [out, tip];
    }
    acc += d;
    out.push(pts[i]);
  }
  return [out, pts[pts.length - 1]];
}
const d = (pts) => (pts.length < 2 ? '' : `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}`);

// ───────────── Boceto: trazos en coordenadas de pantalla (900×1200) ─────────────
// Cada trazo: { pts, w } en coordenadas de pantalla; los de anotación, en coordenadas de hoja.
const SHEET_W = 1500, SHEET_H = 2000;
const SX = 300, SY = 390; // origen de la pantalla dentro de la hoja
const toSheet = (pts) => pts.map(([x, y]) => [x + SX, y + SY]);

const screen = [];
const S = (pts, w = 5) => screen.push({ pts, w });
S(roundRectPts(0, 0, 900, 1200, 64), 6); // marco
S(circlePts(92, 108, 34), 5); // avatar
S([[150, 96], [390, 96]]); S([[150, 132], [300, 132]], 4);
S(roundRectPts(700, 84, 124, 50, 25), 4); // pill
S(roundRectPts(60, 196, 780, 404, 38), 5); // tarjeta del gráfico
S([[110, 560], [790, 560]], 3); // eje
S([[110, 520], [230, 468], [330, 500], [450, 380], [560, 424], [680, 300], [790, 334]], 6); // línea del gráfico
S([[110, 250], [300, 250]], 4); // título de tarjeta
S(roundRectPts(60, 650, 370, 210, 32), 5); // stat 1
S([[100, 720], [300, 720]], 7); S([[100, 790], [240, 790]], 4);
S(roundRectPts(470, 650, 370, 210, 32), 5); // stat 2
S([[510, 720], [710, 720]], 7); S([[510, 790], [640, 790]], 4);
for (const y of [925, 1000]) {
  S(circlePts(102, y, 22, 20), 4);
  S([[150, y - 10], [460, y - 10]], 4); S([[150, y + 16], [340, y + 16]], 3);
  S(roundRectPts(720, y - 18, 104, 36, 18), 3);
}
S(roundRectPts(60, 1066, 780, 88, 44), 6); // botón principal
for (let i = 0; i < 9; i++) S([[150 + i * 70, 1140], [190 + i * 70, 1080]], 2.5); // sombreado del botón

const notes = [];
const N_ = (pts, w = 4) => notes.push({ pts, w });
// Cotas sobre la pantalla
N_([[SX, SY - 70], [SX + 900, SY - 70]], 3); N_([[SX, SY - 90], [SX, SY - 50]], 3); N_([[SX + 900, SY - 90], [SX + 900, SY - 50]], 3);
// Flecha desde el margen izquierdo hacia el gráfico
N_([[90, 760], [150, 700], [230, 650], [SX + 40, SY + 330]], 4);
N_([[SX + 40, SY + 330], [SX + 6, SY + 318]], 4); N_([[SX + 40, SY + 330], [SX + 20, SY + 300]], 4);
// Garabatos de nota (ilegibles) en el margen izquierdo
for (let i = 0; i < 3; i++) N_(Array.from({ length: 14 }, (_, k) => [40 + k * 15, 840 + i * 34 + Math.sin(k * 1.7 + i) * 7]), 3);
// Óvalo alrededor del botón
N_(ellipsePts(SX + 450, SY + 1110, 500, 92), 4);
// Flecha desde la derecha hacia la tarjeta 2
N_([[1450, 1010], [1380, 1060], [1300, 1090], [SX + 850, SY + 760]], 4);
N_([[SX + 850, SY + 760], [SX + 880, SY + 742]], 4); N_([[SX + 850, SY + 760], [SX + 876, SY + 784]], 4);
// Asterisco junto a la barra superior
for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) N_([[1300 + Math.cos(a) * 26, 470 + Math.sin(a) * 26], [1300 - Math.cos(a) * 26, 470 - Math.sin(a) * 26]], 3);
// Check junto a la lista
N_([[1290, 1360], [1315, 1392], [1370, 1320]], 4);

// Versiones "a mano"
const screenHand = screen.map((s) => ({ ...s, pts: handify(toSheet(s.pts)) }));
const notesHand = notes.map((s) => ({ ...s, pts: handify(s.pts, 2.6) }));

// ───────────── Hoja: frames 1–19 ─────────────
const ease = (t) => 1 - Math.pow(1 - t, 2.2);
const sheetBg = `
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.44  0 0 0 0 0.42  0 0 0 0.05 0"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${C.paper}"/>
  <rect width="100%" height="100%" filter="url(#grain)"/>`;

function strokesSvg(strokes, progress, color, opacity, double = true) {
  // progress 0..1 repartido por longitud acumulada
  const lens = strokes.map((s) => length(s.pts));
  const total = lens.reduce((a, b) => a + b, 0);
  let budget = total * progress;
  let tip = strokes[0].pts[0];
  let paths = '';
  strokes.forEach((s, i) => {
    if (budget <= 0) return;
    const t = Math.min(1, budget / lens[i]);
    budget -= lens[i];
    const [pts, tp] = partial(s.pts, t);
    if (t > 0) tip = tp;
    if (pts.length < 2) return;
    paths += `<path d="${d(pts)}" fill="none" stroke="${color}" stroke-width="${s.w * 1.7}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
    if (double) {
      const off = pts.map(([x, y]) => [x + 1.6, y + 1.2]);
      paths += `<path d="${d(off)}" fill="none" stroke="${color}" stroke-width="${s.w * 0.45}" stroke-linecap="round" opacity="${opacity * 0.45}"/>`;
    }
  });
  return { paths, tip };
}

const pencil = {};
for (let f = 1; f <= 19; f++) {
  // Pantalla: 18 % → 100 % entre f=1 y f=14; anotaciones: 0 → 100 % entre f=14 y f=19
  const ps = f >= 14 ? 1 : 0.3 + 0.7 * ease((f - 1) / 13);
  const pn = f <= 14 ? 0 : ease((f - 14) / 5);
  const a = strokesSvg(screenHand, ps, C.graphite, 0.92);
  const b = pn > 0 ? strokesSvg(notesHand, pn, C.graphite, 0.85) : { paths: '', tip: a.tip };
  const tip = pn > 0 ? b.tip : a.tip;
  pencil[f] = { u: tip[0] / SHEET_W, v: tip[1] / SHEET_H };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET_W}" height="${SHEET_H}">${sheetBg}${a.paths}${b.paths}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/sheet_${String(f).padStart(2, '0')}.png`);
}
await writeFile(`${OUT}/sketch.json`, JSON.stringify({ sheet: [SHEET_W, SHEET_H], screen: [SX, SY, 900, 1200], pencil }, null, 1));

// Recorte de la pantalla dibujada (para la cara superior de la losa)
await sharp(`${OUT}/sheet_19.png`).extract({ left: SX, top: SY, width: 900, height: 1200 }).toFile(`${OUT}/slab_graphite.png`);

// Pasado a tinta: mismas formas, limpias
{
  const paths = screen
    .map((s) => `<path d="${d(densify(s.pts, 40))}" fill="none" stroke="${C.ink}" stroke-width="${Math.max(2.5, s.w * 0.7)}" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="100%" height="100%" fill="${C.paper}"/>${paths}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/slab_ink.png`);
}

// ───────────── Interfaz final (losa, 900×1200) ─────────────
const bar = (x, y, w, h, fill, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" opacity="${o}"/>`;
const chartLine = [[110, 520], [230, 468], [330, 500], [450, 380], [560, 424], [680, 300], [790, 334]];
const smooth = (pts) => {
  let s = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    s += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return s;
};
function uiSlab({ withBg = true, alpha = 1 } = {}) {
  return `
  ${withBg ? `<rect width="900" height="1200" fill="${C.white}"/>` : ''}
  <g opacity="${alpha}">
  <circle cx="92" cy="108" r="34" fill="${C.ink}"/>
  ${bar(150, 88, 240, 18, C.ink)}${bar(150, 124, 150, 14, C.ink3, 0.6)}
  <rect x="700" y="84" width="124" height="50" rx="25" fill="${C.accentSoft}"/>${bar(728, 102, 68, 14, C.accent)}
  <rect x="60" y="196" width="780" height="404" rx="38" fill="${C.paper2}"/>
  ${bar(110, 240, 190, 18, C.ink)}${bar(110, 274, 110, 14, C.ink3, 0.6)}
  <path d="${smooth(chartLine)} L790,560 L110,560 Z" fill="${C.accentSoft}"/>
  <path d="${smooth(chartLine)}" fill="none" stroke="${C.accent}" stroke-width="9" stroke-linecap="round"/>
  <circle cx="680" cy="300" r="15" fill="${C.white}" stroke="${C.accent}" stroke-width="8"/>
  <rect x="110" y="558" width="680" height="3" fill="${C.line}"/>
  <rect x="60" y="650" width="370" height="210" rx="32" fill="${C.accent}"/>
  ${bar(100, 704, 200, 28, C.white)}${bar(100, 782, 140, 14, C.white, 0.7)}
  <rect x="470" y="650" width="370" height="210" rx="32" fill="${C.paper2}"/>
  ${bar(510, 704, 200, 28, C.ink)}${bar(510, 782, 130, 14, C.ink3, 0.6)}
  ${[925, 1000]
    .map(
      (y, i) => `<circle cx="102" cy="${y}" r="22" fill="${i ? C.line : C.accentSoft}"/>${bar(150, y - 18, 310, 16, C.ink)}${bar(150, y + 10, 190, 12, C.ink3, 0.55)}<rect x="720" y="${y - 18}" width="104" height="36" rx="18" fill="${C.paper2}"/>`,
    )
    .join('')}
  <rect x="60" y="1066" width="780" height="88" rx="44" fill="${C.accent}"/>${bar(370, 1102, 160, 16, C.white)}
  </g>`;
}
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">${uiSlab()}</svg>`)).png().toFile(`${OUT}/ui_slab.png`);

// ───────────── Capas (RGBA, 900×1200) ─────────────
const layerSvgs = {
  ui: `${uiSlab({ withBg: false })}`,
  logic: (() => {
    let s = '';
    let y = 130;
    const indents = [0, 1, 2, 2, 1, 2, 3, 3, 2, 1, 0, 1, 2, 2, 1, 0, 1, 2, 1, 0];
    indents.forEach((ind, i) => {
      const x = 90 + ind * 56;
      const w1 = 60 + ((i * 37) % 5) * 26;
      const w2 = 120 + ((i * 53) % 7) * 34;
      s += bar(x, y, w1, 20, i % 4 === 1 ? C.accent : C.ink, 0.9);
      s += bar(x + w1 + 18, y, Math.min(w2, 820 - x - w1), 20, C.ink3, 0.55);
      y += 50;
    });
    return s;
  })(),
  data: (() => {
    let s = `<rect x="70" y="110" width="760" height="56" rx="16" fill="${C.ink}" opacity="0.9"/>`;
    for (let c = 0; c < 4; c++) s += bar(100 + c * 185, 130, 110, 16, C.white, 0.9);
    for (let r = 0; r < 9; r++) {
      const y = 196 + r * 62;
      s += `<rect x="70" y="${y}" width="760" height="50" rx="12" fill="${r % 2 ? C.paper2 : C.white}" stroke="${C.line}" stroke-width="2"/>`;
      for (let c = 0; c < 4; c++) s += bar(100 + c * 185, y + 18, 60 + ((r * 7 + c * 13) % 6) * 16, 14, c === 3 && r % 3 === 0 ? C.accent : C.ink2, 0.8);
    }
    const hs = [120, 190, 150, 240, 210, 280];
    hs.forEach((h, i) => (s += `<rect x="${110 + i * 120}" y="${1110 - h}" width="72" height="${h}" rx="14" fill="${i === 5 ? C.accent : C.ink3}" opacity="${i === 5 ? 1 : 0.45}"/>`));
    return s;
  })(),
  auto: (() => {
    const nodes = [
      [200, 220], [620, 260], [420, 520], [180, 760], [680, 720], [440, 1010],
    ];
    const edges = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5]];
    let s = '';
    for (const [a, b] of edges) {
      const [x0, y0] = nodes[a], [x1, y1] = nodes[b];
      s += `<path d="M${x0},${y0} C${x0},${(y0 + y1) / 2} ${x1},${(y0 + y1) / 2} ${x1},${y1}" fill="none" stroke="${C.ink3}" stroke-width="6" opacity="0.7"/>`;
    }
    nodes.forEach(([x, y], i) => {
      const hl = i === 2;
      s += `<rect x="${x - 110}" y="${y - 50}" width="220" height="100" rx="30" fill="${hl ? C.accent : C.white}" stroke="${hl ? C.accent : C.ink}" stroke-width="5"/>`;
      s += bar(x - 70, y - 10, 100, 18, hl ? C.white : C.ink, hl ? 1 : 0.85);
      s += `<circle cx="${x + 70}" cy="${y}" r="10" fill="${hl ? C.white : C.accent}"/>`;
    });
    return s;
  })(),
};
for (const [k, body] of Object.entries(layerSvgs)) {
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">${body}</svg>`)).png().toFile(`${OUT}/layer_${k}.png`);
}

// ───────────── Móvil (540×1170) ─────────────
{
  const W = 540, H = 1170;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.white}"/>
  ${bar(40, 44, 70, 14, C.ink)}<circle cx="470" cy="51" r="8" fill="${C.ink}"/><circle cx="496" cy="51" r="8" fill="${C.ink3}" opacity=".5"/>
  <circle cx="64" cy="140" r="28" fill="${C.ink}"/>${bar(108, 124, 190, 18, C.ink)}${bar(108, 154, 120, 12, C.ink3, 0.6)}
  <rect x="32" y="210" width="476" height="300" rx="34" fill="${C.paper2}"/>
  ${bar(64, 246, 150, 18, C.ink)}${bar(64, 278, 90, 12, C.ink3, 0.6)}
  <path d="M64,440 C120,440 130,400 186,404 C240,408 250,350 306,352 C360,354 370,300 420,300 C450,300 460,320 476,322 L476,470 L64,470 Z" fill="${C.accentSoft}"/>
  <path d="M64,440 C120,440 130,400 186,404 C240,408 250,350 306,352 C360,354 370,300 420,300 C450,300 460,320 476,322" fill="none" stroke="${C.accent}" stroke-width="7" stroke-linecap="round"/>
  <rect x="32" y="534" width="226" height="150" rx="28" fill="${C.accent}"/>${bar(58, 574, 120, 22, C.white)}${bar(58, 628, 80, 12, C.white, 0.7)}
  <rect x="282" y="534" width="226" height="150" rx="28" fill="${C.paper2}"/>${bar(308, 574, 120, 22, C.ink)}${bar(308, 628, 80, 12, C.ink3, 0.6)}
  ${[738, 818, 898].map((y, i) => `<circle cx="62" cy="${y}" r="22" fill="${i === 0 ? C.accentSoft : C.line}"/>${bar(104, y - 16, 220, 14, C.ink)}${bar(104, y + 8, 140, 10, C.ink3, 0.55)}<rect x="420" y="${y - 16}" width="88" height="32" rx="16" fill="${C.paper2}"/>`).join('')}
  <rect x="32" y="980" width="476" height="78" rx="39" fill="${C.accent}"/>${bar(210, 1012, 120, 14, C.white)}
  <rect x="0" y="1090" width="${W}" height="80" fill="${C.white}"/><rect x="0" y="1090" width="${W}" height="2" fill="${C.line}"/>
  ${[90, 210, 330, 450].map((x, i) => `<circle cx="${x}" cy="1128" r="11" fill="${i === 0 ? C.accent : C.ink3}" opacity="${i === 0 ? 1 : 0.5}"/>`).join('')}
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/phone_ui.png`);
}

// ───────────── Portátil (1600×1000) ─────────────
{
  const W = 1600, H = 1000;
  const pts = [[420, 700], [540, 640], [660, 668], [780, 560], [900, 600], [1020, 480], [1140, 520], [1260, 400], [1380, 430], [1500, 360]];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${C.white}"/>
  <rect width="300" height="${H}" fill="${C.paper2}"/>
  <circle cx="70" cy="72" r="24" fill="${C.ink}"/>${bar(108, 62, 120, 18, C.ink)}
  ${[180, 236, 292, 348, 404].map((y, i) => `<rect x="40" y="${y - 20}" width="220" height="44" rx="14" fill="${i === 0 ? C.white : 'none'}"/><circle cx="72" cy="${y + 2}" r="9" fill="${i === 0 ? C.accent : C.ink3}" opacity="${i === 0 ? 1 : 0.5}"/>${bar(96, y - 6, 110 - i * 6, 14, i === 0 ? C.ink : C.ink3, i === 0 ? 1 : 0.6)}`).join('')}
  ${bar(360, 62, 260, 22, C.ink)}${bar(360, 98, 160, 14, C.ink3, 0.6)}
  <rect x="1360" y="56" width="200" height="56" rx="28" fill="${C.accent}"/>${bar(1408, 76, 104, 16, C.white)}
  ${[0, 1, 2].map((i) => `<rect x="${360 + i * 400}" y="150" width="370" height="150" rx="26" fill="${i === 0 ? C.accent : C.paper2}"/>${bar(392 + i * 400, 190, 170, 26, i === 0 ? C.white : C.ink)}${bar(392 + i * 400, 246, 110, 14, i === 0 ? C.white : C.ink3, 0.65)}`).join('')}
  <rect x="360" y="330" width="1170" height="420" rx="30" fill="${C.paper2}"/>
  ${bar(396, 366, 200, 18, C.ink)}
  <path d="${smooth(pts)} L1500,720 L420,720 Z" fill="${C.accentSoft}"/>
  <path d="${smooth(pts)}" fill="none" stroke="${C.accent}" stroke-width="8" stroke-linecap="round"/>
  ${[0, 1, 2].map((r) => `<rect x="360" y="${782 + r * 64}" width="1170" height="52" rx="14" fill="${r % 2 ? C.paper2 : C.white}" stroke="${C.line}" stroke-width="2"/>${[0, 1, 2, 3].map((c) => bar(392 + c * 290, 800 + r * 64, 120 + ((r + c) % 3) * 30, 14, c === 3 && r === 0 ? C.accent : C.ink2, 0.8)).join('')}`).join('')}
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/laptop_ui.png`);
}

console.log(`Texturas listas en ${OUT}`);
