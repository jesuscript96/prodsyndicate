import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ImageReveal } from '@/components/ui/image-reveal';
import { SplitReveal } from '@/components/ui/split-reveal';
import { LineIllustration } from './line-illustration';
import './sections.css';

const audiences = [
  {
    href: '/emprendedores',
    label: 'Para emprendedores',
    title: 'Emprendedores',
    text: 'Validamos tu idea y construimos el MVP que necesitas para salir al mercado.',
    variant: 'idea',
  },
  {
    href: '/empresas',
    label: 'Para empresas',
    title: 'Empresas',
    text: 'Software, herramientas internas y automatizaciones que encajan con cómo trabaja tu equipo.',
    variant: 'business',
  },
] as const;

/**
 * Sección 2 · Para quién construimos (§6.9).
 * CONTRATO Hero ↔ Home: `id="inicio-contenido"` es el destino del enlace
 * "Saltar la animación" del hero. Dos tarjetas grandes con ImageReveal e
 * ilustración de línea que se dibuja al entrar.
 */
export function AudienceSection() {
  return (
    <section
      id="inicio-contenido"
      className="section outline-none"
      aria-labelledby="home-audience-title"
      tabIndex={-1}
    >
      <div className="wrap">
        <div className="sec-head">
          <SplitReveal as="h2" id="home-audience-title" className="h2">
            Para quien <em className="accent-word">tiene una idea</em> y para quien tiene un{' '}
            <em className="accent-word text-accent">negocio</em> que mover.
          </SplitReveal>
        </div>
        <ul className="audience-grid">
          {audiences.map((a) => (
            <li key={a.href}>
              <article className="audience-card card">
                <ImageReveal className="audience-card__media" radius={24}>
                  <div className="audience-card__canvas">
                    <LineIllustration variant={a.variant} />
                  </div>
                </ImageReveal>
                <div className="audience-card__body">
                  <p className="label">{a.label}</p>
                  <h3 className="h3">
                    <Link href={a.href} className="audience-card__link">
                      {a.title}
                    </Link>
                  </h3>
                  <p className="audience-card__text">{a.text}</p>
                  <span className="audience-card__more" aria-hidden="true">
                    <ArrowUpRight />
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
