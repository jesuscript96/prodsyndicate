#!/usr/bin/env node
// Verifica que los bordes de todos los frames son blanco puro (§7.7). Uso: node scripts/check-white.mjs <carpeta>
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const dirs = process.argv.slice(2);
if (!dirs.length) throw new Error('Uso: node scripts/check-white.mjs <carpeta> [<carpeta>…]');

const MIN = 252; // tolerancia por compresión con pérdida
let failed = 0;
for (const dir of dirs) {
  let files;
  try {
    files = (await readdir(dir)).filter((x) => x.endsWith('.webp')).sort();
  } catch {
    console.log(`(se omite ${dir}: no existe)`);
    continue;
  }
  let bad = 0;
  for (const f of files) {
    const { data, info } = await sharp(path.join(dir, f)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h, channels: c } = info;
    const px = (x, y) => [0, 1, 2].map((k) => data[(y * w + x) * c + k]);
    const points = [
      [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
      [w >> 1, 0], [w >> 1, h - 1], [0, h >> 1], [w - 1, h >> 1],
    ];
    const worst = Math.min(...points.flatMap(([x, y]) => px(x, y)));
    if (worst < MIN) {
      console.log(`✗ ${dir}/${f}: valor mínimo ${worst}`);
      bad++;
    }
  }
  console.log(bad ? `${dir}: ${bad} de ${files.length} frames fuera de tolerancia` : `${dir}: OK, ${files.length} frames con bordes blanco puro (±3)`);
  failed += bad;
}
process.exit(failed ? 1 : 0);
