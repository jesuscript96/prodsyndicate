import { Check } from 'lucide-react';
import { services } from '@/content/services';
import { serviceDetails } from '@/content/services-detail';
import { LinkArrow } from '@/components/ui/link-arrow';
import { Reveal } from '@/components/ui/reveal';
import { ServiceIcon } from '@/components/ui/service-icon';
import { cn } from '@/lib/utils';
import { ServiceIllustration } from './service-illustration';
import './services.css';

/** "Las 4 líneas" (§8.2 sección 2): tarjetas grandes alternando ilustración a izquierda/derecha. */
export function ServiceLines() {
  return (
    <div className="service-lines">
      {services.map((s, i) => {
        const detail = serviceDetails[s.slug];
        return (
          <Reveal
            key={s.slug}
            as="article"
            className={cn('service-line', i % 2 === 1 && 'service-line--flip')}
            aria-labelledby={`line-${s.slug}`}
          >
            <div className="service-line__media">
              <ServiceIllustration slug={s.slug} />
            </div>
            <div className="service-line__body">
              <div className="flex items-center gap-3">
                <span className="service-card__icon">
                  <ServiceIcon name={s.icon} />
                </span>
                <span className="label">0{i + 1}</span>
              </div>
              <h3 id={`line-${s.slug}`} className="h3">
                {s.title}
              </h3>
              <p className="body-l text-ink-2">{s.card}</p>
              <ul className="service-line__points">
                {detail.highlights.map((p) => (
                  <li key={p}>
                    <Check aria-hidden="true" strokeWidth={1.75} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <LinkArrow href={`/servicios/${s.slug}`} className="w-fit">
                Ver {s.shortTitle}
              </LinkArrow>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
