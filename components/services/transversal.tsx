import { BarChart3, Gauge, PenTool, Wrench } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import './services.css';

/** Transversal a todo (§8.2 sección 3): UX/UI · Calidad y rendimiento · Analítica · Mantenimiento. */
const items = [
  { icon: PenTool, title: 'UX/UI', text: 'Investigación, flujos e interfaz cuidada en todo lo que hacemos.' },
  { icon: Gauge, title: 'Calidad y rendimiento', text: 'Pruebas, accesibilidad y velocidad medida en dispositivos reales.' },
  { icon: BarChart3, title: 'Analítica', text: 'Medición sin cookies para saber qué se usa y qué no.' },
  { icon: Wrench, title: 'Mantenimiento', text: 'Seguimos contigo después del lanzamiento con un plan acordado.' },
] as const;

export function Transversal() {
  return (
    <ul className="transversal" aria-label="Capacidades transversales">
      {items.map(({ icon: Icon, title, text }, i) => (
        <Reveal key={title} as="li" className="transversal__item" delay={i * 0.06}>
          <span className="transversal__icon">
            <Icon strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h3 className="h4">{title}</h3>
          <p className="text-ink-2">{text}</p>
        </Reveal>
      ))}
    </ul>
  );
}
