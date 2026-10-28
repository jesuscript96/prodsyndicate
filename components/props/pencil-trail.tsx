'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { PropCanvas, type PropHandle } from './prop-canvas';
import './props.css';

/**
 * Trazo del lápiz: tras el hero, el lápiz sigue bajando por la página y dibuja una línea de
 * grafito sobre la maquetación real. Dos tramos:
 *  · intro: en «Para quién» se bifurca hacia las dos tarjetas, cruza el manifiesto y se queda
 *    parado a la izquierda justo antes de «01 — Servicios».
 *  · proceso: baja por la línea de tiempo dejando una cuenta en cada paso, recorre «Tecnología»
 *    y se para de nuevo a la izquierda.
 */

export type TrailRoute = 'intro' | 'process';

type Pt = [number, number];
type Bead = { x: number; y: number; path: 'main' | 'branch'; at: number };

const PENCIL_FRAMES = 24;
const TIP_AT = 0.6; // la punta va al 60 % de la altura de la ventana

/**
 * Catmull-Rom centrípeto → polilínea densa (un punto cada ~12 px). La variante centrípeta no
 * hace rizos ni se pasa de largo cuando un tramo muy largo va seguido de uno corto.
 */
function smoothPath(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  const knot = (a: Pt, b: Pt) => Math.max(1e-3, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
  const mirror = (a: Pt, b: Pt): Pt => [2 * a[0] - b[0], 2 * a[1] - b[1]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i]!, p2 = pts[i + 1]!;
    const p0 = i > 0 ? pts[i - 1]! : mirror(p1, p2);
    const p3 = i < pts.length - 2 ? pts[i + 2]! : mirror(p2, p1);
    const t1 = knot(p0, p1), t2 = t1 + knot(p1, p2), t3 = t2 + knot(p2, p3);
    const steps = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 12));
    const lerp = (a: Pt, b: Pt, ta: number, tb: number, t: number): Pt => {
      const k = (t - ta) / (tb - ta);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    };
    for (let s = 0; s < steps; s++) {
      const t = t1 + ((t2 - t1) * s) / steps;
      const a1 = lerp(p0, p1, 0, t1, t), a2 = lerp(p1, p2, t1, t2, t), a3 = lerp(p2, p3, t2, t3, t);
      const b1 = lerp(a1, a2, 0, t2, t), b2 = lerp(a2, a3, t1, t3, t);
      out.push(lerp(b1, b2, t1, t2, t));
    }
  }
  out.push(pts[pts.length - 1]!);
  return out;
}

/** Temblor de trazo a mano: desplazamiento perpendicular pequeño y determinista. */
function handDrawn(pts: Pt[], amp = 1.1): Pt[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)]!, b = pts[Math.min(pts.length - 1, i + 1)]!;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const n = amp * (Math.sin(i * 0.61) * 0.7 + Math.sin(i * 1.73 + 1.3) * 0.3);
    return [p[0] - (dy / len) * n, p[1] + (dx / len) * n];
  });
}

type Lut = { pts: Pt[]; len: number[]; maxY: number[]; total: number };

function lut(pts: Pt[]): Lut {
  const len = [0], maxY = [pts[0]![1]];
  for (let i = 1; i < pts.length; i++) {
    len.push(len[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
    maxY.push(Math.max(maxY[i - 1]!, pts[i]![1]));
  }
  return { pts, len, maxY, total: len[len.length - 1]! };
}

/** Longitud dibujada para que la punta llegue a la altura y (primer punto que la alcanza). */
function lengthAtY(l: Lut, y: number): number {
  if (y <= l.maxY[0]!) return 0;
  let lo = 0, hi = l.maxY.length - 1;
  if (y >= l.maxY[hi]!) return l.total;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (l.maxY[mid]! >= y) hi = mid;
    else lo = mid + 1;
  }
  return l.len[lo]!;
}

function pointAt(l: Lut, L: number): Pt {
  if (L <= 0) return l.pts[0]!;
  if (L >= l.total) return l.pts[l.pts.length - 1]!;
  let lo = 0, hi = l.len.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (l.len[mid]! >= L) hi = mid;
    else lo = mid + 1;
  }
  const i = Math.max(1, lo), a = l.pts[i - 1]!, b = l.pts[i]!;
  const k = (L - l.len[i - 1]!) / (l.len[i]! - l.len[i - 1]! || 1);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

function nearestLength(l: Lut, x: number, y: number): number {
  let best = 0, bd = Infinity;
  for (let i = 0; i < l.pts.length; i++) {
    const d = (l.pts[i]![0] - x) ** 2 + (l.pts[i]![1] - y) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return l.len[best]!;
}

const toD = (pts: Pt[]) => (pts.length ? `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}` : '');

type Geometry = { W: number; H: number; main: Pt[]; branch: Pt[]; beads: Omit<Bead, 'at'>[]; fork: Pt | null };

/** Medidas comunes: tamaño del contenedor, carriles del trazo y posiciones relativas a él. */
function measure(root: HTMLElement) {
  const R = root.getBoundingClientRect();
  const rel = (el: Element | null) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left - R.left, right: r.right - R.left, top: r.top - R.top, bottom: r.bottom - R.top, width: r.width, height: r.height };
  };
  const wrap = root.querySelector('.wrap');
  const wr = rel(wrap);
  const padL = wrap ? parseFloat(getComputedStyle(wrap).paddingLeft) : 24;
  const contentLeft = (wr?.left ?? 0) + padL;
  return { W: R.width, H: R.height, rel, contentLeft };
}

/** Para quién + Manifiesto: termina parado en el carril izquierdo, al final del contenedor. */
function introLayout(root: HTMLElement, wide: boolean): Geometry {
  const { W, H, rel, contentLeft } = measure(root);
  const xL = Math.max(wide ? 14 : 9, contentLeft / 2);
  const xR = W - xL;
  const aud = rel(root.querySelector('#inicio-contenido .audience-grid'));
  const cards = [...root.querySelectorAll('#inicio-contenido .audience-card')].map(rel);
  const man = rel(root.querySelector('#manifiesto .manifesto__text'));
  const end = H - 28;

  const main: Pt[] = [[W * 0.5, 0], [W * 0.36, 36], [xL + 6, 120]];
  const branch: Pt[] = [];
  const beads: Omit<Bead, 'at'>[] = [];
  let fork: Pt | null = null;

  if (aud) {
    fork = [xL, aud.top + 28];
    main.push([xL, aud.top - 40], fork, [xL, aud.bottom - 24]);
    beads.push({ x: xL, y: aud.bottom - 24, path: 'main' });
    const c1 = cards[0], c2 = cards[1];
    if (wide && c1 && c2 && c2.left > c1.right) {
      const gx = (c1.right + c2.left) / 2;
      branch.push(fork, [xL + 40, aud.top + 34], [(xL + gx) / 2, aud.top + 40], [gx, aud.top + 60], [gx, aud.bottom - 34]);
      beads.push({ x: gx, y: aud.bottom - 34, path: 'branch' });
    }
  }
  if (man && aud) {
    // Puntos intermedios antes de cada giro: evitan que la curva se pase del margen
    const y1 = (aud.bottom + man.top) / 2;
    main.push([xL, y1 - 36], [W * 0.5, y1], [xR - 70, y1 + 26], [xR, y1 + 80], [xR, man.bottom]);
    const y2 = Math.min(man.bottom + 60, end - 90);
    main.push([xR, y2 - 30], [xR - 70, y2 - 2], [W * 0.5, y2 + 12], [xL + 70, y2 + 30], [xL, y2 + 80]);
  }
  if (end > main[main.length - 1]![1] + 20) main.push([xL, end]);
  return { W, H, main, branch, beads, fork };
}

/** Proceso + Tecnología: entra por el carril izquierdo, recorre la línea de tiempo y se para abajo. */
function processLayout(root: HTMLElement, wide: boolean): Geometry {
  const { W, H, rel, contentLeft } = measure(root);
  const xL = Math.max(wide ? 14 : 9, contentLeft / 2);
  const tl = rel(root.querySelector('#proceso .timeline'));
  const tlLine = rel(root.querySelector('#proceso .timeline__line'));
  const steps = [...root.querySelectorAll('#proceso .timeline__step')].map(rel);

  const main: Pt[] = [[xL, 0]];
  const beads: Omit<Bead, 'at'>[] = [];
  if (tl && tlLine) {
    const lx = tlLine.left + 0.5;
    main.push([xL, tl.top - 90], [lx, tl.top - 10], [lx, tl.top + 4]);
    for (const st of steps) if (st) beads.push({ x: lx, y: st.top + 26, path: 'main' });
    // Salida en diagonal suave hacia el carril izquierdo (sin rizo)
    main.push([lx, tl.bottom], [(lx + xL) / 2, tl.bottom + 70], [xL, tl.bottom + 150]);
  }
  const end = H - 28;
  if (end > main[main.length - 1]![1] + 20) main.push([xL, end]);
  return { W, H, main, branch: [], beads, fork: null };
}

const LAYOUTS: Record<TrailRoute, (root: HTMLElement, wide: boolean) => Geometry> = {
  intro: introLayout,
  process: processLayout,
};

export function PencilTrail({ route, children }: { route: TrailRoute; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const mainRef = useRef<SVGPathElement>(null);
  const branchRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const beadsRef = useRef<HTMLDivElement>(null);
  const pencilBox = useRef<HTMLDivElement>(null);
  const pencil = useRef<PropHandle>(null);

  useGSAP(
    () => {
      const el = root.current, mainP = mainRef.current, branchP = branchRef.current, svg = svgRef.current, beadsEl = beadsRef.current, pbox = pencilBox.current;
      if (!el || !mainP || !branchP || !svg || !beadsEl || !pbox) return;
      const mm = gsap.matchMedia();
      mm.add({ wide: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
        const wide = !!ctx.conditions?.wide;
        const motion = !!ctx.conditions?.motion;
        // Punta del lápiz en la imagen (0..1); el render la calcula y la deja en meta.json
        let anchor: [number, number] = [0.32, 0.73];
        void fetch('/props/pencil/meta.json').then((r) => (r.ok ? r.json() : null)).then((m: { anchor?: [number, number] } | null) => {
          if (m?.anchor) {
            anchor = m.anchor;
            update();
          }
        }).catch(() => {});

        let mainL: Lut | null = null, branchL: Lut | null = null, forkY = 0, branchEndY = 0, rootTop = 0, width = 0;
        // Cerca del borde derecho el lápiz se refleja para no salirse de la ventana (con histéresis)
        let flipped = false;
        let beads: (Bead & { node: HTMLElement })[] = [];
        const size = () => pbox.offsetWidth || 150;

        const build = () => {
          const g = LAYOUTS[route](el, wide);
          width = g.W;
          svg.setAttribute('width', String(g.W));
          svg.setAttribute('height', String(g.H));
          svg.setAttribute('viewBox', `0 0 ${g.W} ${g.H}`);
          const mp = handDrawn(smoothPath(g.main));
          mainL = lut(mp);
          mainP.setAttribute('d', toD(mp));
          mainP.style.strokeDasharray = `${mainL.total}`;
          if (g.branch.length > 1) {
            const bp = handDrawn(smoothPath(g.branch), 0.9);
            branchL = lut(bp);
            branchP.setAttribute('d', toD(bp));
            branchP.style.strokeDasharray = `${branchL.total}`;
            forkY = g.fork?.[1] ?? 0;
            branchEndY = bp[bp.length - 1]![1];
          } else {
            branchL = null;
            branchP.setAttribute('d', '');
          }
          beadsEl.replaceChildren();
          beads = g.beads.map((b) => {
            const node = document.createElement('span');
            node.className = 'trail__bead';
            node.style.left = `${b.x}px`;
            node.style.top = `${b.y}px`;
            const img = document.createElement('img');
            img.src = '/props/bead/f_0001.webp';
            img.alt = '';
            node.append(img);
            beadsEl.append(node);
            const at = b.path === 'branch' ? Infinity : nearestLength(mainL!, b.x, b.y);
            return { ...b, at, node };
          });
          rootTop = el.getBoundingClientRect().top + window.scrollY;
          update();
        };

        const update = () => {
          if (!mainL) return;
          const target = motion ? window.scrollY + window.innerHeight * TIP_AT - rootTop : Infinity;
          const L = motion ? lengthAtY(mainL, target) : mainL.total;
          mainP.style.strokeDashoffset = `${mainL.total - L}`;
          let bProg = 1;
          if (branchL) {
            bProg = motion ? Math.min(1, Math.max(0, (target - forkY) / Math.max(1, branchEndY - forkY))) : 1;
            branchP.style.strokeDashoffset = `${branchL.total * (1 - bProg)}`;
          }
          for (const b of beads) b.node.classList.toggle('is-on', b.path === 'branch' ? bProg >= 0.999 : L >= b.at - 2);
          // Lápiz en la punta: aparece al empezar a dibujar y, al terminar, se queda parado al final
          // del trazo (con movimiento reducido se muestra directamente ahí)
          const show = !motion || L > 1;
          pbox.style.opacity = show ? '1' : '0';
          if (show) {
            const [x, y] = pointAt(mainL, L);
            const s = size();
            if (x > width * 0.72) flipped = true;
            else if (x < width * 0.28) flipped = false;
            const ax = flipped ? 1 - anchor[0] : anchor[0];
            pbox.style.transform = `translate3d(${x - ax * s}px, ${y - anchor[1] * s}px, 0)${flipped ? ' scaleX(-1)' : ''}`;
            pencil.current?.setFrame(Math.floor(L / 11) % PENCIL_FRAMES);
          }
        };

        const raf = requestAnimationFrame(build);
        ScrollTrigger.addEventListener('refresh', build);
        const st = ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onUpdate: update });
        const ro = new ResizeObserver(() => build());
        ro.observe(el);
        const onScroll = () => update();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
          cancelAnimationFrame(raf);
          ScrollTrigger.removeEventListener('refresh', build);
          st.kill();
          ro.disconnect();
          window.removeEventListener('scroll', onScroll);
          beadsEl.replaceChildren();
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [route] },
  );

  return (
    <div ref={root} className="trail">
      <svg ref={svgRef} className="trail__svg" aria-hidden="true" focusable="false">
        <path ref={mainRef} className="trail__path" />
        <path ref={branchRef} className="trail__path trail__path--branch" />
      </svg>
      <div ref={beadsRef} className="trail__beads" aria-hidden="true" />
      <div ref={pencilBox} className="trail__pencil" aria-hidden="true">
        <PropCanvas ref={pencil} name="pencil" frames={PENCIL_FRAMES} maxPx={512} className="trail__pencil-canvas" />
      </div>
      {children}
    </div>
  );
}
