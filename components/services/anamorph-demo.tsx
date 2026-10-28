'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Chip } from '@/components/ui/chip';
import './anamorph-demo.css';

/**
 * «Haz que encaje» (§8.3.4, mini-ejemplo interactivo): la escultura del hero de productos
 * creativos vista desde una rejilla de puntos de vista renderizada en Blender
 * (scripts/hero/scenes/productos-creativos.py --mode grid). El puntero, el arrastre o las flechas
 * eligen el punto de vista; solo desde la celda central las piezas forman el «&».
 * No se anima sola: todo movimiento lo provoca quien la usa.
 */

const BASE = '/sequence/productos-creativos/v2/grid';
type Meta = { cols: number; rows: number; dAz: number; dEl: number };
const FALLBACK: Meta = { cols: 11, rows: 7, dAz: 5, dEl: 4 };
const CACHE = 18; // imágenes decodificadas que se guardan (LRU)

const url = (r: number, c: number) => `${BASE}/r${r}_c${String(c).padStart(2, '0')}.webp`;
const clampInt = (v: number, a: number, b: number) => Math.max(a, Math.min(b, Math.round(v)));

export function AnamorphDemo() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [meta, setMeta] = useState<Meta>(FALLBACK);
  // Vista inicial desplazada: las piezas se ven dispersas y hay algo que buscar
  const [view, setView] = useState({ r: 1, c: 2 });
  const [ready, setReady] = useState(false);
  const cache = useRef(new Map<string, HTMLImageElement>());
  const wanted = useRef('');
  const drag = useRef<{ x: number; c: number } | null>(null);
  const helpId = useId();

  const center = { r: Math.floor(meta.rows / 2), c: Math.floor(meta.cols / 2) };
  const aligned = view.r === center.r && view.c === center.c;
  const az = (view.c - center.c) * meta.dAz;
  const el = (center.r - view.r) * meta.dEl;

  // Carga perezosa: la rejilla empieza a descargarse cuando la demo se acerca a la pantalla
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        fetch(`${BASE}/meta.json`)
          .then((r) => (r.ok ? r.json() : null))
          .then((m: Meta | null) => {
            if (!cancelled && m) setMeta(m);
          })
          .catch(() => {});
        setReady(true);
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, []);

  // Dibuja la vista pedida en cuanto su imagen está decodificada (sin parpadeo: se mantiene la anterior)
  useEffect(() => {
    if (!ready) return;
    const src = url(view.r, view.c);
    wanted.current = src;
    const draw = (im: HTMLImageElement) => {
      const cv = canvas.current;
      if (!cv || wanted.current !== src) return;
      const box = cv.getBoundingClientRect();
      const px = Math.min(im.naturalWidth, Math.round(box.width * Math.min(2, window.devicePixelRatio || 1)));
      if (cv.width !== px) cv.width = cv.height = px;
      const ctx = cv.getContext('2d');
      ctx?.drawImage(im, 0, 0, px, px);
    };
    const hit = cache.current.get(src);
    if (hit) {
      cache.current.delete(src);
      cache.current.set(src, hit);
      draw(hit);
      return;
    }
    const im = new Image();
    im.decoding = 'async';
    im.src = src;
    im.decode()
      .then(() => {
        cache.current.set(src, im);
        while (cache.current.size > CACHE) cache.current.delete(cache.current.keys().next().value!);
        draw(im);
      })
      .catch(() => {});
  }, [ready, view]);

  // Precarga discreta del resto de la rejilla (caché HTTP), empezando por la fila central
  useEffect(() => {
    if (!ready) return;
    const order: string[] = [];
    for (let d = 0; d < meta.rows; d++) {
      for (const r of new Set([center.r - d, center.r + d])) {
        if (r < 0 || r >= meta.rows) continue;
        for (let c = 0; c < meta.cols; c++) order.push(url(r, c));
      }
    }
    let i = 0, stop = false;
    const next = () => {
      if (stop || i >= order.length) return;
      const src = order[i++]!;
      fetch(src, { priority: 'low' } as RequestInit).catch(() => {}).finally(next);
    };
    for (let k = 0; k < 3; k++) next();
    return () => {
      stop = true;
    };
  }, [ready, meta, center.r]);

  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - box.left) / box.width) * 2 - 1;
    const ny = ((e.clientY - box.top) / box.height) * 2 - 1;
    return { nx: Math.max(-1, Math.min(1, nx)), ny: Math.max(-1, Math.min(1, ny)) };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
      // Ratón: la posición sobre la escultura es el punto de vista (arriba = mirar desde más alto)
      const { nx, ny } = fromPointer(e);
      setView({ r: clampInt(center.r + ny * center.r, 0, meta.rows - 1), c: clampInt(center.c + nx * center.c, 0, meta.cols - 1) });
    } else if (drag.current) {
      // Táctil: arrastre horizontal (el vertical sigue desplazando la página)
      const box = e.currentTarget.getBoundingClientRect();
      const dc = ((e.clientX - drag.current.x) / box.width) * meta.cols * 1.2;
      setView({ r: center.r, c: clampInt(drag.current.c + dc, 0, meta.cols - 1) });
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') {
      drag.current = { x: e.clientX, c: view.c };
      if (view.r !== center.r) setView((v) => ({ ...v, r: center.r }));
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
    if (!d) return;
    e.preventDefault();
    setView((v) => ({ r: clampInt(v.r + d[0]!, 0, meta.rows - 1), c: clampInt(v.c + d[1]!, 0, meta.cols - 1) }));
  };

  const fmt = (deg: number) => `${deg > 0 ? '+' : deg < 0 ? '−' : '±'}${Math.abs(deg)}°`;

  return (
    <figure className="anamorph">
      <div
        ref={stage}
        className="anamorph__stage"
        data-aligned={aligned ? 'true' : 'false'}
        tabIndex={0}
        role="group"
        aria-roledescription="demo interactiva"
        aria-label="Escultura de piezas: cambia el punto de vista hasta que formen un «&»"
        aria-describedby={helpId}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={onKeyDown}
      >
        <canvas ref={canvas} className="anamorph__canvas" aria-hidden="true" />
        <span className="anamorph__chip" aria-hidden={!aligned}>
          <Chip live>Encaja</Chip>
        </span>
      </div>
      <figcaption className="anamorph__bar">
        <span id={helpId} className="anamorph__help">
          Mueve el puntero sobre la escultura, arrastra en el móvil o usa las flechas.
        </span>
        <span className="anamorph__readout" aria-hidden="true">
          az {fmt(az)} · el {fmt(el)}
        </span>
      </figcaption>
      <p className="sr-only" aria-live="polite">
        {aligned ? 'Las piezas encajan: este es el punto de vista.' : ''}
      </p>
    </figure>
  );
}
