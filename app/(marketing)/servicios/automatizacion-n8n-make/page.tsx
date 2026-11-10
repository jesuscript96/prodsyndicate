import type { Metadata } from 'next';
import { n8nMakePage } from '@/content/automatizacion-n8n-make';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CtaBand } from '@/components/ui/cta-band';
import { JsonLd } from '@/components/ui/json-ld';
import { LinkArrow } from '@/components/ui/link-arrow';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { AccentTitle } from '@/components/company/accent-title';
import { PageFaq } from '@/components/company/page-faq';
import { PillarGrid } from '@/components/company/pillar-grid';
import { RelatedCases } from '@/components/company/related-cases';
import { SectionHead } from '@/components/company/section-head';
import { buildMetadata, serviceJsonLd } from '@/lib/seo';
import '@/components/company/company.css';

export const metadata: Metadata = buildMetadata(n8nMakePage.meta);

/** /servicios/automatizacion-n8n-make: problemas, para quién, n8n o Make, cómo trabajamos, estándares, casos, FAQ, CTA. */
export default function AutomatizacionN8nMakePage() {
  const p = n8nMakePage;
  return (
    <>
      <PageHero
        label={p.hero.label}
        title={<AccentTitle parts={p.hero.h1} />}
        intro={p.hero.intro}
        cta={p.hero.cta}
        secondary={p.hero.secondary}
        analyticsLocation="n8n-make-hero"
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

      <section className="section section--tight" aria-labelledby="forwho-title">
        <div className="wrap">
          <SectionHead n="02" id="forwho-title" copy={p.forWho} />
          <PillarGrid items={p.forWho.items} columns={3} />
        </div>
      </section>

      <section className="section bg-paper-2" aria-labelledby="choose-title">
        <div className="wrap">
          <SectionHead n="03" id="choose-title" copy={p.choose} />
          <PillarGrid items={p.choose.items} columns={4} headingLevel={4} />
          <Reveal className="pt-8">
            <LinkArrow href={p.choose.guide.href}>{p.choose.guide.label}</LinkArrow>
          </Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="wrap">
          <SectionHead n="04" id="how-title" copy={p.howWeWork} />
          <PillarGrid items={p.howWeWork.items} variant="rows" />
          <Reveal className="pt-8">
            <LinkArrow href="/servicios/automatizacion-ia">Ver el servicio de automatización e IA</LinkArrow>
          </Reveal>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="standards-title">
        <div className="wrap">
          <SectionHead n="05" id="standards-title" copy={p.standards} />
          <PillarGrid items={p.standards.items} columns={3} soft headingLevel={4} />
        </div>
      </section>

      <RelatedCases service="automatizacion-ia" n={2} label="06" copy={p.cases} />

      <PageFaq n="07" items={p.faq} />

      <CtaBand primary={p.cta.primary} secondary={p.cta.secondary} />

      <JsonLd
        data={serviceJsonLd({
          name: p.service.name,
          description: p.meta.description,
          path: p.meta.path,
          serviceType: p.service.serviceType,
        })}
      />
    </>
  );
}
