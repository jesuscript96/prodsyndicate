import type { ServiceSummary } from '@/content/types';
import { cn } from '@/lib/utils';
import { LinkArrow } from './link-arrow';
import { ServiceIcon } from './service-icon';

type Props = {
  service: ServiceSummary;
  className?: string;
  headingLevel?: 2 | 3;
};

/** Tarjeta con icono de línea, título, descripción y LinkArrow (§5.6). */
export function ServiceCard({ service, className, headingLevel = 3 }: Props) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className={cn('service-card', className)}>
      <span className="service-card__icon">
        <ServiceIcon name={service.icon} />
      </span>
      <Heading className="h3">{service.title}</Heading>
      <p className="text-ink-2">{service.card}</p>
      <LinkArrow href={`/servicios/${service.slug}`} className="mt-1">
        Ver servicio
      </LinkArrow>
    </article>
  );
}
