import type { Metadata } from 'next';
import { emprendedoresPage } from '@/content/company';
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

export const metadata: Metadata = buildMetadata(emprendedoresPage.meta);

/** /emprendedores (§8.6): 4 dolores, 3 rutas de trabajo, casos (MVP), FAQ, CTA "Cuéntanos tu idea". */
export default function EmprendedoresPage() {
  const p = emprendedoresPage;
  return (
    <>
      <PageHero
        label={p.hero.label}
        title={<AccentTitle parts={p.hero.h1} />}
        intro={p.hero.intro}
        cta={p.hero.cta}
        secondary={p.hero.secondary}
        analyticsLocation="emprendedores-hero"
      />
      <div className="wrap">
        <Breadcrumbs items={p.crumbs} className="co-crumbs" />
      </div>

      <section className="section" aria-labelledby="pains-title">
        <div className="wrap">
          <SectionHead n="01" id="pains-title" copy={p.pains} />
          <PillarGrid items={p.pains.items} variant="quotes" columns={2} />
        </div>
      </section>

      <section className="section bg-paper-2" aria-labelledby="routes-title">
        <div className="wrap">
          <SectionHead n="02" id="routes-title" copy={p.routes} />
          <PillarGrid items={p.routes.items} columns={3} />
        </div>
      </section>

      <RelatedCases service="mvp" n={2} label="03" copy={p.cases} />

      <PageFaq n="04" items={p.faq} />

      <CtaBand primary={p.cta.primary} />
    </>
  );
}
