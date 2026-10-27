import type { Pillar } from '@/content/company';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';
import './company.css';

type Props = {
  items: readonly Pillar[];
  /** cards: tarjetas; rows: filas con hairline; quotes: cita en serif + respuesta */
  variant?: 'cards' | 'rows' | 'quotes';
  columns?: 2 | 3 | 4;
  /** Tarjetas sobre fondo paper-2 (sin sombra) */
  soft?: boolean;
  headingLevel?: 3 | 4;
  className?: string;
};

/** Lista de pilares (principios, problemas, entregables…) como tarjetas, filas o citas. */
export function PillarGrid({ items, variant = 'cards', columns = 2, soft, headingLevel = 3, className }: Props) {
  const Heading = headingLevel === 3 ? 'h3' : 'h4';
  const headingClass = headingLevel === 3 ? 'h3' : 'h4';

  if (variant === 'rows') {
    const plain = !items.some((it) => it.n);
    return (
      <ol className={cn('co-rows', className)}>
        {items.map((it, i) => (
          <Reveal as="li" key={it.title} className={cn('co-row', plain && 'co-row--plain')} delay={i * 0.05}>
            {!plain && <span className="co-row__n" aria-hidden="true">{it.n}</span>}
            <Heading className={cn(headingClass, 'co-row__title')}>{it.title}</Heading>
            {it.text && <p className="co-row__text">{it.text}</p>}
          </Reveal>
        ))}
      </ol>
    );
  }

  if (variant === 'quotes') {
    return (
      <ul className={cn('co-grid co-grid--loose', `co-grid--${columns}`, className)}>
        {items.map((it, i) => (
          <Reveal as="li" key={it.title} className="card card--soft co-quote" delay={i * 0.06}>
            <Heading className="co-quote__q">{it.title}</Heading>
            {it.text && <p className="co-quote__a">{it.text}</p>}
          </Reveal>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn('co-grid', `co-grid--${columns}`, className)}>
      {items.map((it, i) => (
        <Reveal as="li" key={it.title} className={cn('card co-pillar', soft && 'card--soft')} delay={i * 0.06}>
          {it.n && <span className="co-pillar__n" aria-hidden="true">{it.n}</span>}
          <Heading className={cn(headingClass, 'co-pillar__title')}>{it.title}</Heading>
          {it.text && <p className="co-pillar__text">{it.text}</p>}
        </Reveal>
      ))}
    </ul>
  );
}
