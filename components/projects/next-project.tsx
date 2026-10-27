import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ProjectMeta } from '@/content/types';
import { ImageReveal } from '@/components/ui/image-reveal';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import './projects.css';

/**
 * "Siguiente proyecto" (§8.4, punto 7): enlace grande a otro caso. Toda la tarjeta es
 * clicable (enlace estirado desde el título), con portada a la derecha en escritorio.
 */
export function NextProject({ project }: { project: ProjectMeta }) {
  const href = `/proyectos/${project.slug}`;
  return (
    <section className="section hairline" aria-labelledby="next-project-title">
      <div className="wrap">
        <Reveal as="article" className="next-project">
          <div className="next-project__text">
            <SectionLabel>Siguiente proyecto</SectionLabel>
            <h2 id="next-project-title" className="h2 next-project__title">
              <Link href={href}>{project.title}</Link>
            </h2>
            <p className="body-l text-ink-2 next-project__summary">{project.summary}</p>
            <span className="label next-project__cta" aria-hidden="true">
              Ver el caso
              <ArrowRight />
            </span>
          </div>
          <ImageReveal className="next-project__media" radius={20}>
            <Image src={project.cover.src} alt={project.cover.alt} fill sizes="(min-width: 1280px) 480px, (min-width: 900px) 38vw, 92vw" />
          </ImageReveal>
        </Reveal>
      </div>
    </section>
  );
}
