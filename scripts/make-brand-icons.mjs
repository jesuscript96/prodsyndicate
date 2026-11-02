#!/usr/bin/env node
/**
 * Isotipo AUTOMATO: un tomate cortado por la mitad (corte ecuatorial), visto
 * desde la cara del corte. Piel = trazo tinta; cavidades (lóculos) = relleno
 * ultramar; pericarpio, septos y núcleo carnoso = papel; semillas = elipses
 * papel junto al núcleo. Toda la geometría sale de aquí y se escribe en:
 *
 *   components/layout/brand-mark.data.ts  → datos para <BrandMark /> y la imagen OG
 *   app/icon.svg                          → favicon (SVG, fondo blanco redondeado)
 *   app/apple-icon.png                    → 180×180 para iOS
 *   public/brand/automato-mark.svg        → isotipo suelto, fondo transparente
 *
 * Uso: `npm run brand:icons` (requiere `sharp`, ya en devDependencies).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INK = '#0b0b0f';
const ACCENT = '#2b3bff';
const PAPER = '#ffffff';

const C = 32; // centro del viewBox 0 0 64 64
const f = (n) => Number(n.toFixed(2));
const pol = (r, a) => [f(C + r * Math.cos(a)), f(C + r * Math.sin(a))];

export function buildMark({
  lobes = 4, // nº de lóculos (y de costillas suaves en la piel)
  rSkin = 27, // radio medio de la piel
  lobeAmp = 0.5, // amplitud de las costillas
  strokeSkin = 2.8, // grosor del trazo de la piel
  rWall = 21.5, // borde exterior de las cavidades (interior del pericarpio)
  rCore = 6.5, // radio del núcleo carnoso (columela)
  gap = 3.2, // grosor de los septos
  round = 7, // stroke de redondeo de las cavidades (radio de esquina = round / 2)
  seeds = 2, // semillas por lóculo
  seed = { rx: 2, ry: 1.25 },
} = {}) {
  // Piel: r(θ) = rSkin + lobeAmp·cos(lobes·θ), muestreada y suavizada (Catmull-Rom → Bézier).
  const N = 72;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
    const r = rSkin + lobeAmp * Math.cos(lobes * (a + Math.PI / 2 - Math.PI / lobes));
    pts.push([C + r * Math.cos(a), C + r * Math.sin(a)]);
  }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  const outline = `${d}Z`;

  // Cavidades: sector de anillo desplazado hacia dentro (gap/2 + round/2); el
  // stroke redondo del mismo color devuelve el borde a su sitio y redondea las esquinas.
  const half = Math.PI / lobes;
  const dOff = gap / 2 + round / 2;
  const rO = rWall - round / 2;
  const rI = rCore + round / 2;
  const cavities = [];
  const seedList = [];
  for (let k = 0; k < lobes; k++) {
    const phi = -Math.PI / 2 + k * ((2 * Math.PI) / lobes);
    const a1 = phi - half;
    const a2 = phi + half;
    const oO = Math.asin(dOff / rO);
    const oI = Math.asin(dOff / rI);
    const po1 = pol(rO, a1 + oO);
    const po2 = pol(rO, a2 - oO);
    const pi1 = pol(rI, a1 + oI);
    const pi2 = pol(rI, a2 - oI);
    cavities.push(
      `M${pi1[0]} ${pi1[1]}L${po1[0]} ${po1[1]}A${f(rO)} ${f(rO)} 0 0 1 ${po2[0]} ${po2[1]}L${pi2[0]} ${pi2[1]}A${f(rI)} ${f(rI)} 0 0 0 ${pi1[0]} ${pi1[1]}Z`,
    );
    // Semillas: en abanico junto al núcleo (donde se insertan en la placenta).
    const rs = rCore + 5.4;
    const span = half - oI;
    for (let j = 0; j < seeds; j++) {
      const t = seeds === 1 ? 0 : (j / (seeds - 1) - 0.5) * 0.9;
      const a = phi + t * span;
      const [cx, cy] = pol(rs, a);
      seedList.push({ cx, cy, rx: seed.rx, ry: seed.ry, rot: f((a * 180) / Math.PI + 90) });
    }
  }
  return { outline, cavities, seeds: seedList, round, strokeSkin };
}

/** SVG completo. `pad` añade margen (en unidades del viewBox) y `bg` un fondo redondeado. */
export function markSvg(m, { size = 64, bg = null, pad = 0, detailed = true, bgRadius = null } = {}) {
  const vb = 64 + pad * 2;
  const rect = bg ? `<rect width="${vb}" height="${vb}" rx="${bgRadius ?? vb / 4}" fill="${bg}"/>` : '';
  const open = pad ? `<g transform="translate(${pad} ${pad})">` : '<g>';
  const cavities = m.cavities
    .map((d) => `<path d="${d}" fill="${ACCENT}" stroke="${ACCENT}" stroke-width="${m.round}" stroke-linejoin="round"/>`)
    .join('');
  const seeds = detailed
    ? m.seeds
        .map(
          (s) =>
            `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" transform="rotate(${s.rot} ${s.cx} ${s.cy})" fill="${PAPER}"/>`,
        )
        .join('')
    : '';
  const skin = `<path d="${m.outline}" fill="none" stroke="${INK}" stroke-width="${m.strokeSkin}" stroke-linejoin="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${vb} ${vb}">${rect}${open}${cavities}${seeds}${skin}</g></svg>\n`;
}

async function main() {
  const m = buildMark();

  const data = `/**
 * GENERADO por \`scripts/make-brand-icons.mjs\` (\`npm run brand:icons\`). No editar a mano.
 * Geometría del isotipo AUTOMATO (tomate cortado por la mitad) en un viewBox 0 0 64 64.
 */
export const BRAND_MARK = {
  viewBox: '0 0 64 64',
  /** Piel: trazo \`currentColor\`. */
  outline: '${m.outline}',
  /** Grosor del trazo de la piel. */
  strokeSkin: ${m.strokeSkin},
  /** Cavidades (lóculos): relleno + trazo del mismo color con \`stroke-linejoin: round\`. */
  cavities: [
${m.cavities.map((d) => `    '${d}',`).join('\n')}
  ],
  /** Grosor del trazo que redondea las cavidades. */
  round: ${m.round},
  /** Semillas: elipses en color papel, giradas tangencialmente. */
  seeds: [
${m.seeds.map((s) => `    { cx: ${s.cx}, cy: ${s.cy}, rx: ${s.rx}, ry: ${s.ry}, rot: ${s.rot} },`).join('\n')}
  ],
} as const;
`;
  writeFileSync(path.join(ROOT, 'components/layout/brand-mark.data.ts'), data);

  // Favicon SVG: fondo blanco redondeado (se ve en pestañas oscuras), isotipo a sangre.
  writeFileSync(path.join(ROOT, 'app/icon.svg'), markSvg(m, { size: 64, bg: PAPER, bgRadius: 16 }));

  // Isotipo suelto (transparente), para reutilizar fuera de la web.
  mkdirSync(path.join(ROOT, 'public/brand'), { recursive: true });
  writeFileSync(path.join(ROOT, 'public/brand/automato-mark.svg'), markSvg(m, { size: 256 }));

  // apple-touch-icon: 180×180, fondo blanco opaco (iOS redondea las esquinas), margen del 8 %.
  const apple = markSvg(m, { size: 180, bg: PAPER, bgRadius: 0, pad: 6 });
  await sharp(Buffer.from(apple), { density: 384 }).resize(180, 180).png().toFile(path.join(ROOT, 'app/apple-icon.png'));

  console.log('Isotipo regenerado: brand-mark.data.ts · app/icon.svg · app/apple-icon.png · public/brand/automato-mark.svg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
