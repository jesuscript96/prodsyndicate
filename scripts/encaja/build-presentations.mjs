#!/usr/bin/env node
/**
 * One pager A4 de la campaña «Encaja», uno por landing, en PDF.
 *   npm run encaja:presentaciones                 → public/encaja/presentacion-<slug>.pdf
 *   npm run encaja:presentaciones -- --preview DIR → además, un PNG de cada página
 *
 * El texto sale de content/encaja.ts (el mismo que las landings). Sin cifras inventadas: los
 * números grandes son plazos y precio reales; el ahorro de tiempo se calcula en la llamada.
 * Composición: titular y visual · «Hoy» frente a «Con AUTOMATO» · línea de tiempo · qué esperar
 * de la llamada y caso real · cierre.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const {
  encajaLandings,
  encajaMeeting,
  encajaCase,
  encajaCaseShort,
  encajaClosing,
  encajaTimeline,
  encajaTimeNote,
  encajaSteps,
  encajaOutcomesLabel,
  encajaPresentationPath,
} = await import(path.join(ROOT, 'content/encaja.ts'));
const { BRAND_MARK } = await import(path.join(ROOT, 'components/layout/brand-mark.data.ts'));

const previewIdx = process.argv.indexOf('--preview');
const previewDir = previewIdx > -1 ? path.resolve(process.argv[previewIdx + 1]) : null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const title = (t) => `${esc(t.before)}<em>${esc(t.accent)}</em>${esc(t.after)}`;
const dataUri = (file) => `data:image/webp;base64,${readFileSync(path.join(ROOT, 'public', file)).toString('base64')}`;

const mark = (size, inverse = false) =>
  `<svg width="${size}" height="${size}" viewBox="${BRAND_MARK.viewBox}" aria-hidden="true">` +
  BRAND_MARK.cavities
    .map((d) => `<path d="${d}" fill="${inverse ? '#fff' : '#2b3bff'}" stroke="${inverse ? '#fff' : '#2b3bff'}" stroke-width="${BRAND_MARK.round}" stroke-linejoin="round"/>`)
    .join('') +
  `<path d="${BRAND_MARK.outline}" fill="none" stroke="${inverse ? '#fff' : '#0b0b0f'}" stroke-width="${BRAND_MARK.strokeSkin}" stroke-linejoin="round"/></svg>`;

const ICON = {
  check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M9 4.5 12.5 8 9 11.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.6V8l2.4 1.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

const CSS = `
@page { size: A4; margin: 0; }
:root {
  --paper: #ffffff; --paper-2: #f6f6f3; --ink: #0b0b0f; --ink-2: #3a3a42; --ink-3: #6b6b76;
  --line: #e8e8e3; --accent: #2b3bff; --accent-soft: #eef0ff; --signal: #ff5a1f;
  --sans: "Geist", ui-sans-serif, system-ui, sans-serif; --serif: "Instrument Serif", Georgia, serif;
  --mono: "Geist Mono", ui-monospace, Menlo, monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; color: var(--ink); font-family: var(--sans); -webkit-font-smoothing: antialiased; }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; display: grid; grid-template-rows: auto auto auto auto auto 1fr; }
.pad { padding-inline: 46px; }
em { font-family: var(--serif); font-style: italic; font-weight: 400; letter-spacing: 0; color: var(--accent); }
p { margin: 0; }
h1, h2, h3 { margin: 0; font-weight: 500; text-wrap: balance; }
.label { font: 500 9.5px/1.2 var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }

/* Cabecera */
.top { display: flex; justify-content: space-between; align-items: center; padding-top: 30px; }
.brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12.5px; letter-spacing: .08em; }

/* Hero */
.hero { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, .8fr); gap: 26px; align-items: center; padding-top: 22px; }
.hero .stack { display: grid; gap: 14px; }
.hero h1 { font-size: 35px; line-height: 1.04; letter-spacing: -0.035em; }
.hero .lead { font-size: 13.5px; line-height: 1.5; color: var(--ink-2); max-width: 38ch; }
.pills { display: flex; flex-wrap: wrap; gap: 6px; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); font: 500 10.5px/1 var(--sans); }
.pill svg { width: 12px; height: 12px; }
.visual { border-radius: 18px; overflow: hidden; height: 236px; display: grid; place-items: center; background: var(--paper-2); }
.visual img { display: block; width: 100%; height: 236px; object-fit: contain; padding: 14px; }
.flow { display: grid; gap: 13px; width: 100%; padding: 18px; }
.flow div { position: relative; display: flex; align-items: center; gap: 8px; width: 80%; padding: 8px 11px; border-radius: 9px; background: #fff; font-size: 11px; box-shadow: 0 6px 16px -8px rgba(11,11,15,.18); }
.flow div:nth-child(even) { margin-left: auto; }
.flow div + div::before { content: ""; position: absolute; bottom: 100%; left: 50%; height: 13px; border-left: 1.5px dashed rgba(43,59,255,.5); }
.flow span { font: 500 8.5px var(--mono); color: var(--ink-3); }
.flow .ia { justify-content: center; background: var(--accent-soft); border: 1.5px dashed var(--accent); box-shadow: none; color: var(--accent); font: italic 14px var(--serif); }

/* Hoy frente a Con AUTOMATO */
.change { padding-top: 26px; display: grid; gap: 12px; }
.change h2, .timeline h2 { font-size: 21px; letter-spacing: -0.025em; line-height: 1.1; }
.table { display: grid; grid-template-columns: minmax(0, 1fr) 30px minmax(0, 1fr); border-radius: 16px; overflow: hidden; }
.col-h { padding: 10px 16px; font: 500 9.5px/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; }
.col-h.before { background: var(--paper-2); color: var(--ink-3); }
.col-h.after { background: var(--accent); color: #fff; }
.gap { background: linear-gradient(90deg, var(--paper-2) 50%, var(--accent-soft) 50%); }
.gap.h { background: linear-gradient(90deg, var(--paper-2) 50%, var(--accent) 50%); }
.cell { padding: 11px 16px; font-size: 12px; line-height: 1.35; display: flex; gap: 9px; align-items: center; min-height: 46px; }
.cell.before { background: var(--paper-2); color: var(--ink-2); }
.cell.after { background: var(--accent-soft); color: var(--ink); font-weight: 500; }
.cell.before::before { content: ""; flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--signal); }
.cell.after svg { flex: none; width: 14px; height: 14px; color: var(--accent); }
.arrow { display: grid; place-items: center; }
.arrow span { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: #fff; color: var(--accent); box-shadow: 0 2px 8px rgba(11,11,15,.12); }
.arrow svg { width: 12px; height: 12px; }
.row-line { grid-column: 1 / -1; height: 1px; background: rgba(11,11,15,.05); }
.note { display: flex; gap: 8px; align-items: center; font-size: 11px; color: var(--ink-2); }
.note svg { width: 14px; height: 14px; color: var(--accent); flex: none; }

/* Línea de tiempo */
.timeline { padding-top: 26px; display: grid; gap: 16px; }
.track { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; padding-top: 18px; }
.track::before { content: ""; position: absolute; top: 5px; left: 6px; right: 6px; height: 3px; border-radius: 3px; background: linear-gradient(90deg, var(--accent-soft), var(--accent)); }
.step { position: relative; display: grid; gap: 4px; }
.step::before { content: ""; position: absolute; top: -18px; left: 0; width: 13px; height: 13px; border-radius: 50%; background: #fff; border: 3px solid var(--accent); }
.step:last-child::before { background: var(--accent); }
.big { font-family: var(--serif); font-style: italic; font-size: 30px; line-height: 1; color: var(--accent); }
.step h3 { font-size: 12.5px; letter-spacing: -0.01em; }
.step p { font-size: 10.5px; line-height: 1.35; color: var(--ink-3); }

/* Llamada y caso */
.duo { padding-top: 24px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
.card { border-radius: 16px; padding: 16px 18px; display: grid; gap: 10px; align-content: start; }
.card--line { border: 1px solid var(--line); }
.card--soft { background: var(--paper-2); }
.card h3 { font-size: 14px; letter-spacing: -0.01em; }
.checks { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }
.checks li { display: flex; gap: 8px; align-items: flex-start; font-size: 11.2px; line-height: 1.35; color: var(--ink-2); }
.checks svg { flex: none; width: 13px; height: 13px; margin-top: 1px; color: var(--accent); }
.mini { display: grid; gap: 7px; }
.mini div { display: grid; grid-template-columns: 56px 1fr; gap: 8px; align-items: baseline; font-size: 11.2px; line-height: 1.35; color: var(--ink-2); }
.mini b { font: 500 9px/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
.mini div:last-child b { color: var(--accent); }
.mini div:last-child span { color: var(--ink); font-weight: 500; }

/* Cierre */
.cta { margin-top: 24px; align-self: end; background: var(--accent); color: #fff; padding: 22px 46px 24px; display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, .7fr); gap: 20px; align-items: end; }
.cta h2 { font-size: 23px; line-height: 1.1; letter-spacing: -0.025em; }
.cta h2 em { color: #fff; }
.cta .contact { display: grid; gap: 5px; justify-items: end; font-size: 11px; text-align: right; }
.cta .contact strong { font-size: 13px; font-weight: 500; }
.cta .brand { color: rgba(255,255,255,.85); margin-bottom: 10px; }
`;

function onePager(landing) {
  const op = landing.onePager;
  const v = landing.hero.visual;
  const visual =
    v.type === 'image'
      ? `<img src="${dataUri(v.src)}" alt="">`
      : `<div class="flow"><div><span>01</span>Entra un pedido</div><div><span>02</span>Se revisan los datos</div><div class="ia">¿Aquí aporta IA?</div><div><span>03</span>Se factura</div><div><span>04</span>Se avisa al cliente</div></div>`;

  const rows = op.pairs
    .map(
      (p, i) =>
        `${i ? '<div class="row-line"></div>' : ''}<div class="cell before">${esc(p.before)}</div><div class="gap arrow"><span>${ICON.arrow}</span></div><div class="cell after">${ICON.check}${esc(p.after)}</div>`,
    )
    .join('');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>AUTOMATO · ${esc(landing.meta.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&family=Instrument+Serif:ital@0;1&display=block" rel="stylesheet">
<style>${CSS}</style></head><body><div class="page">

<header class="top pad"><span class="brand">${mark(20)}AUTOMATO</span><span class="label">Antes de nuestra llamada</span></header>

<section class="hero pad">
  <div class="stack">
    <p class="label" style="color:var(--accent)">${esc(op.audience)}</p>
    <h1>${title(op.headline)}</h1>
    <p class="lead">${esc(op.lead)}</p>
    <div class="pills"><span class="pill">${ICON.clock}Llamada de 30 min, gratis</span><span class="pill">Primer resultado en 2–4 semanas</span></div>
  </div>
  <div class="visual">${visual}</div>
</section>

<section class="change pad">
  <div style="display:grid;gap:6px"><p class="label">${esc(encajaOutcomesLabel)}</p><h2>${title(landing.outcomes.title)}</h2></div>
  <div class="table">
    <div class="col-h before">Hoy</div><div class="gap h"></div><div class="col-h after">Con AUTOMATO</div>
    ${rows}
  </div>
  <p class="note">${ICON.clock}${esc(encajaTimeNote)}</p>
</section>

<section class="timeline pad">
  <div style="display:grid;gap:6px"><p class="label">${esc(encajaSteps.label)}</p><h2>${title(encajaSteps.title)}</h2></div>
  <div class="track">${encajaTimeline
    .map((s) => `<div class="step"><span class="big">${esc(s.big)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`)
    .join('')}</div>
</section>

<section class="duo pad">
  <div class="card card--line"><h3>${esc(encajaMeeting.title)}</h3><ul class="checks">${encajaMeeting.items
    .slice(1)
    .map((i) => `<li>${ICON.check}<span>${esc(i)}</span></li>`)
    .join('')}</ul></div>
  <div class="card card--soft"><p class="label">${esc(encajaCase.label)}</p><h3>${title(encajaCase.title)}</h3>
    <div class="mini"><div><b>Antes</b><span>${esc(encajaCaseShort.before)}</span></div><div><b>Después</b><span>${esc(encajaCaseShort.after)}</span></div></div></div>
</section>

<footer class="cta">
  <div><span class="brand">${mark(18, true)}AUTOMATO</span><h2>${title(encajaClosing.title)}</h2></div>
  <div class="contact"><strong>Nos vemos en la llamada.</strong><span>hola@automatoagency.art</span><span>automatoagency.art</span></div>
</footer>

</div></body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
for (const landing of encajaLandings) {
  await page.setContent(onePager(landing), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => {
    const p = document.querySelector('.page');
    return p.scrollHeight - p.clientHeight;
  });
  if (overflow > 0) console.warn(`[one pager] ${landing.slug}: el contenido se sale ${overflow}px de la página`);
  const out = path.join(ROOT, 'public', encajaPresentationPath(landing.slug));
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(`[one pager] ${path.relative(ROOT, out)}`);
  if (previewDir) {
    mkdirSync(previewDir, { recursive: true });
    await page.locator('.page').screenshot({ path: path.join(previewDir, `${landing.slug}.png`) });
  }
}
await browser.close();
