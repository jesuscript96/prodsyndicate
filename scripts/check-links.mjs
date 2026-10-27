#!/usr/bin/env node
/**
 * Crawler de enlaces internos (§14.3, §14.4): parte de la home, sigue los
 * `href="/…"` del HTML (sin anclas ni assets) y lista los que no devuelven 200.
 * Sin dependencias: solo `fetch`.
 *
 *   node scripts/check-links.mjs                 → http://localhost:3200
 *   node scripts/check-links.mjs http://host:puerto
 *
 * Sale con código 1 si hay enlaces rotos.
 */

const base = new URL(process.argv[2] ?? 'http://localhost:3200');
const CONCURRENCY = 6;
const TIMEOUT_MS = 90_000; // `next dev` compila cada ruta la primera vez
const SKIP_PREFIXES = ['/_next/', '/api/'];
const ASSET_RE = /\.(png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|json|xml|txt|woff2?|ttf|otf|mp4|webm|pdf|zip)$/i;

/** ruta → páginas en las que aparece */
const seen = new Map([['/', new Set(['(inicio)'])]]);
const queue = ['/'];
const broken = [];
let visited = 0;

/** Normaliza un href interno a su ruta; `null` si no hay que seguirlo. */
function normalize(href) {
  const raw = href.trim();
  if (!raw || raw.startsWith('#')) return null; // anclas de la misma página
  let url;
  try {
    url = new URL(raw, base);
  } catch {
    return null;
  }
  if (url.origin !== base.origin) return null; // externos, mailto:, tel:…
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (ASSET_RE.test(pathname)) return null;
  return pathname; // sin #fragmento ni ?query
}

/** Todos los href="/…" (o misma origen) del HTML. */
function extractLinks(html) {
  const out = new Set();
  const re = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = (m[1] ?? m[2] ?? '').replace(/&amp;/g, '&');
    if (!href.startsWith('/') && !href.startsWith(base.origin)) continue;
    if (href.startsWith('//')) continue; // protocolo relativo = externo
    out.add(href);
  }
  return out;
}

async function fetchPage(pathname) {
  try {
    const res = await fetch(new URL(pathname, base), {
      headers: { accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const type = res.headers.get('content-type') ?? '';
    const html = type.includes('text/html') ? await res.text() : '';
    return { status: res.status, html };
  } catch (err) {
    return { status: 0, html: '', error: err instanceof Error ? err.message : String(err) };
  }
}

async function visit(pathname) {
  const { status, html, error } = await fetchPage(pathname);
  visited++;
  if (status !== 200) {
    broken.push({ path: pathname, status, error, from: [...seen.get(pathname)] });
    return;
  }
  for (const href of extractLinks(html)) {
    const next = normalize(href);
    if (!next) continue;
    const sources = seen.get(next);
    if (sources) {
      sources.add(pathname);
    } else {
      seen.set(next, new Set([pathname]));
      queue.push(next);
    }
  }
}

await new Promise((resolve) => {
  let active = 0;
  const pump = () => {
    if (!queue.length && active === 0) return resolve();
    while (active < CONCURRENCY && queue.length) {
      const next = queue.shift();
      active++;
      visit(next).finally(() => {
        active--;
        pump();
      });
    }
  };
  pump();
});

console.log(`Rastreadas ${visited} rutas internas desde ${base.origin}`);

if (!broken.length) {
  console.log('✓ Todos los enlaces internos devuelven 200.');
  process.exit(0);
}

broken.sort((a, b) => a.path.localeCompare(b.path));
console.log(`✗ ${broken.length} enlace(s) roto(s):`);
for (const b of broken) {
  const code = b.status ? String(b.status) : `ERR ${b.error ?? ''}`.trim();
  console.log(`  ${code.padEnd(4)} ${b.path}\n       ← ${b.from.join(', ')}`);
}
process.exit(1);
