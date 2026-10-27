import Image from 'next/image';
import { AlertTriangle, Info } from 'lucide-react';
import type { MDXComponents } from 'mdx/types';
import { isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { createSlugger, textOf } from './slugify';

/* ───────────── Componentes propios disponibles en los artículos (§8.9) ───────────── */

type CalloutProps = {
  /** `nota` (azul, informativa) o `aviso` (hairline naranja decorativa) */
  type?: 'nota' | 'aviso';
  title?: string;
  children: ReactNode;
};

/** Nota o aviso dentro del artículo. */
export function Callout({ type = 'nota', title, children }: CalloutProps) {
  const Icon = type === 'aviso' ? AlertTriangle : Info;
  return (
    <aside className={cn('callout', `callout--${type}`)} role="note">
      <p className="callout__head">
        <Icon aria-hidden="true" />
        <span className="label">{title ?? (type === 'aviso' ? 'Aviso' : 'Nota')}</span>
      </p>
      <div className="callout__body">{children}</div>
    </aside>
  );
}

type FigureProps = {
  /** Imagen (ruta en /public). Si no hay `src`, se usa el contenido (código, esquema…). */
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: ReactNode;
  children?: ReactNode;
};

/** Figura con pie: imagen optimizada o cualquier bloque (código, esquema de texto). */
export function Figure({ src, alt = '', width = 1200, height = 750, caption, children }: FigureProps) {
  return (
    <figure className="figure">
      {src ? (
        <Image src={src} alt={alt} width={width} height={height} sizes="(min-width: 1024px) 720px, 100vw" />
      ) : (
        <div className="figure__box">{children}</div>
      )}
      {caption && <figcaption className="figure__caption">{caption}</figcaption>}
    </figure>
  );
}

/** Bloque de código: detecta el lenguaje del `className="language-…"` y lo muestra como etiqueta. */
function Pre({ children, className, ...rest }: ComponentPropsWithoutRef<'pre'>) {
  let lang: string | undefined;
  if (isValidElement<{ className?: string }>(children)) {
    const m = /language-([\w-]+)/.exec(children.props.className ?? '');
    lang = m?.[1];
  }
  return (
    <div className="code">
      {lang && (
        <span className="code__lang" aria-hidden="true">
          {lang}
        </span>
      )}
      <pre className={className} tabIndex={0} {...rest}>
        {children}
      </pre>
    </div>
  );
}

/**
 * Mapa de componentes para `compileMDX`. Se crea UNO por artículo: los h2/h3
 * comparten un generador de ids (slug del texto, con desambiguación), que es el
 * mismo que usa `extractHeadings()` para el índice lateral.
 */
export function createMdxComponents(): MDXComponents {
  const slug = createSlugger();

  const heading = (level: 2 | 3) => {
    const Tag = level === 2 ? 'h2' : 'h3';
    function Heading({ children, id, ...rest }: ComponentPropsWithoutRef<'h2'>) {
      const hid = id ?? slug(textOf(children));
      return (
        <Tag id={hid} {...rest}>
          {children}
        </Tag>
      );
    }
    return Heading;
  };

  return {
    h2: heading(2),
    h3: heading(3),
    pre: Pre,
    Callout,
    Figure,
  };
}
