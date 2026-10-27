import type { CSSProperties } from 'react';
import { services } from '@/content/services';
import { LinkArrow } from '@/components/ui/link-arrow';
import { ServiceIcon } from '@/components/ui/service-icon';
import { SectionHead } from './section-head';
import { ServicesStack } from './services-stack';
import './sections.css';

/** Sección 4 · Servicios (`01 — Servicios`, §6.9): 4 tarjetas grandes con los datos de content/services.ts, sticky apiladas en escritorio. */
export function ServicesSection() {
  return (
    <section id="servicios" className="section" aria-labelledby="home-services-title">
      <div className="wrap">
        <SectionHead
          n="01"
          label="Servicios"
          id="home-services-title"
          title={
            <>
              Todo lo que hace falta para <em className="accent-word text-accent">lanzar</em> un producto.
            </>
          }
        />
        <ServicesStack>
          {services.map((service, i) => (
            <li key={service.slug} className="svc-stack__item" style={{ ['--i' as string]: i } as CSSProperties}>
              <article className="svc-card">
                <div className="svc-card__top">
                  <span className="label">{String(i + 1).padStart(2, '0')}</span>
                  <span className="svc-card__icon">
                    <ServiceIcon name={service.icon} size={24} />
                  </span>
                </div>
                <div className="svc-card__body">
                  <h3 className="svc-card__title">{service.title}</h3>
                  <p className="body-l svc-card__text">{service.card}</p>
                </div>
                <div className="svc-card__foot">
                  <LinkArrow href={`/servicios/${service.slug}`}>Ver servicio</LinkArrow>
                </div>
              </article>
            </li>
          ))}
        </ServicesStack>
      </div>
    </section>
  );
}
