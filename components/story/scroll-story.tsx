'use client';

import { useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { gsap, useGSAP, SplitText } from '@/lib/gsap';
import { FrameSequence } from '@/lib/frame-sequence';
import { track } from '@/lib/analytics';
import { progressToFrame, type StoryConfig } from '@/lib/story';
import '@/components/hero/hero.css';

/** Ejecuta `fn` cuando el hilo principal esté libre (tras el LCP). Devuelve un cancelador. */
function whenIdle(fn: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 250);
  return () => window.clearTimeout(id);
}

type NetworkInformationLike = { saveData?: boolean; effectiveType?: string };

/** Conexión lenta o ahorro de datos → versión estática (misma que reduce-motion). */
function isLiteConnection(): boolean {
  const nav = navigator as Navigator & { connection?: NetworkInformationLike };
  const c = nav.connection;
  if (!c) return false;
  return c.saveData === true || ['slow-2g', '2g', '3g'].includes(c.effectiveType ?? '');
}

type Props = {
  story: StoryConfig;
  /** aria-label de la sección */
  ariaLabel: string;
  /** Línea mono sobre el titular */
  eyebrow: ReactNode;
  /** Contenido del único <h1> de la página */
  title: ReactNode;
  sub: ReactNode;
  /** Botones bajo el subtítulo */
  actions: ReactNode;
  /** Bloque final (titular corto + botones) que aparece al terminar la historia */
  finalCta: ReactNode;
  /** Indicio de scroll al pie */
  cue?: string;
  /** Contenido extra al principio (p. ej. migas de pan) */
  children?: ReactNode;
};

/**
 * Historia por scroll (§6.2–§6.8): sección 100svh fijada; secuencia de frames en canvas;
 * 4 capítulos con texto real; etiquetas ancladas al objeto; CTA final.
 * Estados: carga inicial (póster = frame 1), sin JS, reduce-motion / conexión lenta
 * (estático: composición final + capítulos apilados), móvil (frames retrato propios).
 */
export function ScrollStory({ story, ariaLabel, eyebrow, title, sub, actions, finalCta, cue = 'Desliza para ver cómo', children }: Props) {
  const root = useRef<HTMLElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLPictureElement>(null);
  const { chapters, chips, posters } = story;

  useGSAP(
    () => {
      const el = root.current;
      const canvas = canvasRef.current;
      const h1 = h1Ref.current;
      if (!el || !canvas || !h1) return;

      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      const setStatic = () => {
        el.dataset.static = 'true';
        return () => {
          delete el.dataset.static;
        };
      };

      // ── Versión animada ─────────────────────────────────────────────
      mm.add(
        {
          desktop: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
          mobile: '(max-width: 899px) and (prefers-reduced-motion: no-preference)',
        },
        (ctx) => {
          if (isLiteConnection()) return setStatic();

          const isDesktop = ctx.conditions?.desktop === true;
          const cfg = isDesktop ? story.sequence.desktop : story.sequence.mobile;
          el.dataset.live = 'true';

          // 1) Titular: entrada por líneas con máscara (SplitText)
          const split = SplitText.create(h1, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            linesClass: 'hero__line',
            onSplit: (self) =>
              gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.1 }),
          });

          // 2) Motor de frames
          const seq = new FrameSequence({
            canvas,
            count: cfg.count,
            urlFor: (i) => `${cfg.base}${String(i + 1).padStart(cfg.pad, '0')}.${cfg.ext}`,
            windowSize: cfg.windowSize,
            keyStride: story.keyStride,
            maxPixelWidth: cfg.maxPx,
            onFirstDraw: () => {
              canvas.dataset.ready = 'true';
              posterRef.current?.setAttribute('hidden', ''); // el frame del canvas sustituye al póster
            },
          });
          seq.setFrame(0);
          const cancelIdle = whenIdle(() => void seq.preload(cfg.concurrency)); // tras el LCP

          const ro = new ResizeObserver(() => seq.resize());
          ro.observe(canvas);

          // 3) Línea de tiempo maestra: duración 1 → tiempo = progreso
          const seen = new Set<string>();
          const state = { p: 0 };
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: cfg.pinLength,
              pin: true,
              scrub: isDesktop ? true : 0.4,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onToggle: (self) => {
                // Contrato con el Header: no se oculta mientras la historia está fijada.
                if (self.isActive) {
                  document.body.dataset.heroPinned = 'true';
                  el.dataset.pinned = 'true';
                } else {
                  delete document.body.dataset.heroPinned;
                  delete el.dataset.pinned;
                }
              },
              onUpdate: (self) => {
                for (const c of chapters) {
                  if (self.progress >= c.from && !seen.has(c.id)) {
                    seen.add(c.id);
                    track('hero_chapter', { story: story.id, chapter: c.n });
                  }
                }
              },
            },
          });

          tl.to(
            state,
            { p: 1, duration: 1, onUpdate: () => seq.setFrame(progressToFrame(state.p, cfg.count, story.frameKeys)) },
            0,
          );

          // Titular inicial se aparta; el lienzo crece
          tl.to(q('[data-hero-intro]'), { yPercent: -18, scale: 0.9, autoAlpha: 0, duration: 0.1 }, 0.01);
          tl.to(q('[data-scroll-cue]'), { autoAlpha: 0, duration: 0.03 }, 0);
          tl.fromTo(
            q('[data-hero-stage]'),
            // Empieza bajo el titular y los botones (zona segura, §7.2). `y: 0` anula el
            // translateY inicial del CSS, que GSAP leería como desplazamiento en px.
            isDesktop ? { scale: 0.82, yPercent: 17, y: 0 } : { scale: 0.9, yPercent: 22, y: 0 },
            // Móvil: un poco por encima del centro mientras se leen los capítulos (el texto va abajo)
            { scale: 1, yPercent: isDesktop ? 0 : -6, y: 0, duration: 0.16 },
            0,
          );
          if (!isDesktop) {
            // …y vuelve al centro antes de que la CTA final ocupe la parte superior
            tl.to(q('[data-hero-stage]'), { yPercent: 0, duration: 0.05, ease: 'power2.inOut' }, 0.84);
          }

          // Escritorio: el escenario se aparta del lado donde va el texto de cada capítulo
          if (isDesktop) {
            for (const shift of story.stageShifts ?? []) {
              tl.to(
                q('[data-hero-stage]'),
                { xPercent: shift.xPercent, duration: 0.08, ease: 'power2.inOut' },
                shift.at,
              );
            }
          } else {
            // Móvil: el titular ocupa casi toda la primera pantalla; la escena aparece con un
            // fundido al empezar el scroll en lugar de asomar detrás de los botones.
            tl.fromTo(q('[data-hero-stage]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.02);
          }

          // Capítulos y marcas del indicador de progreso
          for (const c of chapters) {
            const node = q(`[data-chapter="${c.id}"]`);
            const tick = q(`[data-tick="${c.id}"]`);
            tl.fromTo(node, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: 'power3.out' }, c.from);
            tl.to(node, { autoAlpha: 0, y: -28, duration: 0.04, ease: 'power3.in' }, c.to - 0.04);
            tl.fromTo(tick, { opacity: 0.25 }, { opacity: 1, duration: 0.03 }, c.from);
            tl.to(tick, { opacity: 0.25, duration: 0.03 }, c.to - 0.03);
          }

          // Barra de progreso
          tl.fromTo(q('[data-hero-progress]'), { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);

          // Etiquetas ancladas al objeto
          for (const c of chips) {
            const node = q(`[data-chip="${c.id}"]`);
            tl.fromTo(node, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.03, ease: 'expo.out' }, c.at);
            if (c.until < 1) tl.to(node, { autoAlpha: 0, duration: 0.03 }, c.until - 0.03);
          }

          // CTA final
          tl.fromTo(
            q('[data-hero-cta]'),
            { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, y: 0, duration: 0.05, ease: 'expo.out' },
            story.finalCtaAt,
          );

          // 4) Parallax con el puntero (solo escritorio y puntero fino)
          let removeParallax: () => void = () => {};
          if (isDesktop && window.matchMedia('(pointer: fine)').matches) {
            const target = q('[data-parallax]');
            const qx = gsap.quickTo(target, 'x', { duration: 0.8, ease: 'power3.out' });
            const qy = gsap.quickTo(target, 'y', { duration: 0.8, ease: 'power3.out' });
            const onMove = (e: PointerEvent) => {
              qx((e.clientX / window.innerWidth - 0.5) * 14);
              qy((e.clientY / window.innerHeight - 0.5) * 10);
            };
            window.addEventListener('pointermove', onMove, { passive: true });
            removeParallax = () => window.removeEventListener('pointermove', onMove);
          }

          return () => {
            removeParallax();
            cancelIdle();
            ro.disconnect();
            split.revert();
            seq.destroy();
            delete canvas.dataset.ready;
            posterRef.current?.removeAttribute('hidden');
            delete el.dataset.live;
            delete el.dataset.pinned;
            delete document.body.dataset.heroPinned;
          };
        },
      );

      // ── Versión estática (reduce-motion): sin ScrollTrigger, sin parallax ──
      mm.add('(prefers-reduced-motion: reduce)', () => setStatic());

      return () => mm.revert();
    },
    { scope: root },
  );

  /** "Saltar la animación": con Lenis se resuelve el ancla con scrollTo y se mueve el foco. */
  const onSkip = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector<HTMLElement>(story.skipTarget);
    if (!target) return; // sin destino, el navegador hace lo suyo
    e.preventDefault();
    const focusTarget = () => {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    const lenis = window.__lenis;
    if (lenis) {
      lenis.scrollTo(story.skipTarget, { offset: -96, onComplete: focusTarget });
    } else {
      target.scrollIntoView({ block: 'start' });
      focusTarget();
    }
  };

  return (
    <>
      {/* Precarga del póster LCP (§11.2): React 19 eleva estos <link> al <head> y respeta `media`. */}
      <link rel="preload" as="image" href={posters.first} media="(min-width: 900px)" fetchPriority="high" />
      <link rel="preload" as="image" href={posters.firstMobile} media="(max-width: 899px)" fetchPriority="high" />
      <section ref={root} className="hero" data-story={story.id} aria-label={ariaLabel}>
        {/* Saltar la animación (§12): visible solo al recibir foco */}
        <a href={story.skipTarget} className="hero__skip" onClick={onSkip}>
          Saltar la animación
        </a>
        {children}

        {/* TEXTO REAL (siempre en el DOM: SEO y accesibilidad) */}
        <div data-hero-intro className="hero__intro">
          <p className="label">{eyebrow}</p>
          <h1 ref={h1Ref} data-hero-h1 className="display-xl">
            {title}
          </h1>
          <p className="body-l hero__sub">{sub}</p>
          <div className="hero__actions">{actions}</div>
        </div>

        {/* ESCENA */}
        <div data-hero-stage className="hero__stage">
          <div data-parallax className="hero__box">
            {/* Póster = frame 1 (elemento LCP, precargado en <head>). Idéntico al primer frame. */}
            <picture ref={posterRef} className="hero__poster hero__poster--first">
              <source media="(max-width: 899px)" srcSet={posters.firstMobile} />
              <img src={posters.first} alt="" width={1200} height={1200} fetchPriority="high" decoding="async" />
            </picture>
            {/* Composición final: solo en la versión estática (reduce-motion, conexión lenta o sin JS) */}
            <picture className="hero__poster hero__poster--last">
              <img src={posters.last} alt={story.lastAlt} width={1200} height={1200} loading="lazy" decoding="async" />
            </picture>
            <canvas ref={canvasRef} role="img" aria-label={story.canvasLabel} />
            {chips.map((c) => (
              <span
                key={c.id}
                data-chip={c.id}
                data-mobile={story.mobileChips.includes(c.id) ? 'true' : 'false'}
                className="chip hero__chip"
                style={
                  {
                    '--chip-x': c.x,
                    '--chip-y': c.y,
                    '--chip-mx': c.mx ?? c.x,
                    '--chip-my': c.my ?? c.y,
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* CAPÍTULOS (texto real; ocultos con visibility hasta su momento) */}
        <div className="hero__chapters">
          {chapters.map((c) => (
            <article key={c.id} data-chapter={c.id} data-side={c.side} className="hero__chapter">
              <p className="label">
                {c.n} — {c.title}
              </p>
              <h2 className="h3">
                <em className="accent-word">{c.lead}</em>
              </h2>
              <p className="text-ink-2">{c.text}</p>
            </article>
          ))}
        </div>

        {/* Narrativa completa para lectores de pantalla (§12) */}
        <div className="sr-only">
          <h2>{story.srTitle}</h2>
          <ol>
            {chapters.map((c) => (
              <li key={c.id}>
                <strong>{c.title}.</strong> {c.lead} {c.text}
              </li>
            ))}
          </ol>
        </div>

        {/* PROGRESO */}
        <div className="hero__progress" aria-hidden="true">
          <span data-hero-progress className="hero__progress-bar" />
          {chapters.map((c, i) => (
            <span
              key={c.id}
              data-tick={c.id}
              className="label hero__tick"
              style={{ top: `${(i / Math.max(1, chapters.length - 1)) * 100}%` }}
            >
              {c.n}
            </span>
          ))}
        </div>

        {/* CTA FINAL + INDICIO DE SCROLL */}
        <div data-hero-cta className="hero__cta">
          {finalCta}
        </div>
        <p data-scroll-cue className="label hero__cue" aria-hidden="true">
          {cue}
        </p>

        {/* Sin JS: póster final + capítulos y CTA visibles, apilados */}
        <noscript>
          <style>{`.hero{height:auto;overflow:visible;padding-block:calc(var(--header-h) + 3rem) var(--section-y)}.hero__intro,.hero__stage,.hero__chapter,.hero__cta{position:static;translate:none;opacity:1;visibility:visible}.hero__stage{display:grid;margin-block:3rem}.hero__box{width:min(92vw,640px);aspect-ratio:1/1}.hero__poster--first,.hero__box canvas{display:none}.hero__poster--last{display:block}.hero__chapters{display:grid;gap:2rem;max-width:40rem;margin-inline:auto;padding-inline:var(--gutter)}.hero__chapter{max-width:none;text-align:left}.hero__chapter::after{display:none}.hero__cta{margin-top:3rem}.hero__progress,.hero__cue,.hero__chip{display:none}`}</style>
        </noscript>
      </section>
    </>
  );
}
