import { Rss } from 'lucide-react';
import { site } from '@/site.config';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { SplitReveal } from '@/components/ui/split-reveal';

/**
 * Bloque "Suscríbete" honesto (§8.9): hasta que exista proveedor de newsletter
 * ({{PROVEEDOR}}, doble opt-in, RGPD) no hay formulario; se ofrece el RSS y el email.
 */
export function SubscribeBlock() {
  return (
    <section className="section--tight" aria-labelledby="suscribete-title">
      <div className="wrap">
        <div className="card card--soft subscribe">
          <div className="grid gap-5">
            <SectionLabel>Suscríbete</SectionLabel>
            <SplitReveal as="h2" id="suscribete-title" className="h3">
              Recibe las <em className="accent-word text-accent">notas</em> nuevas.
            </SplitReveal>
            <Reveal as="p" className="body text-ink-2 max-w-[52ch]">
              Todavía no tenemos newsletter. Cuando la haya, será con doble opt-in y sin ceder tus datos a nadie. Mientras
              tanto, puedes seguir el laboratorio por RSS o escribirnos y te avisamos cuando publiquemos algo nuevo.
            </Reveal>
          </div>
          <Reveal className="grid gap-3" delay={0.1}>
            <div className="subscribe__actions">
              <Button href="/feed.xml" variant="secondary" external analytics={{ location: 'blog-subscribe', label: 'RSS' }}>
                <Rss aria-hidden="true" className="h-[18px] w-[18px]" />
                Suscríbete por RSS
              </Button>
              <Button
                href={`mailto:${site.email}?subject=${encodeURIComponent('Avísame de los artículos nuevos')}`}
                variant="ghost"
                arrow="up"
                analytics={{ location: 'blog-subscribe', label: 'Email' }}
              >
                Escríbenos
              </Button>
            </div>
            <p className="subscribe__note">Sin formularios de mentira: solo lo que funciona hoy.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
