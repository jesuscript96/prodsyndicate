import type { FaqItem } from '@/content/types';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { JsonLd } from '@/components/ui/json-ld';
import { faqJsonLd } from '@/lib/seo';
import { SectionHead } from './section-head';

type Props = { items: readonly FaqItem[]; n?: string; intro?: string };

/** FAQ específica de página: cabecera + acordeón + JSON-LD FAQPage (§8.1). */
export function PageFaq({ items, n, intro }: Props) {
  if (!items.length) return null;
  return (
    <section className="section" aria-labelledby="page-faq-title">
      <div className="wrap grid gap-10 hero:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] hero:items-start">
        <SectionHead
          n={n}
          id="page-faq-title"
          className="mb-0"
          copy={{ label: 'FAQ', title: { before: 'Preguntas ', accent: 'frecuentes', after: '' }, intro }}
        />
        <FaqAccordion items={items} headingLevel={3} />
      </div>
      <JsonLd data={faqJsonLd(items)} />
    </section>
  );
}
