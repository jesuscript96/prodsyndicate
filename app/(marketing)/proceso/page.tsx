import type { Metadata } from 'next';
import { procesoPage } from '@/content/company';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CtaBand } from '@/components/ui/cta-band';
import { PageHero } from '@/components/ui/page-hero';
import { AccentTitle } from '@/components/company/accent-title';
import { PageFaq } from '@/components/company/page-faq';
import { PillarGrid } from '@/components/company/pillar-grid';
import { ProcessTimeline } from '@/components/company/process-timeline';
import { SectionHead } from '@/components/company/section-head';
import { buildMetadata } from '@/lib/seo';
import '@/components/company/company.css';

export const metadata: Metadata = buildMetadata(procesoPage.meta);

/** /proceso (§8.5): timeline ampliada de 5 fases, cómo colaboramos, principios, qué esperamos de ti, garantías y soporte, FAQ, CTA. */
export default function ProcesoPage() {
  const p = procesoPage;
  return (
    <>
      <PageHero
        label={p.hero.label}
        title={<AccentTitle parts={p.hero.h1} />}
        intro={p.hero.intro}
        cta={p.hero.cta}
        analyticsLocation="proceso-hero"
      />
      <div className="wrap">
        <Breadcrumbs items={p.crumbs} className="co-crumbs" />
      </div>

      <section className="section" aria-labelledby="process-timeline-title">
        <div className="wrap">
          <ProcessTimeline n="01" copy={p.timeline} phases={p.phases} labels={p.phaseLabels} />
        </div>
      </section>

      <section className="section bg-paper-2" aria-labelledby="collab-title">
        <div className="wrap">
          <SectionHead n="02" id="collab-title" copy={p.collaboration} />
          <PillarGrid items={p.collaboration.items} columns={4} />
        </div>
      </section>

      <section className="section" aria-labelledby="principles-title">
        <div className="wrap">
          <SectionHead n="03" id="principles-title" copy={p.principles} />
          <PillarGrid items={p.principles.items} columns={2} soft />
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="expect-title">
        <div className="wrap">
          <SectionHead n="04" id="expect-title" copy={p.expectations} />
          <PillarGrid items={p.expectations.items} variant="rows" />
        </div>
      </section>

      <section className="section" aria-labelledby="support-title">
        <div className="wrap">
          <SectionHead n="05" id="support-title" copy={p.guarantees} />
          <PillarGrid items={p.guarantees.items} columns={2} />
        </div>
      </section>

      <PageFaq n="06" items={p.faq} />

      <CtaBand primary={p.cta.primary} secondary={p.cta.secondary} />
    </>
  );
}
