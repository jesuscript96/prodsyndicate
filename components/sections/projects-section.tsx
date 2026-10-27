import { getFeaturedProjects } from '@/lib/content';
import { LinkArrow } from '@/components/ui/link-arrow';
import { ProjectCard } from '@/components/ui/project-card';
import { SectionHead } from './section-head';
import { ProjectsRail } from './projects-rail';
import './sections.css';

/**
 * Sección 5 · Proyectos (`02 — Proyectos`, §6.9): hasta 6 proyectos destacados
 * (content/projects/*.mdx) en un rail horizontal. Sin proyectos publicados,
 * solo H2 + enlace a /proyectos.
 */
export function ProjectsSection() {
  const projects = getFeaturedProjects(6);

  const head = (
    <div className="sec-head__row">
      <SectionHead
        n="02"
        label="Proyectos"
        id="home-projects-title"
        title={
          <>
            Producto real, <em className="accent-word text-accent">resultados</em> reales.
          </>
        }
      />
      <LinkArrow href="/proyectos" className="sec-head__aside">
        Ver todos los proyectos
      </LinkArrow>
    </div>
  );

  if (!projects.length) {
    return (
      <section id="proyectos" className="section" aria-labelledby="home-projects-title">
        <div className="wrap">{head}</div>
      </section>
    );
  }

  return (
    <ProjectsRail head={head}>
      {projects.map((project) => (
        <li key={project.slug} className="rail__item">
          <ProjectCard project={project} sizes="(min-width: 900px) 27vw, 80vw" headingLevel={3} />
        </li>
      ))}
    </ProjectsRail>
  );
}
