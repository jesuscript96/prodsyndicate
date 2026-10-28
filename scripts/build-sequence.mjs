#!/usr/bin/env node
/**
 * PNG (RGBA, render de Blender) → WebP optimizados para las historias por scroll (§7.7).
 *
 * Uso:
 *   node scripts/build-sequence.mjs                 # home (por defecto)
 *   node scripts/build-sequence.mjs mvp              # una página de servicio
 *   node scripts/build-sequence.mjs --services       # las cuatro páginas de servicio que tengan render
 *
 * Home:      assets/frames_src/{desktop,mobile}/NNNN.png        → public/sequence/v2/…  (150 / 90 frames)
 * Servicio:  assets/frames_src/<slug>/{desktop,mobile}/NNNN.png → public/sequence/<slug>/<versión>/… (120 / 72)
 *            (+ grid/r<fila>_c<col>.png → grid/*.webp si la escena renderiza la rejilla de puntos de vista)
 * En cada destino: desktop/f_NNNN.webp (1200², q72), mobile/f_NNNN.webp (720×900, q70, submuestreado),
 * poster-first.webp, poster-first-mobile.webp, poster-last.webp. La home genera además public/og/poster-last.png.
 *
 * Las sombras con alfa del shadow catcher se componen sobre blanco puro (#FFFFFF).
 * Antes, el alfa se desvanece en una franja junto a los bordes (EDGE_FADE): la cola de las
 * sombras suaves llega muy atenuada hasta el borde del encuadre y dibujaría un rectángulo
 * gris sobre la página. El objeto nunca entra en esa franja (margen ≥ 8 %, §7.2).
 */
import sharp from 'sharp';
import { readdir, mkdir, rm, copyFile, stat, access } from 'node:fs/promises';
import path from 'node:path';

const SERVICES = ['mvp', 'software-a-medida', 'automatizacion-ia', 'productos-creativos'];
/** Versión publicada de cada secuencia de servicio (la caché es inmutable: un render nuevo, versión nueva). */
const VERSIONS = { 'productos-creativos': 'v2' };
const SCENES = {
  home: { src: 'assets/frames_src', out: 'public/sequence/v2', desktop: 150, mobile: 90, og: true },
  ...Object.fromEntries(
    SERVICES.map((slug) => [
      slug,
      { src: `assets/frames_src/${slug}`, out: `public/sequence/${slug}/${VERSIONS[slug] ?? 'v1'}`, desktop: 120, mobile: 72 },
    ]),
  ),
};

const exists = (p) => access(p).then(() => true, () => false);
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

/** Ejecuta fn sobre items con como mucho CONCURRENCY tareas a la vez. */
async function pool(items, fn) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) await fn(queue.shift());
    }),
  );
}

async function buildScene(name) {
  const scene = SCENES[name];
  if (!scene) throw new Error(`Escena desconocida: ${name}. Opciones: ${Object.keys(SCENES).join(', ')}`);
  // SEQ_SRC (solo pruebas): leer los PNG de otra carpeta, p. ej. frames provisionales mientras se renderiza
  const sc = process.env.SEQ_SRC ? { ...scene, src: process.env.SEQ_SRC } : scene;
  const targets = [
    { name: 'desktop', src: `${sc.src}/desktop`, out: `${sc.out}/desktop`, width: 1200, height: 1200, count: sc.desktop, quality: 72 },
    { name: 'mobile', src: `${sc.src}/mobile`, out: `${sc.out}/mobile`, width: 720, height: 900, count: sc.mobile, quality: 70 },
  ];
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
    console.log(`${name} · ${t.name}: ${t.count} frames → ${t.out} (${(total / 1024 / 1024).toFixed(2)} MB, ${(total / t.count / 1024).toFixed(0)} KB/frame)`);
  }

  // Pósters = copias exactas de frames (cambio póster → canvas imperceptible)
  const pad = (n) => String(n).padStart(4, '0');
  await copyFile(`${sc.out}/desktop/f_0001.webp`, `${sc.out}/poster-first.webp`);
  await copyFile(`${sc.out}/mobile/f_0001.webp`, `${sc.out}/poster-first-mobile.webp`);
  await copyFile(`${sc.out}/desktop/f_${pad(sc.desktop)}.webp`, `${sc.out}/poster-last.webp`);

  if (sc.og) {
    // OG: el generador de next/og no lee WebP de forma fiable → PNG del último frame
    await mkdir('public/og', { recursive: true });
    const lastSrc = (await readdir(`${sc.src}/desktop`)).filter((f) => f.endsWith('.png')).sort().pop();
    await (await prepared(path.join(`${sc.src}/desktop`, lastSrc))).resize(1200, 1200).png({ compressionLevel: 9 }).toFile('public/og/poster-last.png');
  }
  console.log(`${name}: pósters generados${sc.og ? ' + public/og/poster-last.png' : ''}.`);

  // Rejilla de puntos de vista (demo interactiva de la página), si la escena la renderiza
  const gridSrc = `${sc.src}/grid`;
  if (await exists(`${gridSrc}/meta.json`)) {
    const gridOut = `${sc.out}/grid`;
    await rm(gridOut, { recursive: true, force: true });
    await mkdir(gridOut, { recursive: true });
    const cells = (await readdir(gridSrc)).filter((f) => f.endsWith('.png'));
    await pool(cells, async (f) =>
      (await prepared(path.join(gridSrc, f)))
        .webp({ quality: 74, effort: 6, smartSubsample: true })
        .toFile(path.join(gridOut, f.replace(/\.png$/, '.webp'))),
    );
    await copyFile(`${gridSrc}/meta.json`, `${gridOut}/meta.json`);
    let total = 0;
    for (const f of await readdir(gridOut)) total += (await stat(path.join(gridOut, f))).size;
    console.log(`${name} · rejilla: ${cells.length} vistas → ${gridOut} (${(total / 1024 / 1024).toFixed(2)} MB)`);
  }
}

const argv = process.argv.slice(2);
const names = argv.includes('--services')
  ? (await Promise.all(SERVICES.map(async (s) => ((await exists(`assets/frames_src/${s}/desktop`)) ? s : null)))).filter(Boolean)
  : argv.length
    ? argv
    : ['home'];
if (!names.length) console.log('No hay renders de servicios en assets/frames_src/<slug>/.');
for (const n of names) await buildScene(n);
