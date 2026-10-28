import type { Metadata } from 'next';
import { site } from '@/site.config';
import { buildMetadata, faqJsonLd } from '@/lib/seo';
import { faq } from '@/content/faq';
import { HeroStory } from '@/components/hero/hero-story';
import { CtaBand } from '@/components/ui/cta-band';
import { JsonLd } from '@/components/ui/json-ld';
import { AudienceSection } from '@/components/sections/audience-section';
import { ManifestoSection } from '@/components/sections/manifesto-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ProjectsSection } from '@/components/sections/projects-section';
import { ProcessSection } from '@/components/sections/process-section';
import { TechSection } from '@/components/sections/tech-section';
import { LabSection } from '@/components/sections/lab-section';
import { FaqSection } from '@/components/sections/faq-section';
import { ContentAutoRefresh } from '@/components/sections/content-auto-refresh';
import { PencilTrail } from '@/components/props/pencil-trail';
import { ServiceProps } from '@/components/props/service-props';
import { DepthField } from '@/components/props/depth-field';

/** SEO de la home (§6). El título ya incluye la marca: buildMetadata no añade sufijo. */
export const metadata: Metadata = buildMetadata({
  title: `${site.name} · Productos digitales a medida para emprendedores y empresas`,
  description:
    'Diseñamos y construimos MVPs, software a medida y automatizaciones con IA. De la idea al lanzamiento, con diseño de alto nivel y desarrollo eficiente.',
  path: '/',
  image: '/og/poster-last.png',
});

/**
 * Home (§6): hero fijado con storytelling (sección 1) + secciones 2–11 (§6.9).
 * Único <h1> de la página: el del hero.
 * Tras el hero, objetos 3D por scroll (components/props):
 *  · Para quién + Manifiesto, y Proceso + Tecnología: el lápiz del hero sigue dibujando una línea
 *    sobre las secciones y se queda parado a la izquierda al final de cada tramo.
 *  · 01 — Servicios: cada tarjeta lleva su objeto 3D girando en lugar del icono.
 *  · 02 — Proyectos, y Laboratorio + Preguntas: piezas que flotan a distintas profundidades.
 */
export default function HomePage() {
  return (
    <>
      {/* 1 · Hero con storytelling 3D (components/hero). Incluye "Saltar la animación" → #inicio-contenido */}
      <HeroStory />
      <PencilTrail route="intro">
        {/* 2 · Para quién construimos (id="inicio-contenido") */}
        <AudienceSection />
        {/* 3 · Manifiesto */}
        <ManifestoSection />
      </PencilTrail>
      {/* 4 · 01 — Servicios */}
      <ServiceProps>
        <ServicesSection />
      </ServiceProps>
      {/* 5 · 02 — Proyectos */}
      <DepthField count={5}>
        <ProjectsSection />
      </DepthField>
      <PencilTrail route="process">
        {/* 6 · 03 — Proceso */}
        <ProcessSection />
        {/* 7 · 04 — Tecnología */}
        <TechSection />
      </PencilTrail>
      {/*
        8 · Prueba social: OMITIDA a propósito (§6.9 sección 8). Solo se añade con
        testimonios reales (cita, nombre, cargo, empresa, permiso) y/o StatCounter
        con cifras verificables. Nunca placeholders con números inventados.
      */}
      <DepthField count={7} seed={3}>
        {/* 9 · 05 — Laboratorio (se oculta si no hay artículos) */}
        <LabSection />
        {/* 10 · 06 — Preguntas */}
        <FaqSection />
      </DepthField>
      {/* 11 · Banda CTA con eco del último frame del hero */}
      <CtaBand />
      <JsonLd data={faqJsonLd(faq)} />
      <ContentAutoRefresh />
    </>
  );
}
