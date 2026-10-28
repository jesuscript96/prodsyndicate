#!/usr/bin/env node
/**
 * Texturas de la escena «Procesos que se hacen solos» (Automatización e IA).
 * UI abstracta: barras redondeadas como texto, iconos geométricos, sin texto legible ni logos.
 *
 *   assets/hero/textures/automatizacion-ia/doc_0..2.png      documentos de la pila (440×300)
 *   assets/hero/textures/automatizacion-ia/node_<k>.png      caras de los nodos del flujo (440×300)
 *                                                            k ∈ a1 a2 a3 hub router b1 b2 b3
 *   assets/hero/textures/automatizacion-ia/monitor.png       panel de monitorización (620×440)
 *
 * Uso (desde la raíz del proyecto): node scripts/hero/textures/automatizacion-ia.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'assets/hero/textures/automatizacion-ia';
await mkdir(OUT, { recursive: true });

const C = {
  white: '#FFFFFF', paper: '#F6F6F3', line: '#E8E8E3', ink: '#0B0B0F', ink2: '#3A3A42', ink3: '#6B6B76',
  accent: '#2B3BFF', accentSoft: '#EEF0FF',
};

const bar = (x, y, w, h, fill, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" opacity="${o}"/>`;
const box = (x, y, w, h, r, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const dot = (cx, cy, r, fill, o = 1) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${o}"/>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`;
const write = (name, w, h, body) => sharp(Buffer.from(svg(w, h, body))).png().toFile(`${OUT}/${name}.png`);

// ───────────── Documentos de la pila (440×300) ─────────────
const docs = [
  // v0: ficha con avatar y tabla
  `${box(0, 0, 440, 300, 0, C.white)}
   ${dot(44, 46, 18, C.ink)}${bar(74, 36, 150, 14, C.ink)}${bar(74, 58, 96, 10, C.ink3, 0.55)}
   ${box(322, 32, 86, 30, 15, C.accentSoft)}${bar(340, 42, 50, 10, C.accent)}
   ${[100, 136, 172, 208].map((y, i) => `${bar(28, y, 120 + (i % 2) * 40, 12, C.ink2, 0.75)}${bar(214, y, 80 + ((i * 3) % 4) * 18, 12, C.ink3, 0.5)}${bar(350, y, 58, 12, i === 1 ? C.accent : C.line)}`).join('')}
   <rect x="28" y="246" width="384" height="2" fill="${C.line}"/>${bar(28, 262, 180, 10, C.ink3, 0.5)}`,
  // v1: informe con gráfico
  `${box(0, 0, 440, 300, 0, C.white)}
   ${bar(28, 32, 170, 16, C.ink)}${bar(28, 58, 110, 10, C.ink3, 0.55)}
   ${box(28, 86, 384, 128, 20, C.paper)}
   <path d="M56,186 C100,186 110,150 150,152 C190,154 200,118 246,120 C290,122 300,96 340,98 C364,99 376,110 388,112 L388,196 L56,196 Z" fill="${C.accentSoft}"/>
   <path d="M56,186 C100,186 110,150 150,152 C190,154 200,118 246,120 C290,122 300,96 340,98 C364,99 376,110 388,112" fill="none" stroke="${C.accent}" stroke-width="6" stroke-linecap="round"/>
   ${bar(28, 236, 140, 12, C.ink2, 0.75)}${bar(28, 260, 220, 10, C.ink3, 0.5)}${box(312, 232, 100, 36, 18, C.ink)}`,
  // v2: formulario
  `${box(0, 0, 440, 300, 0, C.white)}
   ${bar(28, 30, 130, 14, C.ink)}
   ${[64, 118, 172].map((y, i) => `${bar(28, y, 70 + i * 16, 10, C.ink3, 0.6)}${box(28, y + 18, 384, 30, 10, C.paper)}${bar(42, y + 28, 120 + ((i * 5) % 3) * 50, 10, C.ink2, 0.6)}`).join('')}
   ${box(28, 236, 150, 36, 18, C.accent)}${bar(70, 249, 66, 10, C.white)}
   ${dot(372, 254, 12, C.line)}${dot(404, 254, 12, C.line)}`,
];
for (let i = 0; i < docs.length; i++) await write(`doc_${i}`, 440, 300, docs[i]);

// ───────────── Nodos del flujo (440×300) ─────────────
// Icono (en caja 100×100 con origen en 0,0) → string SVG
const ICONS = {
  a1: (c) => `${bar(22, 28, 56, 9, c)}${bar(22, 46, 40, 9, c)}${bar(22, 64, 48, 9, c)}`, // formulario
  a2: (c) => [0, 1, 2].map((r) => [0, 1, 2].map((k) => dot(30 + k * 20, 30 + r * 20, 6, c)).join('')).join(''), // tabla
  a3: (c) => `<path d="M24,30 h52 a10,10 0 0 1 10,10 v22 a10,10 0 0 1 -10,10 h-28 l-14,12 v-12 h-10 a10,10 0 0 1 -10,-10 v-22 a10,10 0 0 1 10,-10 z" fill="${c}"/>${bar(34, 44, 32, 6, C.white)}${bar(34, 56, 22, 6, C.white)}`, // chat
  hub: (c) => `<rect x="18" y="36" width="40" height="28" rx="14" fill="none" stroke="${c}" stroke-width="8"/><rect x="42" y="36" width="40" height="28" rx="14" fill="none" stroke="${c}" stroke-width="8"/>`, // enlace / API
  router: (c) => `${dot(26, 50, 9, c)}<path d="M26,50 C48,50 48,26 74,26 M26,50 h48 M26,50 C48,50 48,74 74,74" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>${dot(74, 26, 7, c)}${dot(74, 50, 7, c)}${dot(74, 74, 7, c)}`, // ramas
  b1: (c) => `<rect x="28" y="20" width="44" height="60" rx="8" fill="none" stroke="${c}" stroke-width="7"/>${bar(38, 36, 24, 6, c)}${bar(38, 50, 24, 6, c)}${bar(38, 64, 16, 6, c)}`, // documento
  b2: (c) => `${box(24, 54, 12, 26, 6, c)}${box(44, 38, 12, 42, 6, c)}${box(64, 22, 12, 58, 6, c)}`, // gráfico
  b3: (c) => `<circle cx="50" cy="50" r="24" fill="none" stroke="${c}" stroke-width="7"/>${dot(50, 50, 8, c)}`, // aviso
};
const NODE_STYLE = {
  a1: ['ink', 'paper'], a2: ['ink', 'paper'], a3: ['ink', 'paper'],
  hub: ['accent', 'accentSoft'], router: ['accent', 'accentSoft'],
  b1: ['ink', 'paper'], b2: ['ink', 'paper'], b3: ['ink', 'paper'],
};
for (const [k, icon] of Object.entries(ICONS)) {
  const [ic, bg] = NODE_STYLE[k];
  const body = `${box(0, 0, 440, 300, 0, C.white)}
    ${box(34, 48, 100, 100, 26, C[bg])}<g transform="translate(34,48)">${icon(C[ic])}</g>
    ${bar(160, 70, 170 + ((k.length * 7) % 3) * 24, 18, C.ink)}${bar(160, 104, 110 + ((k.length * 5) % 4) * 14, 12, C.ink3, 0.55)}
    ${box(34, 184, 372, 36, 11, C.paper)}${bar(50, 197, 140 + ((k.length * 3) % 3) * 40, 10, C.ink2, 0.6)}
    ${box(34, 234, 250, 36, 11, C.paper)}${bar(50, 247, 110, 10, C.ink2, 0.6)}
    ${dot(388, 252, 9, k === 'hub' || k === 'router' ? C.accent : C.line)}`;
  await write(`node_${k}`, 440, 300, body);
}

// ───────────── Panel de monitorización (620×440) ─────────────
{
  const pts = [[60, 230], [120, 214], [180, 222], [240, 190], [300, 198], [360, 160], [420, 170], [480, 146], [540, 150], [584, 136]];
  const smooth = (p) => p.slice(1).reduce((s, [x1, y1], i) => {
    const [x0, y0] = p[i]; const mx = (x0 + x1) / 2;
    return `${s} C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }, `M${p[0][0]},${p[0][1]}`);
  const body = `${box(0, 0, 620, 440, 0, C.white)}
    ${bar(36, 38, 170, 18, C.ink)}${bar(36, 68, 110, 12, C.ink3, 0.55)}
    ${box(474, 34, 110, 40, 20, C.paper)}${bar(496, 49, 44, 10, C.ink2, 0.6)}
    ${box(36, 100, 548, 160, 24, C.paper)}
    <path d="${smooth(pts)} L584,244 L60,244 Z" fill="${C.accentSoft}"/>
    <path d="${smooth(pts)}" fill="none" stroke="${C.accent}" stroke-width="7" stroke-linecap="round"/>
    ${dot(584, 136, 11, C.white)}<circle cx="584" cy="136" r="10" fill="none" stroke="${C.accent}" stroke-width="6"/>
    ${[292, 342, 392].map((y, i) => `${dot(56, y, 10, i === 2 ? C.line : C.accent, i === 1 ? 0.6 : 1)}${bar(82, y - 7, 180 - i * 30, 14, C.ink2, 0.8)}${box(450, y - 16, 134, 32, 16, i === 0 ? C.accentSoft : C.paper)}${bar(480, y - 5, 74, 10, i === 0 ? C.accent : C.ink3, i === 0 ? 1 : 0.5)}`).join('')}`;
  await write('monitor', 620, 440, body);
}

console.log(`Texturas listas en ${OUT}`);
