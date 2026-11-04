#!/usr/bin/env node
/**
 * Presentaciones de la campaña «Encaja», una por landing, en PDF 16:9.
 *   npm run encaja:presentaciones                 → public/encaja/presentacion-<slug>.pdf
 *   npm run encaja:presentaciones -- --preview DIR → además, una hoja de contactos PNG por PDF
 *
 * El texto sale de content/encaja.ts (el mismo que las landings), así que no se desincroniza.
 * Orden pedido por el negocio: primero qué esperar de la llamada, después el problema, cómo
 * ayudamos, el caso, cómo trabajamos y quién está detrás.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const content = await import(path.join(ROOT, 'content/encaja.ts'));
const { BRAND_MARK } = await import(path.join(ROOT, 'components/layout/brand-mark.data.ts'));
const {
  encajaLandings,
  encajaDecks,
  encajaDeckCommon: common,
  encajaMeeting,
  encajaCase,
  encajaSteps,
  encajaWho,
  encajaClosing,
  encajaPrice,
  encajaPresentationPath,
} = content;

const previewIdx = process.argv.indexOf('--preview');
const previewDir = previewIdx > -1 ? path.resolve(process.argv[previewIdx + 1]) : null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const keep = (s) => esc(s).replace(/post-its/g, '<span class="nw">post-its</span>');
const title = (t) => `${keep(t.before)}<em>${keep(t.accent)}</em>${keep(t.after)}`;
const dataUri = (file, type) => `data:${type};base64,${readFileSync(path.join(ROOT, file)).toString('base64')}`;

const mark = (size, inverse = false) =>
  `<svg width="${size}" height="${size}" viewBox="${BRAND_MARK.viewBox}" aria-hidden="true">` +
  BRAND_MARK.cavities
    .map((d) => `<path d="${d}" fill="${inverse ? '#fff' : '#2b3bff'}" stroke="${inverse ? '#fff' : '#2b3bff'}" stroke-width="${BRAND_MARK.round}" stroke-linejoin="round"/>`)
    .join('') +
  `<path d="${BRAND_MARK.outline}" fill="none" stroke="${inverse ? '#fff' : '#0b0b0f'}" stroke-width="${BRAND_MARK.strokeSkin}" stroke-linejoin="round"/></svg>`;

const CSS = `
@page { size: 1920px 1080px; margin: 0; }
:root {
  --paper: #ffffff; --paper-2: #f6f6f3; --ink: #0b0b0f; --ink-2: #3a3a42; --ink-3: #6b6b76;
  --line: #e8e8e3; --accent: #2b3bff; --accent-soft: #eef0ff; --signal: #ff5a1f;
  --sans: "Geist", ui-sans-serif, system-ui, sans-serif; --serif: "Instrument Serif", Georgia, serif;
  --mono: "Geist Mono", ui-monospace, Menlo, monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--sans); -webkit-font-smoothing: antialiased; }
.slide { position: relative; width: 1920px; height: 1080px; padding: 140px 128px 120px; overflow: hidden; break-after: page; display: grid; align-content: center; gap: 56px; }
.nw { white-space: nowrap; }
h2.h2-long { font-size: 64px; max-width: 30ch; }
.slide:last-child { break-after: auto; }
.slide--soft { background: var(--paper-2); }
.slide--accent { background: var(--accent); color: #fff; }
.chrome { position: absolute; left: 128px; right: 128px; top: 56px; display: flex; justify-content: space-between; align-items: center; font: 500 20px/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
.brand { display: inline-flex; align-items: center; gap: 14px; font: 600 22px/1 var(--sans); letter-spacing: .08em; color: var(--ink); text-transform: none; }
.foot { position: absolute; left: 128px; right: 128px; bottom: 52px; display: flex; justify-content: space-between; font: 500 18px/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
.slide--accent .chrome, .slide--accent .foot, .slide--accent .brand { color: rgba(255,255,255,.75); }
.label { margin: 0; font: 500 22px/1.3 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
h1, h2 { margin: 0; font-weight: 500; letter-spacing: -0.035em; text-wrap: balance; }
h1 { font-size: 112px; line-height: 1; max-width: 15ch; }
h2 { font-size: 84px; line-height: 1.02; max-width: 20ch; }
h1 em, h2 em, h3 em { font-family: var(--serif); font-style: italic; font-weight: 400; letter-spacing: -0.01em; color: var(--accent); }
.slide--accent h2 em { color: #fff; }
h3 { margin: 0; font-size: 36px; line-height: 1.15; font-weight: 500; letter-spacing: -0.02em; }
p { margin: 0; }
.lead { font-size: 36px; line-height: 1.4; color: var(--ink-2); max-width: 30ch; letter-spacing: -0.01em; }
.text { font-size: 28px; line-height: 1.45; color: var(--ink-2); }
.cols { display: grid; gap: 40px; }
.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.card { background: var(--paper); border-radius: 28px; padding: 44px; display: grid; gap: 18px; align-content: start; box-shadow: 0 1px 0 rgba(11,11,15,.04), 0 12px 32px -12px rgba(11,11,15,.12); }
.slide--soft .card { box-shadow: none; }
.cols-2 .card { padding: 52px; gap: 24px; }
.cols-2 .card h3 { font-size: 46px; }
.cols-2 .card .text { font-size: 32px; }
.card--soft { background: var(--paper-2); box-shadow: none; }
.n { font-family: var(--serif); font-style: italic; font-size: 44px; line-height: 1; color: var(--accent); }
.cover { grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); align-items: center; align-content: center; gap: 80px; padding-top: 120px; }
.cover .stack { display: grid; gap: 40px; }
.cover img { width: 100%; max-height: 760px; object-fit: contain; }
.flow { display: grid; gap: 34px; padding: 48px; border-radius: 32px; background: var(--paper-2); }
.flow div { position: relative; display: flex; align-items: center; gap: 18px; width: 78%; padding: 22px 28px; border-radius: 18px; background: #fff; font-size: 30px; box-shadow: 0 12px 32px -12px rgba(11,11,15,.14); }
.flow div:nth-child(even) { margin-left: auto; }
.flow div + div::before { content: ""; position: absolute; bottom: 100%; left: 50%; height: 34px; border-left: 2px dashed rgba(43,59,255,.5); }
.flow span { font: 500 20px var(--mono); color: var(--ink-3); }
.flow .ia { justify-content: center; background: var(--accent-soft); border: 2px dashed var(--accent); box-shadow: none; color: var(--accent); font: italic 36px var(--serif); }
.list { display: grid; gap: 26px; margin: 0; padding: 0; list-style: none; }
.list li { display: grid; grid-template-columns: 56px 1fr; gap: 20px; align-items: baseline; font-size: 34px; line-height: 1.35; letter-spacing: -0.01em; }
.list li::before { content: counter(i, decimal-leading-zero); counter-increment: i; font: 500 22px var(--mono); color: var(--accent); }
.list { counter-reset: i; }
.dots li::before { content: ""; width: 14px; height: 14px; border-radius: 50%; background: var(--signal); align-self: center; }
.split { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 96px; align-items: start; }
.quote { font-family: var(--serif); font-style: italic; font-size: 64px; line-height: 1.12; color: var(--accent); max-width: 22ch; }
.chips { display: flex; flex-wrap: wrap; gap: 14px; }
.chip { padding: 14px 24px; border: 1.5px solid var(--line); border-radius: 999px; font-size: 26px; background: #fff; }
.price { display: flex; align-items: baseline; gap: 32px; padding: 36px 44px; border-radius: 28px; background: var(--accent-soft); font-size: 40px; font-weight: 500; letter-spacing: -0.02em; }
.price .label { color: var(--accent); }
.closing { align-content: center; gap: 56px; }
.closing h2 { font-size: 104px; max-width: 16ch; }
.contact { display: grid; gap: 14px; font-size: 36px; }
.contact a { color: #fff; text-decoration: none; }
`;

function chrome(slide, total, label, inverse = false) {
  return `<div class="chrome"><span class="brand">${mark(34, inverse)}AUTOMATO</span><span>${esc(label)} · ${String(slide).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></div><div class="foot"><span>automatoagency.art</span><span>${esc(common.kicker)}</span></div>`;
}

function help(landing) {
  if (landing.angle === 'decision') {
    const qa = landing.blocks.find((b) => b.qa);
    return `<div class="cols cols-3">${qa.qa
      .map((x) => `<div class="card"><h3><em style="font-family:var(--serif);color:var(--accent)">${esc(x.q)}</em></h3><p class="text">${esc(x.a)}</p></div>`)
      .join('')}</div>`;
  }
  if (landing.angle === 'camino') {
    const steps = landing.blocks.find((b) => b.steps);
    const tools = landing.blocks.find((b) => b.chips);
    const custom = landing.blocks.find((b) => b.id === 'a-medida');
    return `<div class="split"><ol class="list">${steps.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <div style="display:grid;gap:36px"><h3>${title(tools.title)}</h3><div class="chips">${tools.chips
        .map((c) => `<span class="chip">${esc(c)}</span>`)
        .join('')}</div><p class="text">${esc(custom.text)}</p></div></div>`;
  }
  return `<div class="cols cols-2">${landing.blocks
    .map((b) => `<div class="card"><h3>${title(b.title)}</h3><p class="text">${esc(b.text)}</p></div>`)
    .join('')}</div>`;
}

function deckHtml(landing) {
  const deck = encajaDecks[landing.slug];
  const v = landing.hero.visual;
  const visual =
    v.type === 'image'
      ? `<img src="${dataUri(path.join('public', v.src), 'image/webp')}" alt="">`
      : `<div class="flow"><div><span>01</span>Entra un pedido</div><div><span>02</span>Se revisan los datos</div><div class="ia">¿Aquí aporta IA?</div><div><span>03</span>Se factura</div><div><span>04</span>Se avisa al cliente</div></div>`;
  const priceBlock = landing.blocks.find((b) => b.id === 'inversion');
  const slides = [
    // 1 · Portada
    (n, t) => `<section class="slide cover">${chrome(n, t, 'Presentación')}
      <div class="stack"><p class="label">${esc(common.kicker)}</p><h1>${title(landing.hero.title)}</h1><p class="lead">${esc(deck.lead)}</p></div>
      <div>${visual}</div></section>`,
    // 2 · Qué esperar de la llamada (primero, como pidió el negocio)
    (n, t) => `<section class="slide">${chrome(n, t, 'La llamada')}
      <div class="split"><div style="display:grid;gap:36px"><h2>${title({ before: 'Qué esperar de la ', accent: 'llamada', after: '' })}</h2><p class="lead">${esc(common.meetingNote)}</p></div>
      <ol class="list">${encajaMeeting.items.slice(1).map((i) => `<li>${esc(i)}</li>`).join('')}</ol></div></section>`,
    // 3 · Cómo prepararla
    (n, t) => `<section class="slide slide--soft">${chrome(n, t, 'La llamada')}
      <h2>${title(common.prepare.title)}</h2>
      <div class="cols cols-3">${common.prepare.items.map((p, i) => `<div class="card"><span class="n">0${i + 1}</span><p class="text" style="color:var(--ink);font-size:32px">${esc(p)}</p></div>`).join('')}</div></section>`,
    // 4 · El problema
    (n, t) => `<section class="slide">${chrome(n, t, landing.pains.label)}
      <h2>${title(landing.pains.title)}</h2>
      <div class="split"><div style="display:grid;gap:24px"><p class="quote">${esc(deck.quote)}</p>${deck.quoteNote ? `<p class="text">${esc(deck.quoteNote)}</p>` : ''}</div>
      <ul class="list dots">${landing.pains.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div></section>`,
    // 5 · Cómo te ayudamos
    (n, t) => `<section class="slide slide--soft">${chrome(n, t, 'Cómo te ayudamos')}
      <h2>${title(common.helpTitle)}</h2>${help(landing)}</section>`,
    // 6 · Caso real
    (n, t) => `<section class="slide">${chrome(n, t, encajaCase.label)}
      <div style="display:grid;gap:20px"><p class="label">${esc(encajaCase.label)}</p><h2>${title(encajaCase.title)}</h2></div>
      <div class="cols cols-3">${encajaCase.parts.map((p, i) => `<div class="card card--soft"><span class="n">0${i + 1}</span><h3>${esc(p.title)}</h3><p class="text">${esc(p.text)}</p></div>`).join('')}</div></section>`,
    // 7 · Cómo trabajamos e inversión
    (n, t) => `<section class="slide slide--soft">${chrome(n, t, encajaSteps.label)}
      <h2${priceBlock ? ' class="h2-long"' : ''}>${title(priceBlock ? priceBlock.title : encajaSteps.title)}</h2>
      <div class="cols cols-4">${encajaSteps.items.map((s) => `<div class="card"><span class="n">${s.n}</span><h3>${esc(s.title)}</h3><p class="text" style="font-size:24px">${esc(s.text)}</p></div>`).join('')}</div>
      <div class="price"><span class="label">Inversión</span><span>${esc(encajaPrice)}</span></div></section>`,
    // 8 · Quién está detrás
    (n, t) => `<section class="slide">${chrome(n, t, encajaWho.label)}
      <div class="split" style="align-content:center;height:100%"><div style="display:grid;gap:20px"><p class="label">${esc(encajaWho.label)}</p><h2>${title(encajaWho.title)}</h2></div>
      <div style="display:grid;gap:32px">${encajaWho.paragraphs.map((p, i) => `<p class="${i ? 'text' : 'lead'}" style="max-width:none">${esc(p)}</p>`).join('')}</div></div></section>`,
    // 9 · Cierre
    (n, t) => `<section class="slide slide--accent closing">${chrome(n, t, 'Hasta pronto', true)}
      <h2>${title(encajaClosing.title)}</h2>
      <div class="contact"><p>${esc(common.goodbye)}</p><a href="mailto:hola@automatoagency.art">hola@automatoagency.art</a><a href="https://www.automatoagency.art">automatoagency.art</a></div></section>`,
  ];
  const body = slides.map((s, i) => s(i + 1, slides.length)).join('\n');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>AUTOMATO · ${esc(landing.meta.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&family=Instrument+Serif:ital@0;1&display=block" rel="stylesheet">
<style>${CSS}</style></head><body>${body}</body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
for (const landing of encajaLandings) {
  await page.setContent(deckHtml(landing), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(ROOT, 'public', encajaPresentationPath(landing.slug));
  await page.pdf({ path: out, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
  console.log(`[presentaciones] ${path.relative(ROOT, out)}`);
  if (previewDir) {
    mkdirSync(previewDir, { recursive: true });
    const slides = await page.$$('.slide');
    for (let i = 0; i < slides.length; i++) {
      await slides[i].screenshot({ path: path.join(previewDir, `${landing.slug}-${String(i + 1).padStart(2, '0')}.png`) });
    }
  }
}
await browser.close();
