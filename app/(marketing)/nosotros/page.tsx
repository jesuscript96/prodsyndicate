import type { Metadata } from 'next';
import { nosotrosPage } from '@/content/company';
import { techStack } from '@/content/process';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CtaBand } from '@/components/ui/cta-band';
import { Marquee } from '@/components/ui/marquee';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { SplitReveal } from '@/components/ui/split-reveal';
import { AbstractAvatar } from '@/components/company/abstract-avatar';
import { AccentTitle } from '@/components/company/accent-title';
import { PageFaq } from '@/components/company/page-faq';
import { PillarGrid } from '@/components/company/pillar-grid';
import { SectionHead } from '@/components/company/section-head';
import { buildMetadata } from '@/lib/seo';
import '@/components/company/company.css';

export const metadata: Metadata = buildMetadata(nosotrosPage.meta);

/** /nosotros (§8.8): manifiesto, 4 principios, equipo (ficha única), colaboradores, stack (marquesina), FAQ, CTA "Hablemos". */
export default function NosotrosPage() {
  const p = nosotrosPage;
  return (
    <>
      <PageHero
        label={p.hero.label}
        title={<AccentTitle parts={p.hero.h1} />}
        intro={p.hero.intro}
        cta={p.hero.cta}
        secondary={p.hero.secondary}
        analyticsLocation="nosotros-hero"
      />
      <div className="wrap">
        <Breadcrumbs items={p.crumbs} className="co-crumbs" />
      </div>

      <section className="section" aria-labelledby="manifesto-text">
        <div className="wrap grid gap-8">
          <SectionLabel n="01">{p.manifesto.label}</SectionLabel>
          <SplitReveal as="p" id="manifesto-text" className="co-manifesto">
            {p.manifesto.text}
          </SplitReveal>
        </div>
      </section>

      <section className="section bg-paper-2" aria-labelledby="principles-title">
        <div className="wrap">
          <SectionHead n="02" id="principles-title" copy={p.principles} />
          <PillarGrid items={p.principles.items} columns={4} />
        </div>
      </section>

      <section className="section" aria-labelledby="team-title">
        <div className="wrap">
          <SectionHead n="03" id="team-title" copy={p.team} />
          <Reveal className="card co-team">
            <AbstractAvatar />
            <div className="grid gap-4">
              <h3 className="h3 max-w-[22ch]">{p.team.lead.headline}</h3>
              <p className="label">
                {p.team.lead.name} · {p.team.lead.role}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="collab-title">
        <div className="wrap">
          <SectionHead n="04" id="collab-title" copy={p.collaborators} />
          <PillarGrid items={p.collaborators.items} columns={4} soft headingLevel={4} />
        </div>
      </section>

      <section className="section hairline" aria-labelledby="stack-title">
        <div className="wrap">
          <SectionHead n="05" id="stack-title" copy={p.stack} />
        </div>
        <Marquee items={techStack} label="Tecnologías y herramientas que usamos" duration={40} />
      </section>

      <PageFaq n="06" items={p.faq} />

      <CtaBand primary={p.cta.primary} />
    </>
  );
}
