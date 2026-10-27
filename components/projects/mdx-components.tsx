import Image from 'next/image';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import type { MDXComponents } from 'mdx/types';
import { ImageReveal } from '@/components/ui/image-reveal';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { SplitReveal } from '@/components/ui/split-reveal';
import './projects.css';

/* ───────────── Componentes propios de los casos de estudio (§8.4, plantilla de caso) ─────────────
   Se usan dentro del MDX de content/projects/*.mdx:

   <Summary>
     <Block title="El reto">…</Block>
     <Block title="Lo que hicimos">…</Block>
     <Block title="El resultado">…</Block>
   </Summary>
   <Gallery>
     <Shot src="/projects/<slug>/g1.webp" alt="…" caption="…" />
   </Gallery>                       ← o <Gallery images={[{ src, alt, caption? }]} />
   <Decisions>
     <Decision title="…">…</Decision>
   </Decisions>
*/

/** Resumen en 3 bloques (El reto · Lo que hicimos · El resultado). Numeración vía CSS. */
export function Summary({ children }: { children: ReactNode }) {
  return (
    <section className="case-summary" aria-label="Resumen del caso">
      {children}
    </section>
  );
}

/** Bloque del resumen: título (h2) a la izquierda, sticky en escritorio; texto a la derecha. */
export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal as="div" className="case-block">
      <div className="case-block__head">
        <h2 className="case-block__title">{title}</h2>
      </div>
      <div className="case-block__body">{children}</div>
    </Reveal>
  );
}

export type ShotProps = {
  /** Ruta en /public (1600×1200) */
  src: string;
  alt: string;
  caption?: ReactNode;
  width?: number;
  height?: number;
};

type ShotItem = ShotProps & { n: number };

function Figure({ src, alt, caption, width = 1600, height = 1200, n }: ShotItem) {
  return (
    <figure className="case-shot">
      <ImageReveal className="case-shot__media" radius={24}>
        <Image src={src} alt={alt} width={width} height={height} sizes="(min-width: 1280px) 600px, (min-width: 900px) 46vw, 92vw" />
      </ImageReveal>
      {caption && (
        <figcaption className="case-shot__caption">
          <span className="label" aria-hidden="true">
            {String(n).padStart(2, '0')}
          </span>
          <span>{caption}</span>
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Captura suelta (marco de dispositivo ya incluido en la imagen, §5.7). Dentro de
 * <Gallery> actúa solo como portador de datos: la galería lee sus props y maqueta.
 */
export function Shot(props: ShotProps) {
  return <Figure {...props} n={1} />;
}

type GalleryProps = {
  images?: ShotProps[];
  children?: ReactNode;
  /** Nombre accesible de la región */
  label?: string;
};

/**
 * Galería con columnas sticky alternas en escritorio (§8.4). Acepta `images` o hijos <Shot />.
 * Orden en el DOM: 1 · columna derecha (2, 4…) · 3 · 5… de modo que con tres capturas
 * (el caso habitual) el orden de lectura coincide con el visual. La columna derecha ocupa
 * todas las filas y sus capturas se quedan fijas mientras la izquierda sigue desplazándose.
 */
export function Gallery({ images, children, label = 'Galería de pantallas' }: GalleryProps) {
  const shots: ShotProps[] =
    images ??
    Children.toArray(children)
      .filter((child): child is ReactElement<ShotProps> => isValidElement<ShotProps>(child) && typeof child.props.src === 'string')
      .map((child) => child.props);
  if (!shots.length) return null;

  const items: ShotItem[] = shots.map((s, i) => ({ ...s, n: i + 1 }));
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);
  const [first, ...rest] = left;

  return (
    <section className="case-gallery" aria-label={label} style={{ ['--rows' as string]: left.length }}>
      <Figure {...first} />
      {right.length > 0 && (
        <div className="case-gallery__col">
          {right.map((shot) => (
            <Figure key={shot.src} {...shot} />
          ))}
        </div>
      )}
      {rest.map((shot) => (
        <Figure key={shot.src} {...shot} />
      ))}
    </section>
  );
}

/** Decisiones clave (2–3): título de sección + lista numerada. */
export function Decisions({ children }: { children: ReactNode }) {
  return (
    <section className="case-decisions" aria-labelledby="decisiones-clave">
      <div className="case-decisions__head">
        <SectionLabel>Decisiones clave</SectionLabel>
        <SplitReveal as="h2" id="decisiones-clave" className="h2 case-decisions__title">
          Decisiones <em className="accent-word text-accent">clave</em>.
        </SplitReveal>
      </div>
      <ol className="case-decisions__list">{children}</ol>
    </section>
  );
}

/** Una decisión de producto o técnica, explicada (profundidad = confianza). */
export function Decision({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal as="li" className="case-decision">
      <div className="case-decision__head">
        <h3 className="case-decision__title">{title}</h3>
      </div>
      <div className="case-decision__body">{children}</div>
    </Reveal>
  );
}

/** Mapa de componentes para `compileMDX` de los casos. */
export const projectMdxComponents: MDXComponents = {
  Summary,
  Block,
  Gallery,
  Shot,
  Decisions,
  Decision,
};
