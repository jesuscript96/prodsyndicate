import type { Metadata } from 'next';
import { getAllProjects } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CtaBand } from '@/components/ui/cta-band';
import { PageHero } from '@/components/ui/page-hero';
import { ProjectGrid } from '@/components/projects/project-grid';
import '@/components/projects/projects.css';

/** §8.4 — Title exacto de la guía (el sufijo ` | {{MARCA}}` lo añade buildMetadata). */
export const metadata: Metadata = buildMetadata({
  title: 'Proyectos · Casos de estudio',
  description:
    'Casos de estudio de MVPs, software a medida, automatizaciones y productos creativos para emprendedores y empresas. En cada uno, el reto, lo que hicimos y lo que cambió.',
  path: '/proyectos',
});

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <>
      <div className="wrap projects-crumbs">
        <Breadcrumbs items={[{ name: 'Proyectos', href: '/proyectos' }]} />
      </div>

      <PageHero
        className="projects-hero"
        label="Proyectos"
        title={
          <>
            Proyectos que <em className="accent-word text-accent">funcionan</em>.
          </>
        }
        intro="Productos reales para emprendedores y empresas. Cada caso cuenta el reto, lo que hicimos y lo que cambió."
      />

      <section className="section--tight pt-0" aria-label="Casos de estudio">
        <div className="wrap">
          <ProjectGrid projects={projects} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
