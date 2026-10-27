#!/usr/bin/env node
/**
 * PNG (RGBA, render de Blender) → WebP optimizados para el hero (§7.7).
 *
 *   assets/frames_src/desktop/0001.png … 0150.png  →  public/sequence/v2/desktop/f_0001.webp … f_0150.webp (1200², q72)
 *   assets/frames_src/mobile/0001.png  … 0150.png  →  public/sequence/v2/mobile/f_0001.webp  … f_0090.webp (720×900, q70)
 *   + poster-first.webp, poster-first-mobile.webp, poster-last.webp (copias exactas de frames)
 *   + public/og/poster-last.png (1200², para la imagen OG)
 *
 * Las sombras con alfa del shadow catcher se componen sobre blanco puro (#FFFFFF).
 * Antes, el alfa se desvanece en una franja junto a los bordes (EDGE_FADE): la cola de las
 * sombras suaves llega muy atenuada hasta el borde del encuadre y dibujaría un rectángulo
 * gris sobre la página. El objeto nunca entra en esa franja (margen ≥ 8 %, §7.2).
 * Uso: node scripts/build-sequence.mjs
 */
import sharp from 'sharp';
import { readdir, mkdir, rm, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';

const VERSION = 'v2';
const BASE = `public/sequence/${VERSION}`;
const CONCURRENCY = 6;
/** Franja de desvanecimiento del alfa, en fracción del lado: [borde totalmente blanco, sin efecto]. */
const EDGE_FADE = [0.012, 0.1];

const masks = new Map();
function edgeMask(w, h) {
  const key = `${w}x${h}`;
  if (masks.has(key)) return masks.get(key);
  const [e0, e1] = EDGE_FADE;
  const m = new Float32Array(w * h);
  const ss = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  for (let y = 0; y < h; y++) {
    const dy = Math.min(y, h - 1 - y) / h;
    for (let x = 0; x < w; x++) {
      const dx = Math.min(x, w - 1 - x) / w;
      m[y * w + x] = ss((Math.min(dx, dy) - e0) / (e1 - e0));
    }
  }
  masks.set(key, m);
  return m;
}

/** PNG RGBA → sharp con el alfa desvanecido en los bordes y aplanado sobre blanco. */
async function prepared(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = edgeMask(info.width, info.height);
  for (let i = 0, p = 3; i < mask.length; i++, p += 4) data[p] = Math.round(data[p] * mask[i]);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).flatten({ background: '#ffffff' });
}

const targets = [
  { name: 'desktop', src: 'assets/frames_src/desktop', out: `${BASE}/desktop`, width: 1200, height: 1200, count: 150, quality: 72 },
  { name: 'mobile', src: 'assets/frames_src/mobile', out: `${BASE}/mobile`, width: 720, height: 900, count: 90, quality: 70 },
];

async function pool(items, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

for (const t of targets) {
  const files = (await readdir(t.src)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  if (!files.length) throw new Error(`Sin frames en ${t.src}`);
  await rm(t.out, { recursive: true, force: true });
  await mkdir(t.out, { recursive: true });

  await pool(Array.from({ length: t.count }, (_, i) => i), async (i) => {
    // Submuestreo: frame de origen más cercano a la fracción i/(count-1)
    const srcIndex = Math.round((i * (files.length - 1)) / (t.count - 1));
    const name = `f_${String(i + 1).padStart(4, '0')}.webp`;
    await (await prepared(path.join(t.src, files[srcIndex])))
      .resize(t.width, t.height, { fit: 'cover' })
      .webp({ quality: t.quality, effort: 6, smartSubsample: true })
      .toFile(path.join(t.out, name));
  });
  let total = 0;
  for (const f of await readdir(t.out)) total += (await stat(path.join(t.out, f))).size;
  console.log(`${t.name}: ${t.count} frames → ${t.out} (${(total / 1024 / 1024).toFixed(2)} MB, ${(total / t.count / 1024).toFixed(0)} KB/frame)`);
}

// Pósters = copias exactas de frames (cambio póster → canvas imperceptible)
await copyFile(`${BASE}/desktop/f_0001.webp`, `${BASE}/poster-first.webp`);
await copyFile(`${BASE}/mobile/f_0001.webp`, `${BASE}/poster-first-mobile.webp`);
await copyFile(`${BASE}/desktop/f_0150.webp`, `${BASE}/poster-last.webp`);

// OG: el generador de next/og no lee WebP de forma fiable → PNG del último frame
await mkdir('public/og', { recursive: true });
const lastSrc = (await readdir('assets/frames_src/desktop')).filter((f) => f.endsWith('.png')).sort().pop();
await (await prepared(path.join('assets/frames_src/desktop', lastSrc))).resize(1200, 1200).png({ compressionLevel: 9 }).toFile('public/og/poster-last.png');
console.log('Pósters y public/og/poster-last.png generados.');
