import { faq } from '@/content/faq';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { SectionHead } from './section-head';
import './sections.css';

/** Sección 10 · FAQ (`06 — Preguntas`, §6.9): acordeón con content/faq.ts. El JSON-LD FAQPage lo añade la página. */
export function FaqSection() {
  return (
    <section id="preguntas" className="section content-auto" aria-labelledby="home-faq-title">
      <div className="wrap faq-grid">
        <SectionHead
          n="06"
          label="Preguntas"
          id="home-faq-title"
          title={
            <>
              Antes de escribirnos, <em className="accent-word text-accent">quizá</em> te ayude esto.
            </>
          }
        />
        <FaqAccordion items={faq} headingLevel={3} />
      </div>
    </section>
  );
}
