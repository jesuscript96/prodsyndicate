'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { Plus } from 'lucide-react';
import type { FaqItem } from '@/content/types';
import { cn } from '@/lib/utils';

type Props = {
  items: readonly FaqItem[];
  className?: string;
  /** Nivel del encabezado de cada pregunta */
  headingLevel?: 2 | 3 | 4;
  /** Abre la primera por defecto */
  defaultOpenFirst?: boolean;
};

/** Acordeón accesible (Radix): icono + que rota a ×, altura animada (§5.6). El JSON-LD se añade en la página. */
export function FaqAccordion({ items, className, headingLevel = 3, defaultOpenFirst }: Props) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <Accordion.Root
      type="single"
      collapsible
      defaultValue={defaultOpenFirst ? 'item-0' : undefined}
      className={cn('faq', className)}
    >
      {items.map((item, i) => (
        <Accordion.Item key={i} value={`item-${i}`} className="faq__item">
          <Accordion.Header asChild>
            <Heading className="faq__q">
              <Accordion.Trigger className="faq__trigger">
                <span>{item.q}</span>
                <Plus className="faq__icon" aria-hidden="true" />
              </Accordion.Trigger>
            </Heading>
          </Accordion.Header>
          <Accordion.Content className="faq__content">
            <div className="faq__a">
              <p>{item.a}</p>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
