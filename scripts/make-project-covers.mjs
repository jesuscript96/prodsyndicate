#!/usr/bin/env node
/**
 * Portadas y capturas de galería de los casos de concepto de /proyectos (§8.4, §5.7).
 *
 * Genera con sharp, a partir de SVG, una portada y tres capturas por caso
 * (1600×1200 WebP) en public/projects/<slug>/{cover,g1,g2,g3}.webp.
 * Dispositivos genéricos (móvil, portátil, tableta: rectángulos redondeados) con
 * UI abstracta (bloques, líneas, gráficos, nodos) en la paleta del sitio.
 * Sin texto legible, sin logos, sin naranja.
 *
 *   node scripts/make-project-covers.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const W = 1600;
const H = 1200;
const C = { paper: '#FFFFFF', paper2: '#F6F6F3', line: '#E8E8E3', ink: '#0B0B0F', accent: '#2B3BFF' };
const OUT = path.join(process.cwd(), 'public', 'projects');

let uid = 0;
const id = (p) => `${p}${++uid}`;
const f = (n) => Math.round(n * 100) / 100;

/* ───────────── Primitivas ───────────── */

const rect = (x, y, w, h, r, fill, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${fill}" ${extra}/>`;
const soft = (x, y, w, h, r, fill, opacity) => rect(x, y, w, h, r, fill, `fill-opacity="${opacity}"`);
const outline = (x, y, w, h, r, stroke = C.line, sw = 2, fill = 'none') =>
  rect(x, y, w, h, r, fill, `stroke="${stroke}" stroke-width="${sw}"`);
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
const ring = (cx, cy, r, stroke = C.line, sw = 2) => circle(cx, cy, r, 'none', `stroke="${stroke}" stroke-width="${sw}"`);
const hline = (x1, y, x2, stroke = C.line, sw = 2) =>
  `<line x1="${f(x1)}" y1="${f(y)}" x2="${f(x2)}" y2="${f(y)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
const vline = (x, y1, y2, stroke = C.line, sw = 2) =>
  `<line x1="${f(x)}" y1="${f(y1)}" x2="${f(x)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
const check = (cx, cy, r, stroke = C.paper) =>
  `<path d="M${f(cx - r * 0.45)} ${f(cy)} L${f(cx - r * 0.1)} ${f(cy + r * 0.38)} L${f(cx + r * 0.5)} ${f(cy - r * 0.4)}" fill="none" stroke="${stroke}" stroke-width="${f(r * 0.28)}" stroke-linecap="round" stroke-linejoin="round"/>`;
const curve = (d, color, sw = 3, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

/** Texto simulado: n líneas redondeadas con anchos que se alternan. */
function lines(x, y, w, n, o = {}) {
  const { h = 10, gap = 10, widths = [1, 0.84, 0.66], fill = C.line, opacity = 1 } = o;
  let s = '';
  for (let i = 0; i < n; i++) {
    s += rect(x, y + i * (h + gap), w * widths[i % widths.length], h, h / 2, fill, opacity < 1 ? `fill-opacity="${opacity}"` : '');
  }
  return s;
}
/** Titular simulado: bloques más gruesos en tinta. */
const heading = (x, y, w, o = {}) =>
  lines(x, y, w, o.n ?? 1, { h: o.h ?? 18, gap: o.gap ?? 12, widths: o.widths ?? [0.72, 0.5], fill: C.ink, opacity: o.opacity ?? 0.85 });
const pill = (x, y, w, h, fill = C.accent, opacity = 1) => soft(x, y, w, h, h / 2, fill, opacity);
const button = (x, y, w, h = 36, fill = C.ink) => rect(x, y, w, h, h / 2, fill) + rect(x + w * 0.3, y + h / 2 - 3, w * 0.4, 6, 3, C.paper);
const ghostButton = (x, y, w, h = 36) => outline(x, y, w, h, h / 2, C.line, 2, C.paper) + soft(x + w * 0.3, y + h / 2 - 3, w * 0.4, 6, 3, C.ink, 0.5);
const imageBlock = (x, y, w, h, r = 12) =>
  rect(x, y, w, h, r, C.paper2) + soft(x + w * 0.6, y + h * 0.18, Math.min(w, h) * 0.3, Math.min(w, h) * 0.3, Math.min(w, h) * 0.15, C.ink, 0.06);
const dot = (cx, cy, r = 4, fill = C.ink, opacity = 0.5) => circle(cx, cy, r, fill, `fill-opacity="${opacity}"`);

/* ───────────── Dispositivos ───────────── */

const shadow = (x, y, w, h, r) =>
  `<rect x="${f(x)}" y="${f(y + 28)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}" fill="${C.ink}" fill-opacity="0.13" filter="url(#blur)"/>`;

function clipped(x, y, w, h, r, screen) {
  const c = id('clip');
  return `<clipPath id="${c}">${rect(x, y, w, h, r, C.paper)}</clipPath><g clip-path="url(#${c})">${rect(x, y, w, h, 0, C.paper)}${screen(x, y, w, h)}</g>`;
}

/** Móvil: marco fino de tinta, pantalla recortada; alto = w × 2.06. */
function phone(x, y, w, screen) {
  const h = w * 2.06;
  const r = w * 0.15;
  const b = w * 0.032;
  return (
    shadow(x, y, w, h, r) +
    rect(x, y, w, h, r, C.ink) +
    clipped(x + b, y + b, w - 2 * b, h - 2 * b, r - b, screen) +
    rect(x + w * 0.36, y + b + w * 0.03, w * 0.28, w * 0.05, w * 0.025, C.ink)
  );
}
phone.h = (w) => w * 2.06;

/** Portátil: pantalla + base; alto total = w × 0.648. */
function laptop(x, y, w, screen) {
  const h = w * 0.62;
  const r = w * 0.022;
  const b = w * 0.016;
  const baseW = w * 1.1;
  const baseH = w * 0.028;
  const bx = x - (baseW - w) / 2;
  const by = y + h;
  return (
    shadow(bx, y, baseW, h + baseH, r) +
    rect(x, y, w, h, r, C.ink) +
    clipped(x + b, y + b, w - 2 * b, h - 2 * b, r * 0.5, screen) +
    rect(bx, by, baseW, baseH, baseH / 2, C.line) +
    rect(x + w * 0.43, by, w * 0.14, baseH * 0.4, baseH * 0.2, C.paper)
  );
}
laptop.h = (w) => w * 0.648;

/** Tableta apaisada; alto = w × 0.72. */
function tablet(x, y, w, screen) {
  const h = w * 0.72;
  const r = w * 0.045;
  const b = w * 0.026;
  return shadow(x, y, w, h, r) + rect(x, y, w, h, r, C.ink) + clipped(x + b, y + b, w - 2 * b, h - 2 * b, r - b, screen);
}
tablet.h = (w) => w * 0.72;

/** Tarjeta flotante (fuera de dispositivo), con sombra suave. */
function floatingCard(x, y, w, h, content) {
  return shadow(x, y, w, h, 20) + rect(x, y, w, h, 20, C.paper) + outline(x, y, w, h, 20) + content(x, y, w, h);
}

/* ───────────── Pantallas: móvil ───────────── */

function phoneChrome(x, y, w) {
  const u = w / 100;
  return pill(x + 8 * u, y + 6 * u, 10 * u, 2.2 * u, C.ink, 0.45) + pill(x + 76 * u, y + 6 * u, 16 * u, 2.2 * u, C.ink, 0.45);
}
function phoneTabBar(x, y, w, h, active = 0) {
  const u = w / 100;
  const ty = y + h - 11 * u;
  let s = rect(x, ty - 4 * u, w, 15 * u, 0, C.paper) + hline(x, ty - 4 * u, x + w);
  for (let i = 0; i < 4; i++) {
    const cx = x + (14 + i * 24) * u;
    s += i === active ? rect(cx - 3 * u, ty + 1 * u, 6 * u, 6 * u, 1.6 * u, C.accent) : soft(cx - 3 * u, ty + 1 * u, 6 * u, 6 * u, 1.6 * u, C.ink, 0.2);
  }
  return s;
}

/** Lista de fichas con buscador (marketplace). */
function phoneList(x, y, w, h) {
  const u = w / 100;
  let s = phoneChrome(x, y, w);
  s += heading(x + 8 * u, y + 16 * u, 84 * u, { h: 4.5 * u, widths: [0.62] });
  s += outline(x + 8 * u, y + 25 * u, 84 * u, 10 * u, 5 * u, C.line, 2, C.paper2) + dot(x + 15 * u, y + 30 * u, 1.8 * u) + lines(x + 20 * u, y + 29 * u, 40 * u, 1, { h: 2.2 * u });
  // chips
  s += pill(x + 8 * u, y + 40 * u, 18 * u, 6 * u, C.accent) + pill(x + 28 * u, y + 40 * u, 16 * u, 6 * u, C.line) + pill(x + 46 * u, y + 40 * u, 22 * u, 6 * u, C.line);
  // cards
  for (let i = 0; i < 3; i++) {
    const cy = y + (52 + i * 48) * u;
    s += imageBlock(x + 8 * u, cy, 84 * u, 30 * u, 3.5 * u);
    s += lines(x + 8 * u, cy + 33 * u, 60 * u, 1, { h: 2.6 * u, fill: C.ink, opacity: 0.8, widths: [0.7] });
    s += lines(x + 8 * u, cy + 38 * u, 60 * u, 1, { h: 2 * u, widths: [0.5] });
    s += pill(x + 74 * u, cy + 33 * u, 18 * u, 5 * u, C.accent, i === 0 ? 1 : 0.15);
  }
  return s + phoneTabBar(x, y, w, h, 0);
}

/** Calendario de disponibilidad + franjas horarias. */
function phoneCalendar(x, y, w, h) {
  const u = w / 100;
  let s = phoneChrome(x, y, w);
  s += heading(x + 8 * u, y + 16 * u, 84 * u, { h: 4.5 * u, widths: [0.5] });
  s += lines(x + 8 * u, y + 23 * u, 84 * u, 1, { h: 2.2 * u, widths: [0.34] });
  // header días
  for (let i = 0; i < 7; i++) s += soft(x + (10 + i * 12) * u, y + 32 * u, 6 * u, 2 * u, 1 * u, C.ink, 0.35);
  // grid 7×5
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      const cx = x + (8 + c * 12) * u;
      const cy = y + (37 + r * 11) * u;
      const sel = r === 2 && c === 3;
      const busy = (r * 7 + c) % 5 === 1;
      s += sel ? rect(cx, cy, 10 * u, 10 * u, 2.5 * u, C.accent) : busy ? soft(cx, cy, 10 * u, 10 * u, 2.5 * u, C.ink, 0.08) : rect(cx, cy, 10 * u, 10 * u, 2.5 * u, C.paper2);
    }
  }
  // franjas
  s += lines(x + 8 * u, y + 96 * u, 84 * u, 1, { h: 2.4 * u, widths: [0.4], fill: C.ink, opacity: 0.7 });
  for (let i = 0; i < 6; i++) {
    const cx = x + (8 + (i % 3) * 29) * u;
    const cy = y + (102 + Math.floor(i / 3) * 12) * u;
    s += i === 4 ? pill(cx, cy, 26 * u, 9 * u, C.accent) : outline(cx, cy, 26 * u, 9 * u, 4.5 * u, C.line, 2, C.paper);
    s += soft(cx + 7 * u, cy + 3.5 * u, 12 * u, 2 * u, 1 * u, i === 4 ? C.paper : C.ink, i === 4 ? 1 : 0.4);
  }
  // sticky CTA
  s += rect(x + 8 * u, y + h - 28 * u, 84 * u, 12 * u, 6 * u, C.ink) + rect(x + 38 * u, y + h - 23.2 * u, 24 * u, 2.6 * u, 1.3 * u, C.paper);
  return s;
}

/** Formulario de pago (campos + botón). */
function phoneForm(x, y, w, h) {
  const u = w / 100;
  let s = phoneChrome(x, y, w);
  s += soft(x + 8 * u, y + 15 * u, 6 * u, 6 * u, 3 * u, C.ink, 0.12);
  s += heading(x + 8 * u, y + 26 * u, 84 * u, { h: 4.5 * u, widths: [0.58] });
  // progreso
  s += pill(x + 8 * u, y + 35 * u, 26 * u, 1.6 * u, C.accent) + pill(x + 37 * u, y + 35 * u, 26 * u, 1.6 * u, C.accent) + pill(x + 66 * u, y + 35 * u, 26 * u, 1.6 * u, C.line);
  for (let i = 0; i < 4; i++) {
    const cy = y + (44 + i * 19) * u;
    s += lines(x + 8 * u, cy, 40 * u, 1, { h: 2 * u, widths: [0.45] });
    s += outline(x + 8 * u, cy + 4.5 * u, 84 * u, 11 * u, 3 * u, i === 1 ? C.accent : C.line, 2, C.paper);
    s += lines(x + 12 * u, cy + 9 * u, 60 * u, 1, { h: 2.2 * u, widths: [i === 1 ? 0.55 : 0.35], fill: C.ink, opacity: i === 1 ? 0.6 : 0.25 });
  }
  // resumen
  s += rect(x + 8 * u, y + 122 * u, 84 * u, 24 * u, 3.5 * u, C.paper2);
  s += lines(x + 13 * u, y + 127 * u, 40 * u, 3, { h: 2 * u, gap: 4 * u, widths: [0.5, 0.4, 0.3] });
  s += soft(x + 70 * u, y + 127 * u, 17 * u, 2 * u, 1 * u, C.ink, 0.35) + soft(x + 74 * u, y + 133 * u, 13 * u, 2 * u, 1 * u, C.ink, 0.35) + rect(x + 64 * u, y + 139 * u, 23 * u, 3 * u, 1.5 * u, C.ink);
  s += rect(x + 8 * u, y + h - 28 * u, 84 * u, 12 * u, 6 * u, C.accent) + rect(x + 38 * u, y + h - 23.2 * u, 24 * u, 2.6 * u, 1.3 * u, C.paper);
  return s;
}

/** Confirmación (círculo con check). */
function phoneSuccess(x, y, w, h) {
  const u = w / 100;
  let s = phoneChrome(x, y, w);
  s += circle(x + 50 * u, y + 60 * u, 24 * u, C.accent, 'fill-opacity="0.12"') + circle(x + 50 * u, y + 60 * u, 16 * u, C.accent) + check(x + 50 * u, y + 60 * u, 12 * u);
  s += heading(x + 20 * u, y + 94 * u, 60 * u, { h: 4.5 * u, widths: [1] });
  s += lines(x + 15 * u, y + 103 * u, 70 * u, 2, { h: 2.2 * u, gap: 3.5 * u, widths: [1, 0.7] });
  s += rect(x + 10 * u, y + 118 * u, 80 * u, 30 * u, 4 * u, C.paper2);
  s += lines(x + 16 * u, y + 124 * u, 50 * u, 3, { h: 2.2 * u, gap: 5 * u, widths: [0.7, 0.5, 0.6], fill: C.ink, opacity: 0.3 });
  s += dot(x + 80 * u, y + 125 * u, 1.6 * u, C.accent, 1) + dot(x + 80 * u, y + 132 * u, 1.6 * u, C.accent, 1) + dot(x + 80 * u, y + 139 * u, 1.6 * u, C.accent, 1);
  s += ghostButton(x + 10 * u, y + h - 28 * u, 80 * u, 12 * u);
  return s;
}

/** Notificaciones apiladas (automatización). */
function phoneNotifications(x, y, w, h) {
  const u = w / 100;
  let s = rect(x, y, w, h, 0, C.paper2) + phoneChrome(x, y, w);
  s += heading(x + 8 * u, y + 16 * u, 84 * u, { h: 6 * u, widths: [0.4] });
  for (let i = 0; i < 5; i++) {
    const cy = y + (30 + i * 27) * u;
    s += rect(x + 7 * u, cy, 86 * u, 22 * u, 4 * u, C.paper);
    s += i === 0 ? circle(x + 15 * u, cy + 8 * u, 4 * u, C.accent) + check(x + 15 * u, cy + 8 * u, 3 * u) : soft(x + 11 * u, cy + 4 * u, 8 * u, 8 * u, 2.5 * u, C.ink, 0.1);
    s += lines(x + 23 * u, cy + 5 * u, 55 * u, 1, { h: 2.4 * u, widths: [0.8], fill: C.ink, opacity: 0.75 });
    s += lines(x + 23 * u, cy + 10.5 * u, 55 * u, 2, { h: 2 * u, gap: 2.5 * u, widths: [1, 0.6] });
    s += soft(x + 80 * u, cy + 5 * u, 8 * u, 2 * u, 1 * u, C.ink, 0.25);
  }
  return s;
}

/** Capítulos apilados (narrativa por scroll). */
function phoneChapters(x, y, w, h, start = 0) {
  const u = w / 100;
  let s = phoneChrome(x, y, w);
  s += vline(x + 93 * u, y + 20 * u, y + h - 12 * u, C.line, 2 * u);
  for (let i = 0; i < 3; i++) {
    const k = start + i;
    const cy = y + (18 + i * 70) * u;
    s += heading(x + 8 * u, cy, 70 * u, { n: 2, h: 5 * u, gap: 2.5 * u, widths: [0.85, 0.55] });
    s += rect(x + 8 * u, cy + 16 * u, 78 * u, 42 * u, 4 * u, k % 2 ? C.paper2 : C.ink);
    s += k % 3 === 0 ? circle(x + 60 * u, cy + 37 * u, 15 * u, C.accent) : k % 3 === 1 ? rect(x + 20 * u, cy + 24 * u, 30 * u, 26 * u, 3 * u, C.paper) : circle(x + 30 * u, cy + 37 * u, 12 * u, C.paper);
    s += lines(x + 8 * u, cy + 62 * u, 70 * u, 1, { h: 2.2 * u, widths: [0.6] });
    s += (k === start ? circle(x + 93 * u, cy + 4 * u, 2.4 * u, C.accent) : dot(x + 93 * u, cy + 4 * u, 2 * u, C.ink, 0.25));
  }
  return s;
}

/** Documento (factura) resumido en móvil. */
function phoneDoc(x, y, w, h) {
  const u = w / 100;
  let s = rect(x, y, w, h, 0, C.paper2) + phoneChrome(x, y, w);
  s += rect(x + 8 * u, y + 18 * u, 84 * u, h - 30 * u, 4 * u, C.paper);
  s += soft(x + 14 * u, y + 25 * u, 10 * u, 10 * u, 2.5 * u, C.ink, 0.1) + lines(x + 60 * u, y + 26 * u, 26 * u, 3, { h: 2 * u, gap: 2.5 * u, widths: [1, 0.7, 0.85] });
  for (let i = 0; i < 6; i++) {
    const cy = y + (48 + i * 10) * u;
    s += hline(x + 14 * u, cy + 6 * u, x + 86 * u);
    s += lines(x + 14 * u, cy, 40 * u, 1, { h: 2 * u, widths: [i % 2 ? 0.7 : 0.9], fill: C.ink, opacity: 0.4 }) + soft(x + 76 * u, cy, 10 * u, 2 * u, 1 * u, C.ink, 0.4);
  }
  s += rect(x + 56 * u, y + 116 * u, 30 * u, 4 * u, 2 * u, C.ink) + pill(x + 14 * u, y + 114 * u, 20 * u, 7 * u, C.accent, 0.15) + pill(x + 19 * u, y + 116.5 * u, 10 * u, 2 * u, C.accent);
  return s;
}

/* ───────────── Pantallas: portátil / tableta ───────────── */

function topNav(x, y, w, o = {}) {
  const u = w / 100;
  const h = o.h ?? 5 * u;
  let s = hline(x, y + h, x + w) + circle(x + 3.2 * u, y + h / 2, 1.1 * u, C.ink);
  for (let i = 0; i < 3; i++) s += soft(x + (8 + i * 7) * u, y + h / 2 - 0.6 * u, 4.5 * u, 1.2 * u, 0.6 * u, C.ink, 0.5);
  s += pill(x + w - 10 * u, y + h / 2 - 1.4 * u, 7.5 * u, 2.8 * u, C.ink);
  if (o.avatar !== false) s += circle(x + w - 14 * u, y + h / 2, 1.3 * u, C.line);
  return s;
}

function sidebar(x, y, w, h, sw, active = 1) {
  const u = w / 100;
  let s = rect(x, y, sw, h, 0, C.paper2) + vline(x + sw, y, y + h) + circle(x + 4 * u, y + 4 * u, 1.3 * u, C.ink);
  for (let i = 0; i < 6; i++) {
    const cy = y + (11 + i * 5) * u;
    if (i === active) s += rect(x + 1.5 * u, cy - 1.6 * u, sw - 3 * u, 4 * u, 1.2 * u, C.paper);
    s += soft(x + 3.5 * u, cy - 0.5 * u, 2 * u, 2 * u, 0.6 * u, i === active ? C.accent : C.ink, i === active ? 1 : 0.25);
    s += soft(x + 7 * u, cy - 0.5 * u, sw * (0.45 + (i % 3) * 0.1), 1.1 * u, 0.55 * u, C.ink, i === active ? 0.8 : 0.3);
  }
  s += circle(x + 4 * u, y + h - 5 * u, 1.3 * u, C.line) + soft(x + 7 * u, y + h - 5.5 * u, sw * 0.4, 1.1 * u, 0.55 * u, C.ink, 0.3);
  return s;
}

/** Marketplace: buscador + rejilla de fichas + mapa con puntos. */
function laptopSearch(x, y, w, h) {
  const u = w / 100;
  let s = topNav(x, y, w);
  s += outline(x + 4 * u, y + 8 * u, 44 * u, 5 * u, 2.5 * u, C.line, 2, C.paper2) + dot(x + 7 * u, y + 10.5 * u, 0.9 * u) + lines(x + 9.5 * u, y + 10 * u, 20 * u, 1, { h: 1.1 * u });
  s += pill(x + 50 * u, y + 8.8 * u, 7 * u, 3.4 * u, C.accent) + pill(x + 58 * u, y + 8.8 * u, 6 * u, 3.4 * u, C.line) + pill(x + 65 * u, y + 8.8 * u, 8 * u, 3.4 * u, C.line);
  s += lines(x + 4 * u, y + 15.5 * u, 30 * u, 1, { h: 1.1 * u, widths: [0.6] });
  for (let i = 0; i < 6; i++) {
    const cx = x + (4 + (i % 3) * 20) * u;
    const cy = y + (19 + Math.floor(i / 3) * 24) * u;
    s += imageBlock(cx, cy, 18 * u, 12 * u, 2 * u);
    s += lines(cx, cy + 13.5 * u, 15 * u, 1, { h: 1.3 * u, widths: [0.8], fill: C.ink, opacity: 0.75 });
    s += lines(cx, cy + 16 * u, 15 * u, 1, { h: 1 * u, widths: [0.5] });
    s += pill(cx + 12 * u, cy + 13.5 * u, 6 * u, 2.4 * u, C.accent, i === 1 ? 1 : 0.15);
  }
  // mapa
  const mx = x + 66 * u;
  const mw = 34 * u;
  s += rect(mx, y + 5.2 * u, mw, h - 5.2 * u, 0, C.paper2);
  for (let i = 0; i < 6; i++) s += hline(mx, y + (12 + i * 8) * u, mx + mw, C.line, 1.5 * u);
  for (let i = 0; i < 4; i++) s += vline(mx + (6 + i * 8) * u, y + 5.2 * u, y + h, C.line, 1.5 * u);
  s += curve(`M${f(mx)} ${f(y + 40 * u)} C${f(mx + 10 * u)} ${f(y + 30 * u)} ${f(mx + 20 * u)} ${f(y + 48 * u)} ${f(mx + mw)} ${f(y + 38 * u)}`, C.paper, 3 * u);
  const pins = [[8, 16], [19, 24], [26, 15], [12, 36], [28, 44], [16, 50]];
  for (const [px, py] of pins) s += circle(mx + px * u, y + py * u, 2.4 * u, C.accent, 'fill-opacity="0.18"') + circle(mx + px * u, y + py * u, 1.2 * u, C.accent);
  s += rect(mx + 4 * u, y + h - 12 * u, 26 * u, 8 * u, 1.6 * u, C.paper) + imageBlock(mx + 5.2 * u, y + h - 10.8 * u, 7 * u, 5.6 * u, 1 * u) + lines(mx + 13.5 * u, y + h - 10 * u, 15 * u, 2, { h: 1.1 * u, gap: 1.6 * u, widths: [1, 0.6], fill: C.ink, opacity: 0.6 });
  return s;
}

/** Ficha de servicio: imagen grande + tarjeta de reserva. */
function laptopListing(x, y, w) {
  const u = w / 100;
  let s = topNav(x, y, w);
  s += lines(x + 4 * u, y + 8.5 * u, 30 * u, 1, { h: 1 * u, widths: [0.5] });
  s += imageBlock(x + 4 * u, y + 11.5 * u, 58 * u, 30 * u, 2.5 * u);
  for (let i = 0; i < 3; i++) s += imageBlock(x + (4 + i * 20) * u, y + 43 * u, 18 * u, 9 * u, 1.6 * u);
  s += heading(x + 4 * u, y + 56 * u, 58 * u, { h: 2.2 * u, widths: [0.55] });
  s += lines(x + 4 * u, y + 60.5 * u, 58 * u, 3, { h: 1.1 * u, gap: 1.6 * u, widths: [1, 0.9, 0.6] });
  // tarjeta reserva
  const cx = x + 67 * u;
  s += rect(cx, y + 11.5 * u, 29 * u, 46 * u, 2.5 * u, C.paper) + outline(cx, y + 11.5 * u, 29 * u, 46 * u, 2.5 * u);
  s += heading(cx + 3 * u, y + 15.5 * u, 23 * u, { h: 2.4 * u, widths: [0.45] });
  s += lines(cx + 3 * u, y + 19.5 * u, 23 * u, 1, { h: 1 * u, widths: [0.7] });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
    const sel = r === 1 && c === 4;
    s += sel ? rect(cx + (3 + c * 3.4) * u, y + (24 + r * 3.4) * u, 2.8 * u, 2.8 * u, 0.7 * u, C.accent) : rect(cx + (3 + c * 3.4) * u, y + (24 + r * 3.4) * u, 2.8 * u, 2.8 * u, 0.7 * u, C.paper2);
  }
  s += outline(cx + 3 * u, y + 36 * u, 23 * u, 4 * u, 1.2 * u) + lines(cx + 5 * u, y + 37.6 * u, 12 * u, 1, { h: 1 * u, fill: C.ink, opacity: 0.4 });
  s += outline(cx + 3 * u, y + 41.5 * u, 23 * u, 4 * u, 1.2 * u) + lines(cx + 5 * u, y + 43.1 * u, 12 * u, 1, { h: 1 * u, fill: C.ink, opacity: 0.4 });
  s += rect(cx + 3 * u, y + 48 * u, 23 * u, 5 * u, 2.5 * u, C.accent) + rect(cx + 10 * u, y + 50 * u, 9 * u, 1.1 * u, 0.55 * u, C.paper);
  return s;
}

/** Panel de operaciones: barra lateral + KPI + tabla + barras. */
function opsDashboard(x, y, w, h) {
  const u = w / 100;
  const sw = 17 * u;
  let s = sidebar(x, y, w, h, sw, 1);
  const cx = x + sw + 4 * u;
  const cw = w - sw - 8 * u;
  s += heading(cx, y + 5 * u, cw, { h: 2.4 * u, widths: [0.26] }) + pill(cx + cw - 10 * u, y + 4.6 * u, 10 * u, 3.4 * u, C.ink);
  // KPI
  for (let i = 0; i < 4; i++) {
    const kx = cx + i * (cw / 4);
    const kw = cw / 4 - 2 * u;
    s += rect(kx, y + 11 * u, kw, 11 * u, 1.8 * u, C.paper) + outline(kx, y + 11 * u, kw, 11 * u, 1.8 * u);
    s += lines(kx + 2.5 * u, y + 13.5 * u, kw - 5 * u, 1, { h: 1 * u, widths: [0.5] });
    s += soft(kx + 2.5 * u, y + 16.5 * u, kw * (0.35 + i * 0.1), 2.6 * u, 0.8 * u, C.ink, 0.85);
    s += pill(kx + kw - 8 * u, y + 17.2 * u, 5.5 * u, 1.6 * u, i === 2 ? C.ink : C.accent, i === 2 ? 0.2 : 1);
  }
  // tabla
  const tx = cx;
  const tw = cw * 0.6;
  s += rect(tx, y + 25 * u, tw, h - 29 * u, 1.8 * u, C.paper) + outline(tx, y + 25 * u, tw, h - 29 * u, 1.8 * u);
  s += soft(tx + 2.5 * u, y + 28 * u, 10 * u, 1.2 * u, 0.6 * u, C.ink, 0.35) + soft(tx + 20 * u, y + 28 * u, 8 * u, 1.2 * u, 0.6 * u, C.ink, 0.35) + soft(tx + 34 * u, y + 28 * u, 6 * u, 1.2 * u, 0.6 * u, C.ink, 0.35);
  for (let i = 0; i < 7; i++) {
    const ry = y + (32 + i * 4.3) * u;
    s += hline(tx, ry - 1.4 * u, tx + tw);
    s += soft(tx + 2.5 * u, ry, 1.4 * u, 1.4 * u, 0.4 * u, C.ink, 0.15) + soft(tx + 5 * u, ry, 10 * u + (i % 3) * 2 * u, 1.3 * u, 0.65 * u, C.ink, 0.6);
    s += soft(tx + 20 * u, ry, 8 * u, 1.3 * u, 0.65 * u, C.ink, 0.3);
    s += pill(tx + 34 * u, ry - 0.5 * u, 7 * u, 2.3 * u, i % 3 === 0 ? C.accent : C.ink, i % 3 === 0 ? 0.9 : 0.1);
    s += soft(tx + tw - 8 * u, ry, 5 * u, 1.3 * u, 0.65 * u, C.ink, 0.3);
  }
  // barras
  const bx = tx + tw + 3 * u;
  const bw = cw - tw - 3 * u;
  s += rect(bx, y + 25 * u, bw, h - 29 * u, 1.8 * u, C.paper) + outline(bx, y + 25 * u, bw, h - 29 * u, 1.8 * u);
  s += lines(bx + 2.5 * u, y + 28 * u, bw - 5 * u, 1, { h: 1.2 * u, widths: [0.5], fill: C.ink, opacity: 0.6 });
  const heights = [0.35, 0.55, 0.45, 0.8, 0.62, 0.9, 0.7];
  const base = y + h - 8 * u;
  const bh = h - 40 * u;
  heights.forEach((v, i) => {
    const xx = bx + 3 * u + i * ((bw - 6 * u) / heights.length);
    const ww = (bw - 6 * u) / heights.length - 1.5 * u;
    s += rect(xx, base - bh * v, ww, bh * v, 0.8 * u, i === 5 ? C.accent : C.line);
  });
  s += hline(bx + 2.5 * u, base, bx + bw - 2.5 * u);
  return s;
}

/** Tablero por estado (kanban). */
function kanban(x, y, w, h) {
  const u = w / 100;
  let s = topNav(x, y, w);
  s += heading(x + 4 * u, y + 8.5 * u, 40 * u, { h: 2.4 * u, widths: [0.4] }) + pill(x + 4 * u, y + 13 * u, 6 * u, 2.6 * u, C.accent) + pill(x + 11 * u, y + 13 * u, 5 * u, 2.6 * u, C.line) + pill(x + 17 * u, y + 13 * u, 7 * u, 2.6 * u, C.line);
  const cols = 4;
  const gap = 2 * u;
  const cw = (w - 8 * u - gap * (cols - 1)) / cols;
  const counts = [3, 4, 2, 3];
  for (let c = 0; c < cols; c++) {
    const cx = x + 4 * u + c * (cw + gap);
    s += rect(cx, y + 18 * u, cw, h - 20 * u, 2 * u, C.paper2);
    s += soft(cx + 2.5 * u, y + 21 * u, cw * 0.4, 1.4 * u, 0.7 * u, C.ink, 0.7) + circle(cx + cw - 4 * u, y + 21.7 * u, 1.4 * u, c === 1 ? C.accent : C.line);
    for (let i = 0; i < counts[c]; i++) {
      const cy = y + (26 + i * 13) * u;
      const hot = c === 1 && i === 0;
      s += rect(cx + 2 * u, cy, cw - 4 * u, 11 * u, 1.6 * u, C.paper) + (hot ? outline(cx + 2 * u, cy, cw - 4 * u, 11 * u, 1.6 * u, C.accent, 2) : '');
      s += lines(cx + 4 * u, cy + 2.5 * u, cw - 8 * u, 1, { h: 1.3 * u, widths: [0.8 - (i % 2) * 0.2], fill: C.ink, opacity: 0.7 });
      s += lines(cx + 4 * u, cy + 5.2 * u, cw - 8 * u, 1, { h: 1 * u, widths: [0.55] });
      s += pill(cx + 4 * u, cy + 7.8 * u, 5 * u, 1.8 * u, hot ? C.accent : C.ink, hot ? 0.9 : 0.1) + circle(cx + cw - 5.5 * u, cy + 8.7 * u, 1.3 * u, C.line);
    }
  }
  return s;
}

/** Indicadores: gráfico de líneas + leyenda + donut. */
function tabletChart(x, y, w, h) {
  const u = w / 100;
  let s = topNav(x, y, w);
  s += heading(x + 4 * u, y + 9 * u, 40 * u, { h: 2.6 * u, widths: [0.45] }) + pill(x + w - 22 * u, y + 9 * u, 8 * u, 3 * u, C.line) + pill(x + w - 13 * u, y + 9 * u, 9 * u, 3 * u, C.ink);
  // leyenda
  s += circle(x + 5 * u, y + 16 * u, 1 * u, C.accent) + soft(x + 7.5 * u, y + 15.4 * u, 8 * u, 1.2 * u, 0.6 * u, C.ink, 0.5) + circle(x + 20 * u, y + 16 * u, 1 * u, C.ink) + soft(x + 22.5 * u, y + 15.4 * u, 8 * u, 1.2 * u, 0.6 * u, C.ink, 0.5);
  const gx = x + 4 * u;
  const gy = y + 20 * u;
  const gw = 62 * u;
  const gh = h - 28 * u;
  for (let i = 0; i <= 4; i++) s += hline(gx, gy + (gh / 4) * i, gx + gw, C.line, 1.5);
  const pts = [0.6, 0.5, 0.58, 0.42, 0.46, 0.3, 0.34, 0.2, 0.26, 0.12];
  const pts2 = [0.8, 0.74, 0.7, 0.72, 0.6, 0.62, 0.5, 0.54, 0.44, 0.4];
  const toPath = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${f(gx + (gw / (arr.length - 1)) * i)} ${f(gy + gh * v)}`).join(' ');
  const areaD = `${toPath(pts)} L${f(gx + gw)} ${f(gy + gh)} L${f(gx)} ${f(gy + gh)} Z`;
  s += `<path d="${areaD}" fill="${C.accent}" fill-opacity="0.08"/>`;
  s += curve(toPath(pts2), C.ink, 2.2 * u * 0.5, 'stroke-dasharray="6 8"');
  s += curve(toPath(pts), C.accent, 1.2 * u);
  pts.forEach((v, i) => { if (i === 7) s += circle(gx + (gw / (pts.length - 1)) * i, gy + gh * v, 1.6 * u, C.paper, `stroke="${C.accent}" stroke-width="${f(0.8 * u)}"`); });
  // donut
  const dx = x + 83 * u;
  const dy = y + 36 * u;
  const dr = 11 * u;
  s += ring(dx, dy, dr, C.line, 4 * u);
  const circ = 2 * Math.PI * dr;
  s += `<circle cx="${f(dx)}" cy="${f(dy)}" r="${f(dr)}" fill="none" stroke="${C.accent}" stroke-width="${f(4 * u)}" stroke-dasharray="${f(circ * 0.62)} ${f(circ)}" stroke-linecap="round" transform="rotate(-90 ${f(dx)} ${f(dy)})"/>`;
  s += soft(dx - 5 * u, dy - 1.3 * u, 10 * u, 2.6 * u, 0.8 * u, C.ink, 0.8);
  for (let i = 0; i < 3; i++) s += circle(x + 74 * u, y + (56 + i * 5) * u, 1 * u, i === 0 ? C.accent : C.line) + soft(x + 77 * u, y + (55.4 + i * 5) * u, 12 * u, 1.2 * u, 0.6 * u, C.ink, 0.45) + soft(x + 92 * u, y + (55.4 + i * 5) * u, 4 * u, 1.2 * u, 0.6 * u, C.ink, 0.3);
  return s;
}

/** Ficha de pedido: lista + línea de tiempo. */
function opsDetail(x, y, w, h) {
  const u = w / 100;
  const sw = 14 * u;
  let s = sidebar(x, y, w, h, sw, 2);
  // lista
  const lx = x + sw;
  const lw = 30 * u;
  s += rect(lx, y, lw, h, 0, C.paper) + vline(lx + lw, y, y + h);
  s += outline(lx + 3 * u, y + 4 * u, lw - 6 * u, 4 * u, 2 * u, C.line, 2, C.paper2);
  for (let i = 0; i < 8; i++) {
    const ry = y + (11 + i * 7) * u;
    if (i === 2) s += rect(lx + 1.5 * u, ry - 2 * u, lw - 3 * u, 6.4 * u, 1.4 * u, C.paper2);
    s += soft(lx + 3.5 * u, ry, 12 * u + (i % 3) * 2 * u, 1.3 * u, 0.65 * u, C.ink, i === 2 ? 0.85 : 0.55) + soft(lx + 3.5 * u, ry + 2.3 * u, 9 * u, 1 * u, 0.5 * u, C.ink, 0.25);
    s += pill(lx + lw - 8 * u, ry, 5 * u, 2 * u, i === 2 ? C.accent : C.ink, i === 2 ? 1 : 0.1);
  }
  // detalle
  const dx = lx + lw + 5 * u;
  const dw = w - sw - lw - 10 * u;
  s += heading(dx, y + 5 * u, dw, { h: 2.6 * u, widths: [0.5] }) + pill(dx + dw - 9 * u, y + 5 * u, 9 * u, 3 * u, C.accent);
  s += lines(dx, y + 10 * u, dw, 1, { h: 1.1 * u, widths: [0.35] });
  for (let i = 0; i < 3; i++) s += rect(dx + i * (dw / 3), y + 14 * u, dw / 3 - 1.5 * u, 7 * u, 1.4 * u, C.paper2) + soft(dx + i * (dw / 3) + 2 * u, y + 16 * u, 6 * u, 1 * u, 0.5 * u, C.ink, 0.35) + soft(dx + i * (dw / 3) + 2 * u, y + 18.4 * u, 9 * u, 1.4 * u, 0.7 * u, C.ink, 0.7);
  // timeline
  const ty = y + 26 * u;
  s += vline(dx + 2 * u, ty, y + h - 6 * u, C.line, 2);
  for (let i = 0; i < 5; i++) {
    const cy = ty + i * 8 * u;
    s += circle(dx + 2 * u, cy + 1 * u, 1.3 * u, i === 0 ? C.accent : C.paper, i === 0 ? '' : `stroke="${C.line}" stroke-width="2"`);
    s += soft(dx + 6 * u, cy, dw * (0.45 + (i % 2) * 0.15), 1.3 * u, 0.65 * u, C.ink, 0.7) + soft(dx + 6 * u, cy + 2.6 * u, dw * 0.3, 1 * u, 0.5 * u, C.ink, 0.3) + circle(dx + dw - 2 * u, cy + 1 * u, 1.3 * u, C.line);
  }
  return s;
}

/** Diagrama de nodos (flujo de automatización). */
function nodeGraph(x, y, w, h, o = {}) {
  const u = w / 100;
  const dots = id('dots');
  let s = `<pattern id="${dots}" width="${f(3 * u)}" height="${f(3 * u)}" patternUnits="userSpaceOnUse"><circle cx="${f(1.5 * u)}" cy="${f(1.5 * u)}" r="${f(0.35 * u)}" fill="${C.line}"/></pattern>`;
  s += rect(x, y, w, h, 0, C.paper2) + rect(x, y, w, h, 0, `url(#${dots})`);
  if (o.chrome !== false) s += topNav(x, y, w, { avatar: false }) + rect(x, y, w, 5 * u, 0, C.paper, 'fill-opacity="0.9"') + hline(x, y + 5 * u, x + w);
  const nw = (o.nodeW ?? 15) * u;
  const nh = 8 * u;
  const nodes = o.nodes ?? [
    [8, 40, 'trigger'], [30, 40, 'step'], [52, 24, 'step'], [52, 56, 'step'], [74, 24, 'accent'], [74, 56, 'step'], [92, 40, 'end'],
  ];
  const edges = o.edges ?? [[0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6]];
  const pos = (n) => [x + n[0] * u, y + n[1] * (h / 100)];
  for (const [a, b] of edges) {
    const [ax, ay] = pos(nodes[a]);
    const [bx, by] = pos(nodes[b]);
    const sx = ax + nw / 2;
    const ex = bx - nw / 2;
    const mid = (sx + ex) / 2;
    s += curve(`M${f(sx)} ${f(ay)} C${f(mid)} ${f(ay)} ${f(mid)} ${f(by)} ${f(ex)} ${f(by)}`, C.accent, 0.5 * u, 'stroke-opacity="0.8"');
    s += circle(sx, ay, 0.7 * u, C.accent) + circle(ex, by, 0.7 * u, C.accent);
  }
  nodes.forEach((n) => {
    const [cx, cy] = pos(n);
    const nx = cx - nw / 2;
    const ny = cy - nh / 2;
    const kind = n[2];
    if (kind === 'trigger') {
      s += rect(nx, ny, nw, nh, nh / 2, C.ink) + circle(nx + 3.2 * u, cy, 1.5 * u, C.accent) + soft(nx + 6.5 * u, cy - 0.7 * u, nw - 9 * u, 1.4 * u, 0.7 * u, C.paper, 0.9);
    } else if (kind === 'end') {
      s += rect(nx, ny, nw, nh, nh / 2, C.accent) + circle(nx + 3.2 * u, cy, 1.6 * u, C.paper) + check(nx + 3.2 * u, cy, 1.2 * u, C.accent) + soft(nx + 6.5 * u, cy - 0.7 * u, nw - 9 * u, 1.4 * u, 0.7 * u, C.paper, 0.9);
    } else {
      const accent = kind === 'accent';
      s += rect(nx, ny, nw, nh, 1.6 * u, C.paper) + outline(nx, ny, nw, nh, 1.6 * u, accent ? C.accent : C.line, accent ? 2.5 : 2);
      s += rect(nx + 1.8 * u, ny + 1.8 * u, nh - 3.6 * u, nh - 3.6 * u, 1 * u, accent ? C.accent : C.paper2) + (accent ? '' : soft(nx + 1.8 * u + (nh - 3.6 * u) * 0.28, ny + 1.8 * u + (nh - 3.6 * u) * 0.28, (nh - 3.6 * u) * 0.44, (nh - 3.6 * u) * 0.44, 0.5 * u, C.ink, 0.25));
      s += soft(nx + nh - 0.6 * u, cy - 1.6 * u, nw - nh - 1 * u, 1.3 * u, 0.65 * u, C.ink, 0.75) + soft(nx + nh - 0.6 * u, cy + 0.6 * u, (nw - nh - 1 * u) * 0.6, 1 * u, 0.5 * u, C.ink, 0.3);
    }
  });
  return s;
}

/** Formulario de alta + panel de pasos. */
function laptopForm(x, y, w, h) {
  const u = w / 100;
  let s = topNav(x, y, w);
  s += heading(x + 4 * u, y + 9 * u, 50 * u, { h: 2.6 * u, widths: [0.4] }) + lines(x + 4 * u, y + 13.5 * u, 50 * u, 1, { h: 1.1 * u, widths: [0.6] });
  const fields = [[0, 1], [0, 0.48], [0.52, 0.48], [0, 1], [0, 0.48], [0.52, 0.48]];
  let row = 0;
  fields.forEach(([ox, fw], i) => {
    if (i === 2 || i === 5) row -= 1;
    const fx = x + 4 * u + ox * 54 * u;
    const fy = y + (19 + row * 11) * u;
    s += lines(fx, fy, 20 * u, 1, { h: 1 * u, widths: [0.5] });
    s += outline(fx, fy + 2.4 * u, fw * 54 * u - (fw < 1 ? 1 * u : 0), 5.4 * u, 1.4 * u, i === 3 ? C.accent : C.line, 2, C.paper);
    s += soft(fx + 2 * u, fy + 4.6 * u, 14 * u, 1.1 * u, 0.55 * u, C.ink, i === 3 ? 0.65 : 0.25);
    row += 1;
  });
  // toggles
  const ty = y + 63 * u;
  for (let i = 0; i < 2; i++) {
    const tx = x + 4 * u + i * 20 * u;
    s += pill(tx, ty, 6 * u, 3.2 * u, i === 0 ? C.accent : C.line) + circle(tx + (i === 0 ? 4.4 : 1.6) * u, ty + 1.6 * u, 1.2 * u, C.paper) + soft(tx + 8 * u, ty + 1.1 * u, 9 * u, 1.1 * u, 0.55 * u, C.ink, 0.5);
  }
  s += button(x + 4 * u, y + h - 12 * u, 16 * u, 5.4 * u, C.ink) + ghostButton(x + 22 * u, y + h - 12 * u, 12 * u, 5.4 * u);
  // panel pasos
  const px = x + 64 * u;
  const pw = 32 * u;
  s += rect(px, y + 9 * u, pw, h - 15 * u, 2 * u, C.paper2);
  s += heading(px + 3 * u, y + 13 * u, pw - 6 * u, { h: 1.8 * u, widths: [0.5] });
  const steps = ['done', 'done', 'done', 'active', 'todo', 'todo'];
  s += vline(px + 5.2 * u, y + 20 * u, y + 20 * u + (steps.length - 1) * 7.5 * u, C.line, 2);
  steps.forEach((st, i) => {
    const cy = y + 20 * u + i * 7.5 * u;
    if (st === 'done') s += circle(px + 5.2 * u, cy, 2 * u, C.accent) + check(px + 5.2 * u, cy, 1.4 * u);
    else if (st === 'active') s += circle(px + 5.2 * u, cy, 2 * u, C.paper, `stroke="${C.accent}" stroke-width="${f(0.6 * u)}"`) + circle(px + 5.2 * u, cy, 0.8 * u, C.accent);
    else s += circle(px + 5.2 * u, cy, 2 * u, C.paper, `stroke="${C.line}" stroke-width="2"`);
    s += soft(px + 10 * u, cy - 0.7 * u, (pw - 14 * u) * (0.6 + (i % 2) * 0.25), 1.3 * u, 0.65 * u, C.ink, st === 'todo' ? 0.3 : 0.75);
  });
  return s;
}

/** Documento tipo factura dentro de la pantalla. */
function invoiceDoc(x, y, w, h) {
  const u = w / 100;
  let s = rect(x, y, w, h, 0, C.paper2) + topNav(x, y, w) + rect(x, y, w, 5 * u, 0, C.paper) + hline(x, y + 5 * u, x + w);
  // toolbar
  s += pill(x + 4 * u, y + 8 * u, 8 * u, 3 * u, C.line) + pill(x + 13 * u, y + 8 * u, 8 * u, 3 * u, C.line) + pill(x + w - 14 * u, y + 8 * u, 10 * u, 3 * u, C.ink);
  const dx = x + 22 * u;
  const dw = 56 * u;
  const dy = y + 13 * u;
  s += `<rect x="${f(dx)}" y="${f(dy + 2 * u)}" width="${f(dw)}" height="${f(h)}" rx="${f(1.2 * u)}" fill="${C.ink}" fill-opacity="0.08" filter="url(#blur-s)"/>`;
  s += rect(dx, dy, dw, h, 1.2 * u, C.paper);
  s += soft(dx + 5 * u, dy + 5 * u, 7 * u, 7 * u, 1.5 * u, C.ink, 0.1) + lines(dx + dw - 23 * u, dy + 5 * u, 18 * u, 3, { h: 1.2 * u, gap: 1.6 * u, widths: [1, 0.7, 0.85] });
  s += heading(dx + 5 * u, dy + 16 * u, 30 * u, { h: 2 * u, widths: [0.5] }) + lines(dx + 5 * u, dy + 19.5 * u, 30 * u, 2, { h: 1 * u, gap: 1.4 * u, widths: [0.7, 0.5] });
  s += hline(dx + 5 * u, dy + 26 * u, dx + dw - 5 * u, C.ink, 1.5);
  for (let i = 0; i < 6; i++) {
    const ry = dy + (29 + i * 4.6) * u;
    s += soft(dx + 5 * u, ry, 20 * u + (i % 3) * 3 * u, 1.3 * u, 0.65 * u, C.ink, 0.55) + soft(dx + 34 * u, ry, 5 * u, 1.3 * u, 0.65 * u, C.ink, 0.3) + soft(dx + dw - 12 * u, ry, 7 * u, 1.3 * u, 0.65 * u, C.ink, 0.5);
    s += hline(dx + 5 * u, ry + 3 * u, dx + dw - 5 * u);
  }
  s += soft(dx + dw - 28 * u, dy + 59 * u, 10 * u, 1.3 * u, 0.65 * u, C.ink, 0.4) + rect(dx + dw - 15 * u, dy + 58.4 * u, 10 * u, 2.4 * u, 0.8 * u, C.ink);
  s += pill(dx + 5 * u, dy + 57.5 * u, 14 * u, 4 * u, C.accent, 0.14) + circle(dx + 8 * u, dy + 59.5 * u, 1.1 * u, C.accent) + pill(dx + 10.5 * u, dy + 59 * u, 6.5 * u, 1.1 * u, C.accent);
  // panel derecho
  const px = x + 82 * u;
  s += rect(px, y + 13 * u, 14 * u, 20 * u, 1.4 * u, C.paper);
  for (let i = 0; i < 3; i++) s += circle(px + 3 * u, y + (17 + i * 5) * u, 1.3 * u, i < 2 ? C.accent : C.line) + (i < 2 ? check(px + 3 * u, y + (17 + i * 5) * u, 0.9 * u) : '') + soft(px + 6 * u, y + (16.4 + i * 5) * u, 6 * u, 1.2 * u, 0.6 * u, C.ink, 0.45);
  return s;
}

/** Portada de lanzamiento: titular enorme + círculo + carril de scroll. */
function heroLaunch(x, y, w, h) {
  const u = w / 100;
  let s = topNav(x, y, w, { avatar: false });
  s += circle(x + 82 * u, y + 44 * u, 26 * u, C.accent);
  s += circle(x + 82 * u, y + 44 * u, 26 * u, 'none', `stroke="${C.paper}" stroke-width="${f(0.8 * u)}" stroke-opacity="0.35" transform="translate(${f(-3 * u)} ${f(3 * u)})"`);
  s += heading(x + 6 * u, y + 16 * u, 60 * u, { n: 3, h: 7.5 * u, gap: 2.2 * u, widths: [0.86, 0.62, 0.4], opacity: 0.92 });
  s += rect(x + 6 * u + 60 * u * 0.4 + 2 * u, y + 16 * u + 2 * (7.5 + 2.2) * u, 60 * u * 0.3, 7.5 * u, 3.75 * u, C.accent);
  s += lines(x + 6 * u, y + 48 * u, 36 * u, 3, { h: 1.3 * u, gap: 1.8 * u, widths: [1, 0.86, 0.5] });
  s += button(x + 6 * u, y + 60 * u, 15 * u, 5.4 * u, C.ink) + ghostButton(x + 23 * u, y + 60 * u, 13 * u, 5.4 * u);
  // carril
  s += vline(x + 96 * u, y + 12 * u, y + h - 8 * u, C.line, 2);
  for (let i = 0; i < 5; i++) s += i === 0 ? circle(x + 96 * u, y + (12 + i * 11) * u, 1.4 * u, C.ink) : circle(x + 96 * u, y + (12 + i * 11) * u, 1 * u, C.line);
  s += rect(x + 95.5 * u, y + 12 * u, 1 * u, 8 * u, 0.5 * u, C.ink);
  return s;
}

/** Capítulo partido: texto a la izquierda, imagen y tarjetas a la derecha. */
function laptopSplit(x, y, w, h) {
  const u = w / 100;
  let s = topNav(x, y, w, { avatar: false });
  s += pill(x + 6 * u, y + 12 * u, 8 * u, 2.4 * u, C.accent, 0.15) + pill(x + 8 * u, y + 12.7 * u, 4 * u, 1 * u, C.accent);
  s += heading(x + 6 * u, y + 18 * u, 40 * u, { n: 2, h: 5 * u, gap: 1.8 * u, widths: [0.95, 0.6] });
  s += lines(x + 6 * u, y + 34 * u, 36 * u, 4, { h: 1.3 * u, gap: 1.8 * u, widths: [1, 0.9, 0.95, 0.5] });
  for (let i = 0; i < 3; i++) s += circle(x + 7.5 * u, y + (50 + i * 4.5) * u, 1.1 * u, i === 0 ? C.accent : C.line) + soft(x + 11 * u, y + (49.4 + i * 4.5) * u, 18 * u + (i % 2) * 6 * u, 1.2 * u, 0.6 * u, C.ink, 0.55);
  // derecha
  const rx = x + 52 * u;
  s += rect(rx, y + 9 * u, 44 * u, h - 13 * u, 2.5 * u, C.paper2);
  s += circle(rx + 30 * u, y + 30 * u, 13 * u, C.ink);
  s += `<rect x="${f(rx + 6 * u)}" y="${f(y + 32 * u)}" width="${f(22 * u)}" height="${f(14 * u)}" rx="${f(1.6 * u)}" fill="${C.ink}" fill-opacity="0.1" filter="url(#blur-s)"/>`;
  s += rect(rx + 5 * u, y + 30 * u, 22 * u, 14 * u, 1.6 * u, C.paper) + soft(rx + 7.5 * u, y + 33 * u, 10 * u, 1.3 * u, 0.65 * u, C.ink, 0.7) + lines(rx + 7.5 * u, y + 36.5 * u, 17 * u, 2, { h: 1 * u, gap: 1.4 * u, widths: [1, 0.6] }) + pill(rx + 7.5 * u, y + 41 * u, 6 * u, 1.6 * u, C.accent);
  s += `<rect x="${f(rx + 24 * u)}" y="${f(y + 46 * u)}" width="${f(16 * u)}" height="${f(10 * u)}" rx="${f(1.6 * u)}" fill="${C.ink}" fill-opacity="0.1" filter="url(#blur-s)"/>`;
  s += rect(rx + 23 * u, y + 44 * u, 16 * u, 10 * u, 1.6 * u, C.paper) + circle(rx + 26.5 * u, y + 48 * u, 1.6 * u, C.accent) + lines(rx + 29.5 * u, y + 47 * u, 8 * u, 2, { h: 1 * u, gap: 1.3 * u, widths: [1, 0.6], fill: C.ink, opacity: 0.4 });
  return s;
}

/* ───────────── Composiciones ───────────── */

const DEFS = `<defs>
  <filter id="blur" filterUnits="userSpaceOnUse" x="-200" y="-200" width="${W + 400}" height="${H + 400}"><feGaussianBlur stdDeviation="30"/></filter>
  <filter id="blur-s" filterUnits="userSpaceOnUse" x="-200" y="-200" width="${W + 400}" height="${H + 400}"><feGaussianBlur stdDeviation="8"/></filter>
</defs>`;

const svg = (bg, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}${rect(0, 0, W, H, 0, bg)}${body}</svg>`;

/** Centrado vertical de un dispositivo de alto h. */
const vc = (h) => (H - h) / 2;

const CASES = {
  'marketplace-de-reservas': {
    cover: () => svg(C.paper, laptop(140, vc(laptop.h(900)) - 20, 900, laptopSearch) + phone(1130, vc(phone.h(330)) + 40, 330, phoneList)),
    g1: () => {
      const w = 390;
      return svg(
        C.paper2,
        floatingCard(230, 430, 320, 150, (x, y) => circle(x + 34, y + 36, 14, C.accent) + check(x + 34, y + 36, 10) + lines(x + 60, y + 28, 220, 2, { h: 12, gap: 10, widths: [0.9, 0.55], fill: C.ink, opacity: 0.6 }) + pill(x + 24, y + 96, 90, 28, C.accent, 0.14) + pill(x + 124, y + 96, 70, 28, C.line)) +
          floatingCard(1050, 600, 320, 180, (x, y) => lines(x + 24, y + 28, 270, 1, { h: 12, widths: [0.5], fill: C.ink, opacity: 0.7 }) + lines(x + 24, y + 54, 270, 3, { h: 10, gap: 12, widths: [1, 0.8, 0.6] }) + pill(x + 24, y + 128, 120, 30, C.ink)) +
          phone((W - w) / 2, vc(phone.h(w)), w, phoneCalendar),
      );
    },
    g2: () => svg(C.paper, laptop(250, vc(laptop.h(1100)), 1100, laptopListing)),
    g3: () => svg(C.paper2, phone(420, vc(phone.h(340)) - 40, 340, phoneForm) + phone(840, vc(phone.h(340)) + 40, 340, phoneSuccess)),
  },
  'panel-de-operaciones': {
    cover: () => svg(C.paper2, laptop(250, vc(laptop.h(1100)), 1100, opsDashboard)),
    g1: () => svg(C.paper, laptop(200, vc(laptop.h(1200)), 1200, kanban)),
    g2: () => svg(C.paper2, tablet(350, vc(tablet.h(900)), 900, tabletChart)),
    g3: () => svg(C.paper, laptop(250, vc(laptop.h(1100)), 1100, opsDetail)),
  },
  'alta-de-clientes-y-facturacion': {
    cover: () => svg(C.paper, laptop(130, vc(laptop.h(1000)) - 30, 1000, (x, y, w, h) => nodeGraph(x, y, w, h)) + phone(1190, vc(phone.h(300)) + 60, 300, phoneNotifications)),
    g1: () =>
      svg(
        C.paper2,
        laptop(200, vc(laptop.h(1200)), 1200, (x, y, w, h) =>
          nodeGraph(x, y, w, h, {
            nodeW: 14,
            nodes: [[7, 50, 'trigger'], [25, 50, 'step'], [43, 28, 'step'], [43, 72, 'accent'], [61, 28, 'step'], [61, 72, 'step'], [79, 50, 'step'], [94, 50, 'end']],
            edges: [[0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6], [6, 7]],
          }),
        ),
      ),
    g2: () => svg(C.paper, laptop(250, vc(laptop.h(1100)), 1100, laptopForm)),
    g3: () => svg(C.paper2, laptop(180, vc(laptop.h(1000)) - 20, 1000, invoiceDoc) + phone(1250, vc(phone.h(270)) + 80, 270, phoneDoc)),
  },
  'web-de-lanzamiento': {
    cover: () => svg(C.paper2, laptop(250, vc(laptop.h(1100)), 1100, heroLaunch)),
    g1: () => {
      const w = 370;
      return svg(C.paper, circle(560, 720, 300, C.accent, 'fill-opacity="0.1"') + circle(1120, 360, 180, C.ink, 'fill-opacity="0.05"') + phone((W - w) / 2, vc(phone.h(w)), w, (x, y, ww, hh) => phoneChapters(x, y, ww, hh, 0)));
    },
    g2: () => svg(C.paper2, laptop(200, vc(laptop.h(1200)), 1200, laptopSplit)),
    g3: () =>
      svg(
        C.paper,
        phone(300, vc(phone.h(300)) + 70, 300, (x, y, w, h) => phoneChapters(x, y, w, h, 0)) +
          phone(650, vc(phone.h(300)) - 70, 300, (x, y, w, h) => phoneChapters(x, y, w, h, 1)) +
          phone(1000, vc(phone.h(300)) + 70, 300, (x, y, w, h) => phoneChapters(x, y, w, h, 2)),
      ),
  },
};

async function main() {
  let count = 0;
  for (const [slug, images] of Object.entries(CASES)) {
    const dir = path.join(OUT, slug);
    await fs.mkdir(dir, { recursive: true });
    for (const [name, build] of Object.entries(images)) {
      const file = path.join(dir, `${name}.webp`);
      const markup = build();
      await sharp(Buffer.from(markup)).resize(W, H).webp({ quality: 84, effort: 5 }).toFile(file);
      const { size } = await fs.stat(file);
      console.log(`✓ ${path.relative(process.cwd(), file)}  ${(size / 1024).toFixed(0)} KB`);
      count += 1;
    }
  }
  console.log(`\n${count} imágenes generadas en public/projects/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
