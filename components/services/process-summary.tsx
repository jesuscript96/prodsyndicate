import { processSteps } from '@/content/process';
import { Reveal } from '@/components/ui/reveal';
import './services.css';

/** Proceso resumido en 5 pasos (§8.2 sección 5), con `processSteps` de content/process.ts. */
export function ProcessSummary() {
  return (
    <ol className="process-summary" aria-label="Proceso en cinco pasos">
      {processSteps.map((step, i) => (
        <Reveal key={step.n} as="li" delay={i * 0.06}>
          <span className="label">{step.n}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </Reveal>
      ))}
    </ol>
  );
}
