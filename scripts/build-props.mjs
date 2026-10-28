#!/usr/bin/env node
/**
 * Objetos de las secciones (render de scripts/hero/props.py) → WebP con alfa para la web.
 *   assets/props_src/<prop>/NNNN.png + meta.json  →  public/props/<prop>/f_NNNN.webp + meta.json
 * El alfa se conserva (sombras suaves incluidas): los objetos se superponen a la página.
 * Los `float-*` (profundidad) y `frag-*` (piezas del «&» de productos creativos) se empaquetan solo como hoja de sprites 8 × 6 de 256 px
 * (`sheet.webp`): una sola petición por objeto y cambio de frame con background-position.
 * Uso: node scripts/build-props.mjs [prop ...]   (sin argumentos: todos los que tengan render)
 */
import sharp from 'sharp';
import { readdir, mkdir, rm, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets/props_src';
const OUT = 'public/props';
const names = process.argv.slice(2).length ? process.argv.slice(2) : (await readdir(SRC)).sort();

for (const name of names) {
  const dir = path.join(SRC, name);
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.png')).sort();
  } catch {
    console.log(`(se omite ${name}: sin render)`);
    continue;
  }
  if (!files.length) continue;
  const meta = JSON.parse(await readFile(path.join(dir, 'meta.json'), 'utf8').catch(() => '{}'));
  const out = path.join(OUT, name);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  const sheetOnly = name.startsWith('float-') || name.startsWith('frag-'); // se usan como hoja de sprites
  await Promise.all(
    (sheetOnly ? [] : files).map((f, i) =>
      sharp(path.join(dir, f))
        .webp({ quality: 76, alphaQuality: 90, effort: 6 })
        .toFile(path.join(out, `f_${String(i + 1).padStart(4, '0')}.webp`)),
    ),
  );
  if (sheetOnly) {
    const COLS = 8, ROWS = 6, CELL = 256;
    const tiles = await Promise.all(
      files.slice(0, COLS * ROWS).map(async (f, i) => ({
        input: await sharp(path.join(dir, f)).resize(CELL, CELL).png().toBuffer(),
        left: (i % COLS) * CELL,
        top: Math.floor(i / COLS) * CELL,
      })),
    );
    await sharp({ create: { width: COLS * CELL, height: ROWS * CELL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(tiles)
      .webp({ quality: 74, alphaQuality: 85, effort: 6 })
      .toFile(path.join(out, 'sheet.webp'));
  }
  let total = 0;
  for (const f of await readdir(out)) total += (await stat(path.join(out, f))).size;
  await writeFile(path.join(out, 'meta.json'), JSON.stringify({ ...meta, frames: files.length }));
  console.log(`${name}: ${files.length} frames → ${out} (${(total / 1024).toFixed(0)} KB)`);
}
