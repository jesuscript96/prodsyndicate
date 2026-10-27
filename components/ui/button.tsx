'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import {
  useRef,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { gsap } from '@/lib/gsap';
import { track } from '@/lib/analytics';
import { clamp, cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';

type Base = {
  variant?: Variant;
  size?: 'md' | 'sm';
  /** Flecha a la derecha; 'up' para enlaces externos (↗) */
  arrow?: boolean | 'up';
  /** Desplazamiento magnético ≤ 6 px, solo con puntero fino */
  magnetic?: boolean;
  className?: string;
  children: ReactNode;
  /** Registra `cta_click` con ubicación y etiqueta (sin datos personales) */
  analytics?: { location: string; label?: string };
};

type AsLink = Base & { href: string; external?: boolean } & Omit<
    ComponentPropsWithoutRef<'a'>,
    'href' | 'children' | 'className'
  >;
type AsButton = Base & { href?: undefined; external?: undefined } & Omit<
    ComponentPropsWithoutRef<'button'>,
    'children' | 'className'
  >;

export type ButtonProps = AsLink | AsButton;

const fine = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches;

/** Botón píldora (§5.6): primary / secondary / ghost, 52 px, flecha que desliza, magnético. */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    arrow = false,
    magnetic = true,
    className,
    children,
    analytics,
    ...rest
  } = props;
  const ref = useRef<HTMLElement | null>(null);

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!magnetic || !el || !fine()) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    gsap.to(el, {
      x: clamp(dx * 0.15, -6, 6),
      y: clamp(dy * 0.15, -6, 6),
      duration: 0.4,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };
  const onPointerLeave = () => {
    const el = ref.current;
    if (!el || !magnetic) return;
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
  };
  const onClickTrack = () => {
    if (analytics) {
      track('cta_click', {
        location: analytics.location,
        label: analytics.label ?? (typeof children === 'string' ? children : ''),
      });
    }
  };

  const classes = cn('btn', `btn--${variant}`, size === 'sm' && 'btn--sm', className);
  const Arrow = arrow === 'up' ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      <span>{children}</span>
      {arrow && <Arrow className={cn('btn__arrow', arrow === 'up' && 'btn__arrow--up')} aria-hidden="true" />}
    </>
  );

  if ('href' in props && typeof props.href === 'string') {
    const { href, external, onClick, ...anchor } = rest as AsLink;
    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      onClickTrack();
      onClick?.(e);
    };
    if (external || /^https?:|^mailto:|^tel:/.test(href)) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onClick={handleClick}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          {...anchor}
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onClick={handleClick}
        {...anchor}
      >
        {content}
      </Link>
    );
  }

  const { onClick, type = 'button', ...button } = rest as AsButton;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      className={classes}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={(e) => {
        onClickTrack();
        onClick?.(e);
      }}
      {...button}
    >
      {content}
    </button>
  );
}
