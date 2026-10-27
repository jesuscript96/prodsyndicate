import { techStack } from '@/content/process';
import { Marquee } from '@/components/ui/marquee';
import { Reveal } from '@/components/ui/reveal';
import { SectionHead } from './section-head';
import './sections.css';

/** Sección 7 · Tecnología con criterio (`04 — Tecnología`, §6.9): H2 + texto y marquesina con techStack en monocromo. */
export function TechSection() {
  return (
    <section id="tecnologia" className="section" aria-labelledby="home-tech-title">
      <div className="wrap">
        <div className="sec-head__row">
          <SectionHead
            n="04"
            label="Tecnología"
            id="home-tech-title"
            title={
              <>
                Herramientas elegidas por <em className="accent-word text-accent">criterio</em>, no por moda.
              </>
            }
          />
          <Reveal as="p" className="body-l text-ink-2 sec-head__side" delay={0.1}>
            Usamos la tecnología que mejor encaja con tu producto: código a medida cuando hace falta, plataformas
            no-code o low-code cuando aceleran sin atarte.
          </Reveal>
        </div>
      </div>
      <Marquee items={techStack} label="Tecnologías que usamos" duration={40} className="tech-marquee" />
    </section>
  );
}
