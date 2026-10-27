import type { Metadata } from 'next';
import { empresasPage } from '@/content/company';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CtaBand } from '@/components/ui/cta-band';
import { PageHero } from '@/components/ui/page-hero';
import { AccentTitle } from '@/components/company/accent-title';
import { PageFaq } from '@/components/company/page-faq';
import { PillarGrid } from '@/components/company/pillar-grid';
import { RelatedCases } from '@/components/company/related-cases';
import { SectionHead } from '@/components/company/section-head';
import { buildMetadata } from '@/lib/seo';
import '@/components/company/company.css';

export const metadata: Metadata = buildMetadata(empresasPage.meta);

/** /empresas (§8.7): problemas, cómo trabajamos con equipos, entregables, seguridad y cumplimiento, casos, FAQ, CTA "Agenda una llamada". */
export default function EmpresasPage() {
  const p = empresasPage;
  return (
    <>
      <PageHero
        label={p.hero.label}
        title={<AccentTitle parts={p.hero.h1} />}
        intro={p.hero.intro}
        cta={p.hero.cta}
        secondary={p.hero.secondary}
        analyticsLocation="empresas-hero"
      />
      <div className="wrap">
        <Breadcrumbs items={p.crumbs} className="co-crumbs" />
      </div>

      <section className="section" aria-labelledby="problems-title">
        <div className="wrap">
          <SectionHead n="01" id="problems-title" copy={p.problems} />
          <PillarGrid items={p.problems.items} columns={2} soft />
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="how-title">
        <div className="wrap">
          <SectionHead n="02" id="how-title" copy={p.howWeWork} />
          <PillarGrid items={p.howWeWork.items} variant="rows" />
        </div>
      </section>

      <section className="section bg-paper-2" aria-labelledby="deliverables-title">
        <div className="wrap">
          <SectionHead n="03" id="deliverables-title" copy={p.deliverables} />
          <PillarGrid items={p.deliverables.items} columns={3} headingLevel={4} />
        </div>
      </section>

      <section className="section" aria-labelledby="security-title">
        <div className="wrap">
          <SectionHead n="04" id="security-title" copy={p.security} />
          <PillarGrid items={p.security.items} columns={4} soft headingLevel={4} />
        </div>
      </section>

      <RelatedCases service="software-a-medida" n={2} label="05" copy={p.cases} />

      <PageFaq n="06" items={p.faq} />

      <CtaBand primary={p.cta.primary} secondary={p.cta.secondary} />
    </>
  );
}
