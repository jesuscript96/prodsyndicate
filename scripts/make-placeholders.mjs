#!/usr/bin/env node
/**
 * scripts/make-placeholders.mjs — frames de prueba del hero (guía §7.3 y §16).
 *
 * Genera la secuencia completa "del boceto al producto" (S1…S8) como un SVG por frame,
 * construido en Node sin dependencias nuevas, y lo rasteriza con sharp:
 *
 *   assets/frames_src/desktop/0001.png … 0150.png   2400 × 2400 (cámara 1:1)
 *   assets/frames_src/mobile/0001.png  … 0150.png   1440 × 1800 (cámara retrato 4:5, objeto escalado al ancho)
 *   assets/frames_src/og/final.png                   2400 × 2400, frame 150 sin contador (fuente de og/default.png)
 *
 * Después: npm run sequence:build && npm run sequence:check
 *
 * Uso: node scripts/make-placeholders.mjs [--only desktop|mobile|og] [--frames 1,19,56] [--no-verify]
 *
 * Reglas que respeta (§7.2): fondo #FFFFFF exacto, margen ≥ 8 % por lado, 40 % superior vacío en
 * los frames 1–25 (zona del H1), paleta limitada (naranja solo en el punto "live" de S8), sin texto
 * legible salvo un pequeño contador mono de calibración dentro del margen del 10 %.
 */
import sharp from 'sharp';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
const N = 150;
const BATCH = 8;
const ROOT = 'assets/frames_src';

const COLOR = {
  white: '#FFFFFF',
  paper: '#F6F6F3',
  line: '#E8E8E3',
  grey: '#6B6B76',
  ink: '#0B0B0F',
  accent: '#2B3BFF',
  signal: '#FF5A1F',
};

/** Cámaras: el objeto se diseña en unidades locales (losa de 1000 × 700) y se escala por `s`. */
const CAMERAS = {
  desktop: { W: 2400, H: 2400, s: 1.5, cyStart: 0.705, cyMid: 0.5, dir: `${ROOT}/desktop` },
  mobile: { W: 1440, H: 1800, s: 0.95, cyStart: 0.7, cyMid: 0.52, dir: `${ROOT}/mobile` },
};

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt('--only');
const framesArg = opt('--frames');
const FRAMES = framesArg
  ? framesArg.split(',').map((n) => Number(n)).filter((n) => n >= 1 && n <= N)
  : Array.from({ length: N }, (_, i) => i + 1);
const VERIFY = !args.includes('--no-verify');

// ---------------------------------------------------------------------------
// Utilidades numéricas
// ---------------------------------------------------------------------------
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const linear = (t) => t;
const drawEase = (t) => 1 - Math.pow(1 - t, 1.6); // ritmo de mano: casi constante, se frena al final
/** Progreso 0→1 (con easing) del frame f entre a y b. */
const seg = (f, a, b, ease = easeInOut) => ease(clamp01((f - a) / (b - a)));
const r = (v) => Math.round(v * 100) / 100;
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (h1, h2, t) => {
  const a = hex2rgb(h1);
  const b = hex2rgb(h2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], clamp01(t))).toString(16).padStart(2, '0')).join('');
};
const hash = (n) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Matrices afines [a b c d e f] (mismo orden que SVG `matrix(...)`).
const M = {
  mul: (A, B) => [
    A[0] * B[0] + A[2] * B[1],
    A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3],
    A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4],
    A[1] * B[4] + A[3] * B[5] + A[5],
  ],
  chain: (...ms) => ms.reduce((acc, m) => M.mul(acc, m)),
  translate: (x, y) => [1, 0, 0, 1, x, y],
  scale: (x, y = x) => [x, 0, 0, y, 0, 0],
  rotate: (deg) => {
    const a = (deg * Math.PI) / 180;
    return [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
  },
  skewX: (deg) => [1, 0, Math.tan((deg * Math.PI) / 180), 1, 0, 0],
  skewY: (deg) => [1, Math.tan((deg * Math.PI) / 180), 0, 1, 0, 0],
  apply: (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]],
  str: (m) => `matrix(${m.map((v) => r(v)).join(' ')})`,
};

// ---------------------------------------------------------------------------
// Geometría de trazos (polilíneas con longitud conocida → dibujo progresivo sin pathLength)
// ---------------------------------------------------------------------------
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const rectPts = (x, y, w, h) => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
const ellipsePts = (cx, cy, rx, ry, n = 28, start = -Math.PI / 2, sweep = Math.PI * 2) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = start + (sweep * i) / n;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
const quadPts = (p0, c, p1, n = 16) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
  });
const zigzagPts = (x0, y, len, n = 8, amp = 6) =>
  Array.from({ length: n + 1 }, (_, i) => [x0 + (len * i) / n, y + (i % 2 ? amp : -amp)]);
/** Cabeza de flecha (dos trazos en V) en el extremo `end` de una curva que llega desde `from`. */
const arrowHead = (from, end, size = 26) => {
  const a = Math.atan2(end[1] - from[1], end[0] - from[0]);
  const l = a + Math.PI - 0.55;
  const rr = a + Math.PI + 0.55;
  return [
    [end[0] + size * Math.cos(l), end[1] + size * Math.sin(l)],
    end,
    [end[0] + size * Math.cos(rr), end[1] + size * Math.sin(rr)],
  ];
};

const strokeLen = (pts, closed) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  if (closed) L += dist(pts[pts.length - 1], pts[0]);
  return L;
};
const pointAt = (pts, closed, d) => {
  const seq = closed ? [...pts, pts[0]] : pts;
  let acc = 0;
  for (let i = 1; i < seq.length; i++) {
    const l = dist(seq[i - 1], seq[i]);
    if (acc + l >= d) {
      const t = l ? (d - acc) / l : 0;
      return [lerp(seq[i - 1][0], seq[i][0], t), lerp(seq[i - 1][1], seq[i][1], t)];
    }
    acc += l;
  }
  return seq[seq.length - 1];
};
const pathD = (pts, closed) =>
  'M' + pts.map((p) => `${r(p[0])} ${r(p[1])}`).join(' L') + (closed ? ' Z' : '');
const wobble = (pts, amp, seed) =>
  amp <= 0
    ? pts
    : pts.map(([x, y], i) => [
        x + amp * (hash(seed + i * 7.31) * 2 - 1) * 2.4,
        y + amp * (hash(seed * 1.7 + i * 3.17) * 2 - 1) * 2.4,
      ]);

// ---------------------------------------------------------------------------
// Layout de la UI abstracta (coordenadas locales; la losa mide 1000 × 700 centrada en 0,0)
// ---------------------------------------------------------------------------
const UI = {
  logo: { x: -460, y: -316, w: 44, h: 44, rx: 12 },
  logoLine: [
    [-402, -294],
    [-340, -294],
  ],
  nav: [104, 84, 96, 72].map((len, i) => [
    [-460, -236 + i * 44],
    [-460 + len, -236 + i * 44],
  ]),
  navBottom: [
    [-460, 296],
    [-392, 296],
  ],
  search: { x: -300, y: -316, w: 300, h: 44, rx: 22 },
  avatar: { cx: 300, cy: -294, r: 22 },
  button: { x: 340, y: -316, w: 120, h: 44, rx: 12 },
  cards: [0, 1, 2].map((i) => ({ x: -300 + i * 258, y: -244, w: 240, h: 112, rx: 16 })),
  chart: { x: -300, y: -104, w: 500, h: 290, rx: 16 },
  table: { x: 228, y: -104, w: 232, h: 290, rx: 16 },
  bottom: [0, 1, 2].map((i) => ({ x: -300 + i * 258, y: 214, w: 240, h: 100, rx: 16 })),
};
const CHART = {
  x0: -272,
  step: 48,
  bw: 30,
  base: 160,
  bars: [64, 92, 76, 124, 104, 150, 132, 184, 168],
  line: [120, 96, 104, 60, 72, 34, 46, 0, -30],
};
const chartLinePts = () => CHART.bars.map((_, i) => [CHART.x0 + CHART.bw / 2 + i * CHART.step, CHART.line[i]]);
const TABLE_ROWS = [0, 1, 2, 3, 4, 5].map((i) => -60 + i * 44);

/** Orden de aparición de los elementos de UI (y orden en que el lápiz los dibuja). */
const EL = ['logo', 'nav', 'search', 'avatar', 'button', 'card0', 'card1', 'card2', 'chart', 'table', 'bottom0', 'bottom1', 'bottom2'];
const elIndex = Object.fromEntries(EL.map((k, i) => [k, i]));

/** Trazos del wireframe (S1), en orden de dibujo. */
function wireframeStrokes() {
  const s = [];
  const rect = (o, el) => s.push({ pts: rectPts(o.x, o.y, o.w, o.h), closed: true, el });
  const line = (pts, el) => s.push({ pts, closed: false, el });
  rect(UI.logo, 'logo');
  line(UI.logoLine, 'logo');
  UI.nav.forEach((l) => line(l, 'nav'));
  rect(UI.search, 'search');
  s.push({ pts: ellipsePts(UI.avatar.cx, UI.avatar.cy, UI.avatar.r, UI.avatar.r, 20), closed: false, el: 'avatar' });
  rect(UI.button, 'button');
  UI.cards.forEach((c, i) => {
    rect(c, `card${i}`);
    line(
      [
        [c.x + 20, c.y + 28],
        [c.x + 92, c.y + 28],
      ],
      `card${i}`,
    );
    rect({ x: c.x + 20, y: c.y + 54, w: 120, h: 30 }, `card${i}`);
  });
  rect(UI.chart, 'chart');
  line(chartLinePts(), 'chart');
  rect(UI.table, 'table');
  TABLE_ROWS.forEach((y) =>
    line(
      [
        [252, y],
        [436, y],
      ],
      'table',
    ),
  );
  UI.bottom.forEach((b, i) => {
    rect(b, `bottom${i}`);
    line(
      [
        [b.x + 20, b.y + 30],
        [b.x + 110, b.y + 30],
      ],
      `bottom${i}`,
    );
    line(
      [
        [b.x + 20, b.y + 64],
        [b.x + 220, b.y + 64],
      ],
      `bottom${i}`,
    );
  });
  line(UI.navBottom, 'nav');
  return s;
}

/** Anotaciones a lápiz (S2): flechas, un garabato alrededor de un dato y notas abstractas. */
function annotationStrokes() {
  const s = [];
  const a1 = quadPts([400, -262], [470, -150], [180, -116]);
  s.push({ pts: a1, closed: false });
  s.push({ pts: arrowHead(a1[a1.length - 2], a1[a1.length - 1]), closed: false });
  s.push({ pts: ellipsePts(-180, -175, 122, 50, 24, -0.4, Math.PI * 1.94), closed: false });
  const a2 = quadPts([-40, 214], [40, 120], [122, 18]);
  s.push({ pts: a2, closed: false });
  s.push({ pts: arrowHead(a2[a2.length - 2], a2[a2.length - 1]), closed: false });
  [20, 64, 108].forEach((y, j) => s.push({ pts: zigzagPts(-460, y, 86 - j * 12), closed: false }));
  return s;
}

// ---------------------------------------------------------------------------
// Parámetros continuos de la escena (todo interpola con easing; sin saltos)
// ---------------------------------------------------------------------------
function params(f) {
  const p = {};
  p.draw = seg(f, 0, 14, drawEase); // S1: el lápiz dibuja el wireframe
  p.annot = seg(f, 14, 19, drawEase); // S2: flechas y anotaciones
  p.pencilOut = seg(f, 19, 25); // el lápiz se retira
  p.ink = seg(f, 19, 34); // S3: grafito → tinta, desaparece el temblor de mano
  p.annotFade = seg(f, 21, 31);
  p.fill = seg(f, 26, 50, linear); // la UI se rellena (escalonado por elemento)
  p.slabIn = seg(f, 28, 50);
  p.sheetFade = seg(f, 32, 50);
  p.rise = seg(f, 19, 56); // cámara: sube, se centra y pasa a casi frontal
  p.split = seg(f, 61, 96); // S5: apertura en capas + órbita ≈ 25°
  p.layerContent = seg(f, 66, 92) * (1 - seg(f, 99, 112));
  p.rejoin = 1 - seg(f, 99, 117); // S7: reensamblaje
  p.glass = p.split * p.rejoin;
  p.sep = p.glass;
  p.orbitBack = 1 - seg(f, 99, 135);
  p.lowerLayers = 1 - seg(f, 112, 120);
  p.device = seg(f, 112, 135); // losa → portátil
  p.base = seg(f, 114, 132);
  p.phone = seg(f, 118, 135, easeOut);
  p.live = seg(f, 135, 139, easeOut); // S8: punto naranja
  p.phase = Math.max(0, f - 135);
  p.pulse = (1 - Math.cos((2 * Math.PI * p.phase) / 10)) / 2;
  p.floatY = 4 * Math.sin((Math.PI * p.phase) / 15);
  p.k = lerp(1, 0.08, p.rise) * (1 - p.device); // perspectiva 3/4 → frontal
  p.phi = 25 * p.split * p.orbitBack; // órbita (grados)
  return p;
}

// ---------------------------------------------------------------------------
// Piezas SVG
// ---------------------------------------------------------------------------
const rect = (x, y, w, h, rx, attrs = '') =>
  `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${r(rx)}" ${attrs}/>`;
const circle = (cx, cy, rad, attrs = '') => `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(rad)}" ${attrs}/>`;
const hline = (x1, y, x2, attrs = '') => `<line x1="${r(x1)}" y1="${r(y)}" x2="${r(x2)}" y2="${r(y)}" ${attrs}/>`;
const bar = (x, y, w, h, fill, extra = '') => rect(x, y, w, h, h / 2, `fill="${fill}" ${extra}`);
const shadowEllipse = (cx, cy, rx, ry, op) =>
  `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}" fill="url(#shadow)" fill-opacity="${r(op)}"/>`;

/** UI de la pantalla principal; `p.fill` escalona la aparición de cada elemento. */
function uiElements(p) {
  const appear = (key) => easeOut(clamp01((p.fill - (elIndex[key] / (EL.length - 1)) * 0.55) / 0.45));
  const el = (key, cx, cy, inner) => {
    const k = appear(key);
    if (k <= 0) return '';
    const t = k < 1 ? `transform="translate(${r(cx)} ${r(cy)}) scale(${r(lerp(0.9, 1, k))}) translate(${r(-cx)} ${r(-cy)})"` : '';
    return `<g opacity="${r(k)}" ${t}>${inner}</g>`;
  };
  const card = (c, i) => {
    const ratio = [0.55, 0.8, 0.4][i];
    return (
      rect(c.x, c.y, c.w, c.h, c.rx, `fill="${COLOR.paper}" stroke="${COLOR.line}" stroke-width="2"`) +
      bar(c.x + 20, c.y + 22, 72, 12, COLOR.line) +
      rect(c.x + 20, c.y + 54, 120 * ratio + 40, 30, 8, `fill="${COLOR.ink}"`) +
      [0, 1, 2]
        .map((j) => {
          const h = [26, 44, 34][(i + j) % 3];
          return rect(c.x + 164 + j * 22, c.y + 86 - h, 14, h, 4, `fill="${j === 2 ? COLOR.accent : COLOR.line}"`);
        })
        .join('')
    );
  };
  const chart = () => {
    const c = UI.chart;
    const pts = chartLinePts();
    return (
      rect(c.x, c.y, c.w, c.h, c.rx, `fill="${COLOR.white}" stroke="${COLOR.line}" stroke-width="2"`) +
      [40, 100].map((y) => hline(c.x + 24, y, c.x + c.w - 24, `stroke="${COLOR.line}" stroke-width="1.5"`)).join('') +
      CHART.bars
        .map((h, i) =>
          rect(CHART.x0 + i * CHART.step, CHART.base - h, CHART.bw, h, 6, `fill="${i >= 6 ? COLOR.accent : COLOR.line}"`),
        )
        .join('') +
      `<path d="${pathD(pts, false)}" fill="none" stroke="${COLOR.ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>` +
      pts.map((q) => circle(q[0], q[1], 7, `fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="3"`)).join('')
    );
  };
  const table = () => {
    const t = UI.table;
    return (
      rect(t.x, t.y, t.w, t.h, t.rx, `fill="${COLOR.paper}" stroke="${COLOR.line}" stroke-width="2"`) +
      bar(t.x + 24, t.y + 22, 90, 12, COLOR.grey) +
      TABLE_ROWS.map(
        (y, i) =>
          circle(262, y, 9, `fill="${i % 3 === 1 ? COLOR.accent : COLOR.line}"`) +
          bar(282, y - 6, [120, 96, 140, 84, 128, 104][i], 12, COLOR.line) +
          (i % 2 ? bar(410, y - 6, 26, 12, i === 3 ? COLOR.ink : COLOR.line) : ''),
      ).join('')
    );
  };
  const bottom = (b, i) => {
    const ratio = [0.72, 0.38, 0.9][i];
    return (
      rect(b.x, b.y, b.w, b.h, b.rx, `fill="${COLOR.white}" stroke="${COLOR.line}" stroke-width="2"`) +
      bar(b.x + 20, b.y + 24, 90, 12, COLOR.line) +
      bar(b.x + 20, b.y + 58, 200, 12, COLOR.line) +
      bar(b.x + 20, b.y + 58, 200 * ratio, 12, i === 1 ? COLOR.ink : COLOR.accent)
    );
  };
  const live =
    p.live > 0
      ? circle(250, -294, 7 + 11 * p.pulse, `fill="${COLOR.signal}" fill-opacity="${r(p.live * 0.35 * (1 - p.pulse))}"`) +
        circle(250, -294, 7 + 1.5 * p.pulse, `fill="${COLOR.signal}" fill-opacity="${r(p.live)}"`)
      : '';
  return [
    el('logo', -438, -294, rect(UI.logo.x, UI.logo.y, UI.logo.w, UI.logo.h, UI.logo.rx, `fill="${COLOR.ink}"`) + circle(-438, -294, 8, `fill="${COLOR.accent}"`) + bar(-402, -300, 62, 12, COLOR.line)),
    el('nav', -410, -170, UI.nav.map((l, i) => bar(l[0][0], l[0][1] - 7, l[1][0] - l[0][0], 14, i === 0 ? COLOR.accent : COLOR.line)).join('') + bar(-460, 289, 68, 14, COLOR.line)),
    el('search', -150, -294, rect(UI.search.x, UI.search.y, UI.search.w, UI.search.h, UI.search.rx, `fill="${COLOR.paper}" stroke="${COLOR.line}" stroke-width="2"`) + circle(-276, -294, 8, `fill="none" stroke="${COLOR.grey}" stroke-width="3"`) + bar(-256, -300, 110, 12, COLOR.line)),
    el('avatar', 300, -294, circle(300, -294, 22, `fill="${COLOR.grey}"`) + circle(300, -302, 8, `fill="${COLOR.white}"`) + live),
    el('button', 400, -294, rect(UI.button.x, UI.button.y, UI.button.w, UI.button.h, UI.button.rx, `fill="${COLOR.accent}"`) + bar(366, -300, 68, 12, COLOR.white)),
    ...UI.cards.map((c, i) => el(`card${i}`, c.x + c.w / 2, c.y + c.h / 2, card(c, i))),
    el('chart', UI.chart.x + UI.chart.w / 2, UI.chart.y + UI.chart.h / 2, chart()),
    el('table', UI.table.x + UI.table.w / 2, UI.table.y + UI.table.h / 2, table()),
    ...UI.bottom.map((b, i) => el(`bottom${i}`, b.x + b.w / 2, b.y + b.h / 2, bottom(b, i))),
  ].join('');
}

/** Capa Lógica: líneas tipo código. */
function logicLayer() {
  const rows = [
    [0, [120, 'accent'], [60, 'line'], [160, 'line']],
    [1, [90, 'line'], [200, 'line']],
    [2, [70, 'ink'], [140, 'line']],
    [2, [180, 'line']],
    [1, [90, 'line'], [60, 'accent'], [120, 'line']],
    [0, [40, 'ink']],
    [0, [120, 'accent'], [200, 'line']],
    [1, [160, 'line'], [80, 'line']],
    [2, [100, 'line'], [60, 'ink']],
    [1, [220, 'line']],
    [0, [40, 'ink']],
    [0, [120, 'accent'], [90, 'line']],
    [1, [180, 'line'], [60, 'accent']],
    [0, [40, 'ink']],
  ];
  const col = { line: COLOR.line, accent: COLOR.accent, ink: COLOR.grey };
  return rows
    .map(([indent, ...segs], i) => {
      let x = -440 + indent * 48;
      const y = -300 + i * 44;
      return segs
        .map(([w, c]) => {
          const out = bar(x, y, w, 16, col[c]);
          x += w + 14;
          return out;
        })
        .join('');
    })
    .join('');
}

/** Capa Datos: tabla de bloques. */
function dataLayer() {
  const widths = [190, 150, 150, 180, 130];
  const xs = [];
  let x = -440;
  for (const w of widths) {
    xs.push(x);
    x += w + 20;
  }
  let out = rect(-440, -306, 880, 40, 10, `fill="${COLOR.accent}"`);
  out += widths.map((w, j) => bar(xs[j] + 16, -292, Math.min(w - 32, 90 - j * 8), 12, COLOR.white)).join('');
  for (let i = 0; i < 8; i++) {
    const y = -244 + i * 62;
    out += widths
      .map((w, j) => {
        const frac = 0.45 + 0.5 * hash(i * 5 + j);
        const fill = j === 0 ? COLOR.grey : j === 3 && i % 3 === 0 ? COLOR.accent : COLOR.line;
        return bar(xs[j], y, (w - 24) * (j === 3 && i % 3 === 0 ? 0.45 : frac), 24, fill);
      })
      .join('');
    if (i < 7) out += hline(-440, y + 43, 440, `stroke="${COLOR.line}" stroke-width="1.5"`);
  }
  return out;
}

/** Capa Automatización: nodos conectados. */
function autoLayer() {
  const nodes = {
    A: [-330, -170],
    B: [-110, -250],
    C: [110, -170],
    D: [330, -250],
    E: [-220, 70],
    F: [40, 130],
    G: [300, 40],
    H: [-330, 230],
  };
  const edges = ['AB', 'BC', 'CD', 'AE', 'EF', 'FG', 'CG', 'EH'];
  const round = new Set(['B', 'F']);
  let out = edges
    .map((e) => {
      const a = nodes[e[0]];
      const b = nodes[e[1]];
      return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${COLOR.accent}" stroke-width="3" stroke-opacity="0.8"/>`;
    })
    .join('');
  out += ['AB', 'EF', 'CG']
    .map((e) => {
      const a = nodes[e[0]];
      const b = nodes[e[1]];
      return circle((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 7, `fill="${COLOR.accent}"`);
    })
    .join('');
  out += Object.entries(nodes)
    .map(([k, [x, y]]) =>
      round.has(k)
        ? circle(x, y, 32, `fill="${COLOR.white}" stroke="${COLOR.accent}" stroke-width="3"`) + circle(x, y, 10, `fill="${COLOR.accent}"`)
        : rect(x - 60, y - 32, 120, 64, 16, `fill="${COLOR.paper}" stroke="${COLOR.ink}" stroke-width="2"`) +
          bar(x - 40, y - 7, 56, 14, COLOR.line) +
          circle(x + 38, y, 7, `fill="${COLOR.ink}"`),
    )
    .join('');
  return out;
}

/** UI compacta del móvil (coordenadas locales del teléfono, 220 × 456). */
function phoneUi() {
  let out = bar(-80, -186, 100, 14, COLOR.line) + circle(66, -179, 12, `fill="${COLOR.grey}"`);
  [-150, -70].forEach((y, i) => {
    out += rect(-86, y, 172, 66, 12, `fill="${COLOR.paper}" stroke="${COLOR.line}" stroke-width="2"`);
    out += bar(-70, y + 16, 60, 10, COLOR.line) + rect(-70, y + 36, i ? 56 : 84, 16, 5, `fill="${COLOR.ink}"`);
    out += bar(40, y + 20, 48, 10, COLOR.line) + bar(40, y + 38, i ? 32 : 24, 10, COLOR.accent);
  });
  [30, 52, 40, 72, 58].forEach((h, i) => {
    out += rect(-70 + i * 32, 100 - h, 20, h, 5, `fill="${i >= 3 ? COLOR.accent : COLOR.line}"`);
  });
  out += rect(-86, 130, 172, 40, 12, `fill="${COLOR.accent}"`) + bar(-34, 144, 68, 12, COLOR.white);
  out += [-54, -18, 18, 54].map((x, i) => circle(x, 200, 7, `fill="${i === 0 ? COLOR.ink : COLOR.line}"`)).join('');
  return out;
}

// ---------------------------------------------------------------------------
// Composición de un frame
// ---------------------------------------------------------------------------
function frameSvg(f, cam, { counter = true } = {}) {
  const p = params(f);
  const { W, H, s } = cam;
  const cx = W / 2;
  const cy = lerp(cam.cyStart, cam.cyMid, p.rise) * H;

  // Cámara: 3/4 cenital (k=1) → frontal (k=0); órbita isométrica sugerida (phi).
  const cosPhi = Math.cos((p.phi * Math.PI) / 180);
  const Mcam = M.chain(
    M.translate(cx, cy),
    M.scale(s),
    M.rotate(-6 * p.k),
    M.scale(1, 1 - 0.3 * p.k),
    M.skewX(-16 * p.k),
    M.scale(cosPhi, 1),
    M.skewY(-0.48 * p.phi),
  );

  const parts = [];

  // --- Hoja de papel (S1–S3) ---
  if (p.sheetFade < 1) {
    parts.push(
      `<g opacity="${r(1 - p.sheetFade)}">` +
        shadowEllipse(0, 26, 540, 92, 0.6) +
        rect(-500, -350, 1000, 700, 6, `fill="url(#paper)" stroke="${COLOR.line}" stroke-width="2"`) +
        '</g>',
    );
  }

  // Apertura en capas: separación diagonal + ligero alejamiento de cámara (zoom) para que quepa.
  const sepDx = 84 * p.sep;
  const sepDy = -140 * p.sep;
  const zoom = lerp(1, 0.82, p.glass);

  // --- Sombra de la losa / pila / portátil ---
  if (p.slabIn > 0) {
    const sx = (-1.5 * sepDx - 120 * p.device) * zoom;
    const sy = (lerp(120, 380, p.rise) - 1.5 * sepDy - 46 * p.device) * zoom;
    parts.push(shadowEllipse(sx, sy, lerp(430, 520, p.device) * zoom, lerp(40, 28, p.device) * zoom, p.slabIn * 0.9));
  }

  // --- Móvil (S7–S8): sale deslizándose desde detrás del portátil ---
  if (p.phone > 0) {
    const px = lerp(150, 510, p.phone);
    const py = lerp(40, 95, p.phone) - p.floatY * 1.5;
    const ps = lerp(0.92, 1, p.phone);
    parts.push(
      shadowEllipse(510, 352, 124, 16, p.phone * 0.8) +
        `<g transform="translate(${r(px)} ${r(py)}) scale(${r(ps)})">` +
        rect(-110, -228, 220, 456, 34, `fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="10"`) +
        phoneUi() +
        '</g>',
    );
  }

  // --- Pila de capas (S3–S7) → losa → portátil ---
  if (p.slabIn > 0) {
    const dx = sepDx;
    const dy = sepDy;
    const stroke = mixHex(COLOR.line, COLOR.accent, p.glass);
    const fillOp = lerp(1, 0.78, p.glass);
    const contents = [autoLayer, dataLayer, logicLayer];
    let stack = '';
    for (let i = 0; i < 3; i++) {
      if (p.lowerLayers <= 0) break;
      stack +=
        `<g opacity="${r(p.lowerLayers)}" transform="translate(${r((i - 1.5) * dx)} ${r((i - 1.5) * dy)})">` +
        rect(-500, -350, 1000, 700, 28, `fill="url(#paper)" fill-opacity="${r(fillOp)}" stroke="${stroke}" stroke-width="2"`) +
        (p.layerContent > 0 ? `<g opacity="${r(p.layerContent)}">${contents[i]()}</g>` : '') +
        '</g>';
    }
    // Capa superior: Interfaz; en S7 se convierte en la pantalla del portátil.
    const d = p.device;
    const w = lerp(1000, 840, d);
    const h = lerp(700, 588, d);
    const scx = lerp(0, -120, d);
    const scy = lerp(0, -20, d);
    stack +=
      `<g transform="translate(${r(1.5 * dx)} ${r(1.5 * dy)})">` +
      rect(scx - w / 2, scy - h / 2, w, h, lerp(28, 18, d), `fill="url(#paper)" fill-opacity="${r(lerp(fillOp, 1, d))}" stroke="${mixHex(stroke, COLOR.ink, d)}" stroke-width="${r(lerp(2, 12, d))}"`) +
      `<g transform="translate(${r(scx)} ${r(scy)}) scale(${r(lerp(1, 0.82, d))})">${uiElements(p)}</g>` +
      '</g>';
    // Base del portátil.
    if (p.base > 0) {
      stack +=
        `<g opacity="${r(p.base)}" transform="translate(0 ${r(lerp(50, 0, p.base))})">` +
        rect(-620, 272, 1000, 30, 10, `fill="${COLOR.paper}" stroke="${COLOR.ink}" stroke-width="2"`) +
        rect(-200, 272, 160, 8, 4, `fill="${COLOR.line}"`) +
        '</g>';
    }
    parts.push(`<g opacity="${r(p.slabIn)}" transform="translate(0 ${r(p.floatY)}) scale(${r(zoom)})">${stack}</g>`);
  }

  // --- Wireframe a lápiz (S1) → tinta (S3) ---
  let tip = null;
  const wobAmp = 1 - p.ink;
  const wires = wireframeStrokes().map((st, i) => ({ ...st, pts: wobble(st.pts, wobAmp, i + 1) }));
  const Lw = wires.reduce((a, st) => a + strokeLen(st.pts, st.closed), 0);
  const drawn = p.draw * Lw;
  const appearOf = (key) => easeOut(clamp01((p.fill - (elIndex[key] / (EL.length - 1)) * 0.55) / 0.45));
  const wireColor = mixHex(COLOR.grey, COLOR.ink, p.ink);
  const wireWidth = lerp(3.2, 2.4, p.ink);
  let acc = 0;
  let wireSvg = '';
  for (const st of wires) {
    const L = strokeLen(st.pts, st.closed);
    const op = (1 - appearOf(st.el)) * 0.92;
    if (drawn <= acc) {
      if (tip === null) tip = st.pts[0];
      break;
    }
    const partial = drawn < acc + L;
    if (op > 0.005) {
      const dash = partial ? ` stroke-dasharray="${r(drawn - acc)} ${r(L + 100)}"` : '';
      wireSvg += `<path d="${pathD(st.pts, st.closed)}" fill="none" stroke="${wireColor}" stroke-width="${r(wireWidth)}" stroke-opacity="${r(op)}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
    }
    if (partial) {
      tip = pointAt(st.pts, st.closed, drawn - acc);
      break;
    }
    acc += L;
  }
  if (wireSvg) parts.push(`<g>${wireSvg}</g>`);

  // --- Anotaciones a lápiz (S2) ---
  if (p.annot > 0 && p.annotFade < 1) {
    const ann = annotationStrokes().map((st, i) => ({ ...st, pts: wobble(st.pts, 1, 100 + i) }));
    const La = ann.reduce((a, st) => a + strokeLen(st.pts, st.closed), 0);
    const drawnA = p.annot * La;
    let accA = 0;
    let annSvg = '';
    for (const st of ann) {
      const L = strokeLen(st.pts, st.closed);
      if (drawnA <= accA) break;
      const partial = drawnA < accA + L;
      const dash = partial ? ` stroke-dasharray="${r(drawnA - accA)} ${r(L + 100)}"` : '';
      annSvg += `<path d="${pathD(st.pts, st.closed)}" fill="none" stroke="${COLOR.grey}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
      if (partial) {
        tip = pointAt(st.pts, st.closed, drawnA - accA);
        break;
      }
      accA += L;
      if (drawnA >= La) tip = st.pts[st.pts.length - 1];
    }
    parts.push(`<g opacity="${r((1 - p.annotFade) * 0.85)}">${annSvg}</g>`);
  } else if (p.draw >= 1 && p.annot >= 1) {
    const last = annotationStrokes().at(-1).pts;
    tip = last[last.length - 1];
  }

  // --- Lápiz (espacio de pantalla, sobre todo lo demás) ---
  let pencilSvg = '';
  const pencilOp = 1 - p.pencilOut;
  if (tip && pencilOp > 0) {
    const [tx0, ty0] = M.apply(Mcam, tip);
    const ang = (-32 * Math.PI) / 180;
    const dir = [Math.cos(ang), Math.sin(ang)];
    const per = [-dir[1], dir[0]];
    const off = 120 * s * p.pencilOut;
    const tx = tx0 + dir[0] * off;
    const ty = ty0 + dir[1] * off;
    const L = 300 * s;
    const w = 26 * s;
    const at = (d, side = 0) => `${r(tx + dir[0] * d + per[0] * side)} ${r(ty + dir[1] * d + per[1] * side)}`;
    const seg2 = (d1, d2, attrs) => {
      const [x1, y1] = at(d1).split(' ');
      const [x2, y2] = at(d2).split(' ');
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;
    };
    pencilSvg =
      `<g opacity="${r(pencilOp)}">` +
      `<g transform="translate(${r(10 * s)} ${r(14 * s)})">${seg2(46 * s, L, `stroke="${COLOR.ink}" stroke-opacity="0.07" stroke-width="${r(w)}"`)}</g>` +
      seg2(46 * s, L, `stroke="${COLOR.accent}" stroke-width="${r(w)}"`) +
      seg2(L - 20 * s, L, `stroke="${COLOR.grey}" stroke-width="${r(w)}"`) +
      `<g transform="translate(${r(per[0] * -6 * s)} ${r(per[1] * -6 * s)})">${seg2(50 * s, L - 24 * s, `stroke="${COLOR.white}" stroke-opacity="0.35" stroke-width="${r(4 * s)}"`)}</g>` +
      `<polygon points="${at(0)} ${at(46 * s, -w / 2)} ${at(46 * s, w / 2)}" fill="${COLOR.line}"/>` +
      `<polygon points="${at(0)} ${at(14 * s, -w / 6.5)} ${at(14 * s, w / 6.5)}" fill="${COLOR.ink}"/>` +
      '</g>';
  }

  const counterSvg = counter
    ? `<text x="${r(W * 0.9)}" y="${r(H * 0.9)}" text-anchor="end" font-family="Menlo, 'DejaVu Sans Mono', monospace" font-size="${r(H * 0.02)}" fill="${COLOR.grey}">${String(f).padStart(3, '0')} / ${N}</text>`
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    '<defs>' +
    `<radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${COLOR.ink}" stop-opacity="0.2"/><stop offset="0.5" stop-color="${COLOR.ink}" stop-opacity="0.08"/><stop offset="1" stop-color="${COLOR.ink}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FAFAF8"/></linearGradient>` +
    '</defs>' +
    `<rect width="100%" height="100%" fill="${COLOR.white}"/>` +
    `<g transform="${M.str(Mcam)}">${parts.join('')}</g>` +
    pencilSvg +
    counterSvg +
    '</svg>'
  );
}

// ---------------------------------------------------------------------------
// Rasterización en paralelo + verificación
// ---------------------------------------------------------------------------
async function renderFrame(svg, file) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 6 }).toFile(file);
}

async function runBatches(jobs, batch = BATCH) {
  for (let i = 0; i < jobs.length; i += batch) {
    await Promise.all(jobs.slice(i, i + batch).map((fn) => fn()));
  }
}

/**
 * Verifica (leyendo el PNG reducido) que el anillo exterior del 8 % es blanco y que en los
 * frames 1–25 el 40 % superior está vacío (zona del H1). Devuelve una lista de problemas.
 */
async function verifyFrame(file, cam, f) {
  const w = 240;
  const h = Math.round((w * cam.H) / cam.W);
  const { data, info } = await sharp(file)
    .resize(w, h, { kernel: 'mitchell' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const c = info.channels;
  const minIn = (x0, y0, x1, y1) => {
    let m = 255;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const o = (y * w + x) * c;
        m = Math.min(m, data[o], data[o + 1], data[o + 2]);
      }
    }
    return m;
  };
  const ring = Math.round(w * 0.08);
  const ringMin = Math.min(minIn(0, 0, w, ring), minIn(0, h - ring, w, h), minIn(0, 0, ring, h), minIn(w - ring, 0, w, h));
  const problems = [];
  if (ringMin < 252) problems.push(`${cam.name} ${String(f).padStart(4, '0')}: margen 8 % no blanco (mín ${ringMin})`);
  if (f <= 25) {
    const topMin = minIn(0, 0, w, Math.round(h * 0.4));
    if (topMin < 252) problems.push(`${cam.name} ${String(f).padStart(4, '0')}: 40 % superior no vacío (mín ${topMin})`);
  }
  return problems;
}

async function main() {
  const t0 = performance.now();
  const cams = Object.entries(CAMERAS)
    .filter(([name]) => !only || only === name)
    .map(([name, cam]) => ({ name, ...cam }));
  const full = !framesArg;
  const problems = [];

  for (const cam of cams) {
    if (full) await rm(cam.dir, { recursive: true, force: true });
    await mkdir(cam.dir, { recursive: true });
    const tc = performance.now();
    await runBatches(
      FRAMES.map((f) => async () => {
        const file = path.join(cam.dir, `${String(f).padStart(4, '0')}.png`);
        await renderFrame(frameSvg(f, cam), file);
        if (VERIFY) problems.push(...(await verifyFrame(file, cam, f)));
      }),
    );
    console.log(`${cam.name}: ${FRAMES.length} frames ${cam.W}×${cam.H} → ${cam.dir} (${((performance.now() - tc) / 1000).toFixed(1)} s)`);
  }

  if (!only || only === 'og') {
    const dir = `${ROOT}/og`;
    await mkdir(dir, { recursive: true });
    await renderFrame(frameSvg(N, { name: 'og', ...CAMERAS.desktop }, { counter: false }), path.join(dir, 'final.png'));
    console.log(`og: frame ${N} sin contador → ${dir}/final.png`);
  }

  if (VERIFY) {
    if (problems.length) {
      console.log(`✗ ${problems.length} problemas de encuadre:`);
      problems.slice(0, 40).forEach((m) => console.log('  ' + m));
    } else {
      console.log('OK: margen del 8 % blanco en todos los frames y 40 % superior vacío en 1–25.');
    }
  }
  console.log(`Frames de prueba listos en ${((performance.now() - t0) / 1000).toFixed(1)} s. Después: npm run sequence:build`);
  if (problems.length) process.exitCode = 1;
}

await main();
