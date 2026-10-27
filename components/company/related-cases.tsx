import type { SectionCopy } from '@/content/company';
import type { ServiceSlug } from '@/content/types';
import { LinkArrow } from '@/components/ui/link-arrow';
import { ProjectCard } from '@/components/ui/project-card';
import { Reveal } from '@/components/ui/reveal';
import { getProjectsForService } from '@/lib/content';
import { SectionHead } from './section-head';
import './company.css';

type Props = { service: ServiceSlug; n?: number; label?: string; copy: SectionCopy };

/** Casos relacionados con un servicio (condicional: si no hay MDX, no se renderiza). */
export function RelatedCases({ service, n = 2, label, copy }: Props) {
  const projects = getProjectsForService(service, n);
  if (!projects.length) return null;
  return (
    <section className="section" aria-labelledby="related-cases-title">
      <div className="wrap">
        <SectionHead
          n={label}
          id="related-cases-title"
          copy={copy}
          aside={<LinkArrow href="/proyectos">Ver todos los proyectos</LinkArrow>}
        />
        <ul className="co-grid co-grid--2 co-grid--loose">
          {projects.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={i * 0.08}>
              <ProjectCard project={p} sizes="(min-width: 900px) 45vw, 90vw" />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
