import { Chip } from '@/components/ui/chip';
import { cn } from '@/lib/utils';
import './projects.css';

/**
 * Aviso visible de caso de concepto (§8.4, regla de honestidad): explica en una frase
 * qué significa, para que nadie lo confunda con un encargo real.
 */
export function ConceptNotice({ className }: { className?: string }) {
  return (
    <aside className={cn('concept-notice', className)} role="note" aria-label="Aviso: caso de concepto">
      <Chip tone="neutral" className="concept-notice__chip">
        Caso de concepto
      </Chip>
      <p>
        Este caso no corresponde a un cliente real: es un ejercicio de diseño y arquitectura que muestra cómo
        abordamos un proyecto de este tipo. El reto, las decisiones y el resultado describen cómo lo haríamos; por
        eso no verás nombres de empresas ni cifras.
      </p>
    </aside>
  );
}
