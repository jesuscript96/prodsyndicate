import Image from 'next/image';
import Link from 'next/link';
import type { ProjectMeta } from '@/content/types';
import { cn } from '@/lib/utils';
import { Chip } from './chip';
import { ImageReveal } from './image-reveal';

type Props = {
  project: ProjectMeta;
  className?: string;
  priority?: boolean;
  sizes?: string;
  headingLevel?: 2 | 3;
};

/** Imagen 4:3 con ImageReveal, etiquetas, título y año; hover con etiqueta "Ver" (§5.6). */
export function ProjectCard({
  project,
  className,
  priority,
  sizes = '(min-width: 1024px) 45vw, 90vw',
  headingLevel = 3,
}: Props) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const href = `/proyectos/${project.slug}`;
  return (
    <article className={cn('project-card', className)}>
      <Link href={href} className="project-card__link" aria-label={`Ver caso: ${project.title}`} tabIndex={-1}>
        <ImageReveal className="project-card__media" radius={24}>
          <Image src={project.cover.src} alt={project.cover.alt} fill sizes={sizes} priority={priority} />
        </ImageReveal>
        <span className="project-card__hover" aria-hidden="true">
          <span>Ver</span>
        </span>
      </Link>
      <div className="grid gap-2">
        <div className="project-card__tags">
          {project.isConcept && <Chip tone="neutral">Caso de concepto</Chip>}
          {project.services.slice(0, 2).map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
        <Heading className="h3 project-card__title">
          <Link href={href}>{project.title}</Link>
        </Heading>
        <p className="label">
          {/* En los casos de concepto el chip ya lo dice: no repetir "Caso de concepto" como cliente */}
          {project.client && !project.isConcept ? `${project.client} · ` : ''}
          {project.year}
        </p>
      </div>
    </article>
  );
}
