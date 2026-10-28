'use client';

import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { FrameSequence } from '@/lib/frame-sequence';

export type PropHandle = {
  /** Frame 0-based (admite decimales; se redondea) */
  setFrame: (frame: number) => void;
};

type Props = {
  /** Carpeta en public/props/<name> (render de scripts/hero/props.py) */
  name: string;
  frames: number;
  className?: string;
  /** Tope de resolución interna del canvas */
  maxPx?: number;
  /** Cargar al montar en lugar de al acercarse al viewport */
  eager?: boolean;
  ref?: Ref<PropHandle>;
};

/**
 * Objeto 3D renderizado (secuencia WebP con alfa) dibujado en un canvas transparente.
 * Descarga perezosa: empieza cuando el canvas está a menos de 800 px del viewport.
 * Solo decodifica los frames cercanos al actual (motor FrameSequence del hero).
 */
export function PropCanvas({ name, frames, className, maxPx = 640, eager = false, ref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seqRef = useRef<FrameSequence | null>(null);
  const pending = useRef(0);

  useImperativeHandle(
    ref,
    () => ({
      setFrame: (frame: number) => {
        pending.current = frame;
        seqRef.current?.setFrame(frame);
      },
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let seq: FrameSequence | null = null;
    let ro: ResizeObserver | null = null;

    const start = () => {
      if (seq) return;
      seq = new FrameSequence({
        canvas,
        count: frames,
        urlFor: (i) => `/props/${name}/f_${String(i + 1).padStart(4, '0')}.webp`,
        windowSize: 6,
        keyStride: 12,
        maxPixelWidth: maxPx,
      });
      seqRef.current = seq;
      seq.setFrame(pending.current);
      void seq.preload(3);
      ro = new ResizeObserver(() => seq?.resize());
      ro.observe(canvas);
    };

    let io: IntersectionObserver | null = null;
    if (eager) start();
    else {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            start();
            io?.disconnect();
          }
        },
        { rootMargin: '800px 0px' },
      );
      io.observe(canvas);
    }

    return () => {
      io?.disconnect();
      ro?.disconnect();
      seq?.destroy();
      seqRef.current = null;
    };
  }, [name, frames, maxPx, eager]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
