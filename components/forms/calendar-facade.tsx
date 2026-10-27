'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { site } from '@/site.config';

type Props = {
  /** Origen para `calendar_open` (p. ej. 'contact-aside', 'contact-success') */
  from: string;
  label?: string;
  className?: string;
};

/**
 * Fachada de la agenda (§8.10): el iframe de Cal.com/Calendly solo se carga al
 * pulsar "Abrir agenda" y dispara `calendar_open`. Sin `site.calendarUrl`
 * configurada muestra el email directo con una nota breve.
 */
export function CalendarFacade({ from, label = 'Abrir agenda', className }: Props) {
  const [open, setOpen] = useState(false);
  const url = site.calendarUrl;

  if (!url) {
    return (
      <div className={cn('calendar-facade', className)}>
        <p className="body text-ink-2">Mientras conectamos la agenda, escríbenos y buscamos un hueco.</p>
        <Button
          href={`mailto:${site.email}`}
          variant="secondary"
          arrow="up"
          analytics={{ location: from, label: 'Email directo' }}
        >
          {site.email}
        </Button>
      </div>
    );
  }

  const openCalendar = () => {
    setOpen(true);
    track('calendar_open', { from });
  };

  return (
    <div className={cn('calendar-facade', className)}>
      {open ? (
        <div className="calendar-facade__frame">
          <iframe
            src={url}
            title="Agenda una llamada"
            loading="lazy"
            allow="payment"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <Button onClick={openCalendar} arrow aria-expanded={false}>
          {label}
        </Button>
      )}
      <p className="calendar-facade__alt">
        ¿No carga?{' '}
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => track('calendar_open', { from: `${from}-tab` })}>
          Abrir la agenda en una pestaña nueva
        </a>
        .
      </p>
    </div>
  );
}
