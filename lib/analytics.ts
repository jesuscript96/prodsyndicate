/** Eventos de analítica (§13.1). Nunca enviar datos personales. */
export type EventName =
  | 'hero_chapter'
  | 'cta_click'
  | 'form_start'
  | 'form_step'
  | 'form_submit'
  | 'form_error'
  | 'calendar_open'
  | 'scroll_depth'
  // Asistente de las landings de Encaja: nunca el texto de la conversación
  | 'chat_open'
  | 'chat_message'
  | 'chat_slots'
  | 'chat_handoff'
  | 'chat_error';

type Props = Record<string, string | number | boolean>;

/** Leads que cuentan como conversión en GTM (`generate_lead` con `lead_type`). */
export type LeadType = 'llamada' | 'contacto';

declare global {
  interface Window {
    dataLayer?: unknown[];
    plausible?: (name: string, opts?: { props?: Props }) => void;
    umami?: { track: (name: string, data?: Props) => void };
  }
}

/**
 * Evento del embudo: va a Google Tag Manager como `web_<nombre>` (la etiqueta de GA4 del embudo
 * escucha `^web_`) y, si estuvieran cargados, a Plausible o Umami. GTM respeta el consentimiento.
 */
export function track(name: EventName, props?: Props) {
  if (typeof window === 'undefined') return;
  window.dataLayer?.push({ event: `web_${name}`, ...props });
  if (window.plausible) window.plausible(name, props ? { props } : undefined);
  else if (window.umami) window.umami.track(name, props);
  else if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', name, props ?? '');
  }
}

/**
 * Lead conseguido: `generate_lead` en GTM, del que salen las conversiones de Google Ads
 * («Llamada reservada» o «Contacto enviado», según `lead_type`) y el evento de GA4.
 */
export function trackLead(leadType: LeadType, landing: string) {
  if (typeof window === 'undefined') return;
  window.dataLayer?.push({ event: 'generate_lead', lead_type: leadType, landing });
}
