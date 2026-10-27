import type { Metadata } from 'next';
import { CalendarFacade } from '@/components/forms/calendar-facade';
import { ContactWizard } from '@/components/forms/contact-wizard';
import { LinkArrow } from '@/components/ui/link-arrow';
import { PageHero } from '@/components/ui/page-hero';
import { getLatestPosts } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { site } from '@/site.config';
import '@/components/forms/forms.css';

/** ⚠️ "menos de un día laborable": solo si es un compromiso real (TODO.md). */
const INTRO = 'En dos minutos nos cuentas lo esencial. Te respondemos en menos de un día laborable.';

export const metadata: Metadata = buildMetadata({
  title: 'Contacto · Cuéntanos tu idea',
  description: INTRO,
  path: '/contacto',
});

/** "Qué pasa después" en 3 pasos (§8.10), texto exacto. */
const AFTER_STEPS = [
  'Leemos tu brief',
  'Te escribimos con preguntas o proponemos llamada',
  'Recibes una propuesta clara',
] as const;

/**
 * /contacto (§8.10): izquierda, el asistente de 6 pasos; derecha (sticky),
 * "¿Prefieres hablar?" con la agenda (id="agenda", destino de /contacto#agenda),
 * email directo y "Qué pasa después". Sin CtaBand: la página es la conversión.
 */
export default function ContactPage() {
  const posts = getLatestPosts(2);

  return (
    <>
      <PageHero
        label="Contacto"
        title={
          <>
            Cuéntanos tu <em className="accent-word text-accent">idea</em>.
          </>
        }
        intro={INTRO}
      />

      <section className="contact-section">
        <div className="wrap contact-grid">
          <ContactWizard posts={posts} />

          <aside className="contact-aside" aria-labelledby="agenda-title">
            <div id="agenda" className="card card--soft contact-aside__card">
              <div className="contact-aside__block">
                <h2 id="agenda-title" className="h3">
                  ¿Prefieres hablar?
                </h2>
                <p className="body text-ink-2">Elige un hueco y lo vemos en una llamada corta.</p>
                <CalendarFacade from="contact-aside" />
              </div>

              <div className="contact-aside__block">
                <p className="label">Email directo</p>
                <LinkArrow href={`mailto:${site.email}`}>{site.email}</LinkArrow>
              </div>

              <div className="contact-aside__block">
                <h3 className="h4">Qué pasa después</h3>
                <ol className="after-steps">
                  {AFTER_STEPS.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
