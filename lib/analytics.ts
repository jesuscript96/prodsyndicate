/** Eventos de analítica sin cookies (§13.1). Nunca enviar datos personales. */
export type EventName =
  | 'hero_chapter'
  | 'cta_click'
  | 'form_start'
  | 'form_step'
  | 'form_submit'
  | 'form_error'
  | 'calendar_open'
  | 'scroll_depth';

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (name: string, opts?: { props?: Props }) => void;
    umami?: { track: (name: string, data?: Props) => void };
  }
}

export function track(name: EventName, props?: Props) {
  if (typeof window === 'undefined') return;
  if (window.plausible) window.plausible(name, props ? { props } : undefined);
  else if (window.umami) window.umami.track(name, props);
  else if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', name, props ?? '');
  }
}
