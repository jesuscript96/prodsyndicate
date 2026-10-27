/**
 * Motor de secuencia de frames sobre <canvas> (§6.6d).
 *
 * Reglas de diseño (importan más que el código):
 * - NUNCA se mantienen todos los frames decodificados (1200² ≈ 5,8 MB cada uno).
 *   Se guardan los blobs comprimidos y se decodifican solo los frames de una
 *   ventana alrededor del actual + unas pocas "anclas" permanentes (keyStride).
 * - Descarga progresiva (0, último, cada 16, 8, 4, 2, 1): el scrub funciona con
 *   baja resolución temporal desde el principio y siempre se dibuja el frame
 *   disponible más cercano. Nunca se muestra un hueco.
 * - Las respuestas no ok (404 mientras la producción no existe) se ignoran.
 */

export type SequenceConfig = {
  canvas: HTMLCanvasElement;
  /** Número total de frames */
  count: number;
  /** URL del frame (índice 0-based) */
  urlFor: (index: number) => string;
  /** Frames decodificados a cada lado del actual (8 por defecto) */
  windowSize?: number;
  /** Cada N frames se conserva un bitmap ancla (30 por defecto) */
  keyStride?: number;
  /** Tope de resolución interna del canvas (ancho en píxeles físicos) */
  maxPixelWidth?: number;
  /** Se llama una sola vez, tras el primer dibujado real */
  onFirstDraw?: () => void;
};

const DEFAULT_WINDOW = 8;
const DEFAULT_STRIDE = 30;
/** Margen antes de cerrar un bitmap que ha salido de la ventana (evita churn al oscilar) */
const EVICT_SLACK = 4;

export class FrameSequence {
  private readonly cfg: SequenceConfig;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly blobs: Array<Blob | undefined>;
  private readonly bitmaps = new Map<number, ImageBitmap>();
  private readonly decoding = new Set<number>();
  private readonly abort = new AbortController();

  private target = 0;
  private drawn = -1;
  private rafId = 0;
  private destroyed = false;
  private firstDrawDone = false;

  constructor(cfg: SequenceConfig) {
    this.cfg = cfg;
    this.blobs = new Array<Blob | undefined>(cfg.count).fill(undefined);
    const ctx = cfg.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    this.ctx = ctx;
    this.resize();
  }

  private get win(): number {
    return this.cfg.windowSize ?? DEFAULT_WINDOW;
  }

  private get last(): number {
    return this.cfg.count - 1;
  }

  /** Frames que nunca se descartan: múltiplos de keyStride y el último. */
  private isAnchor(i: number): boolean {
    const s = this.cfg.keyStride ?? DEFAULT_STRIDE;
    return i % s === 0 || i === this.last;
  }

  /** Orden de descarga progresivo: 0, último, cada 16, 8, 4, 2, 1. */
  private loadOrder(): number[] {
    const n = this.cfg.count;
    const seen = new Set<number>([0, this.last]);
    const order = n > 1 ? [0, this.last] : [0];
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < n; i += step) {
        if (!seen.has(i)) {
          seen.add(i);
          order.push(i);
        }
      }
    }
    return order;
  }

  /** Descarga progresiva con concurrencia limitada. Resuelve cuando termina la cola. */
  async preload(concurrency = 6): Promise<void> {
    const queue = this.loadOrder();
    const worker = async (): Promise<void> => {
      while (queue.length > 0 && !this.destroyed) {
        const i = queue.shift();
        if (i === undefined) return;
        try {
          const res = await fetch(this.cfg.urlFor(i), { signal: this.abort.signal });
          if (!res.ok) continue;
          const blob = await res.blob();
          if (this.destroyed) return;
          this.blobs[i] = blob;
          if (Math.abs(i - this.target) <= this.win || this.isAnchor(i)) void this.ensureBitmap(i);
        } catch {
          /* red caída o abortado: se ignora; el motor usa el frame más cercano */
        }
      }
    };
    const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
    await Promise.all(workers);
  }

  private async ensureBitmap(i: number): Promise<void> {
    if (this.destroyed || this.bitmaps.has(i) || this.decoding.has(i)) return;
    const blob = this.blobs[i];
    if (!blob) return;
    this.decoding.add(i);
    try {
      const bmp = await createImageBitmap(blob);
      if (this.destroyed) {
        bmp.close();
        return;
      }
      this.bitmaps.set(i, bmp);
    } catch {
      /* blob corrupto o no decodificable: se descarta para no reintentar en bucle */
      this.blobs[i] = undefined;
      return;
    } finally {
      this.decoding.delete(i);
    }
    this.requestDraw();
  }

  /** Decodifica la ventana alrededor del objetivo y libera lo que ha quedado fuera. */
  private updateWindow(): void {
    const lo = this.target - this.win;
    const hi = this.target + this.win;
    for (let i = Math.max(0, lo); i <= Math.min(this.last, hi); i++) void this.ensureBitmap(i);
    for (const [i, bmp] of this.bitmaps) {
      if (!this.isAnchor(i) && (i < lo - EVICT_SLACK || i > hi + EVICT_SLACK)) {
        bmp.close();
        this.bitmaps.delete(i);
        if (i === this.drawn) this.drawn = -1;
      }
    }
  }

  /** Fija el frame objetivo (admite decimales; se redondea y se acota). */
  setFrame(frame: number): void {
    if (this.destroyed) return;
    const next = Math.min(this.last, Math.max(0, Math.round(Number.isFinite(frame) ? frame : 0)));
    if (next === this.target && this.drawn === next) return;
    this.target = next;
    this.updateWindow();
    this.requestDraw();
  }

  /** Frame decodificado más cercano al objetivo (o null si aún no hay ninguno). */
  private nearest(): number | null {
    if (this.bitmaps.has(this.target)) return this.target;
    for (let d = 1; d <= this.last; d++) {
      if (this.bitmaps.has(this.target - d)) return this.target - d;
      if (this.bitmaps.has(this.target + d)) return this.target + d;
    }
    return null;
  }

  /** Dibujo diferido a rAF: en segundo plano se pausa solo y al volver no hay saltos. */
  private requestDraw(): void {
    if (this.rafId !== 0 || this.destroyed) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      if (this.destroyed) return;
      const i = this.nearest();
      if (i === null || i === this.drawn) return;
      const bmp = this.bitmaps.get(i);
      if (!bmp) return;
      const { canvas } = this.cfg;
      if (canvas.width === 0 || canvas.height === 0) return;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      this.drawn = i;
      if (!this.firstDrawDone) {
        this.firstDrawDone = true;
        this.cfg.onFirstDraw?.();
      }
    });
  }

  /** Llamar al cambiar el tamaño del canvas (ResizeObserver / orientación). */
  resize(): void {
    if (this.destroyed) return;
    const { canvas, maxPixelWidth } = this.cfg;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth; // layout, no afectado por transform
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const w = Math.round(Math.min(cw * dpr, maxPixelWidth ?? Number.POSITIVE_INFINITY));
    const h = Math.round(w * (ch / cw));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    // Cambiar width/height borra el lienzo: forzar redibujado.
    this.drawn = -1;
    this.requestDraw();
  }

  /** Frames descargados (para depuración / degradación). */
  get loadedCount(): number {
    let n = 0;
    for (const b of this.blobs) if (b) n++;
    return n;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abort.abort();
    if (this.rafId !== 0) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.bitmaps.forEach((b) => b.close());
    this.bitmaps.clear();
    this.decoding.clear();
    this.blobs.fill(undefined);
  }
}
