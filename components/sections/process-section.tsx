import { processSteps } from '@/content/process';
import { SectionHead } from './section-head';
import { ProcessTimeline } from './process-timeline';
import './sections.css';

/** Sección 6 · Proceso (`03 — Proceso`, §6.9): 5 pasos de content/process.ts con números grandes en serif cursiva. */
export function ProcessSection() {
  return (
    <section id="proceso" className="section" aria-labelledby="home-process-title">
      <div className="wrap">
        <SectionHead
          n="03"
          label="Proceso"
          id="home-process-title"
          title={
            <>
              Un camino <em className="accent-word text-accent">claro</em>, de la primera llamada al lanzamiento.
            </>
          }
        />
        <ProcessTimeline>
          {processSteps.map((step) => (
            <li key={step.n} className="timeline__step">
              <span className="accent-word timeline__n" aria-hidden="true">
                {step.n}
              </span>
              <div className="timeline__body">
                <h3 className="h3">{step.title}</h3>
                <p className="body-l timeline__text">{step.text}</p>
              </div>
            </li>
          ))}
        </ProcessTimeline>
      </div>
    </section>
  );
}
