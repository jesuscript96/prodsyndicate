import { site } from '@/site.config';

/**
 * Envío de leads a Valme OS (POST /api/leads), donde quedan en el CRM de AUTOMATO, se manda el
 * correo de seguimiento con el resumen en PDF de la landing y se avisa al equipo.
 *
 * Cada página de la web es una «landing» dada de alta en Valme OS con este dominio como origen
 * permitido. Sus ids viven en `VALME_OS_LANDINGS`, un JSON del tipo
 * `{"tiempo":"<uuid>","procesos":"<uuid>","crecer":"<uuid>","web":"<uuid>"}`.
 *
 * Solo servidor: la web verifica Turnstile antes de llamar aquí, así que la ruta de Valme OS
 * nunca queda expuesta al navegador. Nunca se escriben datos personales en los logs.
 */

export type LeadDestination = 'tiempo' | 'procesos' | 'crecer' | 'web';

export type Attribution = {
  utm?: Record<string, string>;
  clicks?: Record<string, string>;
  fbp?: string;
  fbc?: string;
  /** Si aceptó las cookies de publicidad (para la API de conversiones de Meta). */
  pixelConsent?: boolean | null;
};

export type ValmeLead = {
  destination: LeadDestination;
  name: string;
  email?: string;
  phone?: string;
  /** Respuestas sueltas: tipo de lead, empresa, mensaje, hueco… Valme OS acepta textos de hasta 500 caracteres. */
  answers: Record<string, string | undefined>;
  consentText: string;
  attribution?: Attribution;
};

export type ValmeResult = 'ok' | 'skipped' | 'error';

const DEFAULT_URL = 'https://www.valmesolutions.com/api/leads';
const TIMEOUT_MS = 8000;

function landingIds(): Partial<Record<LeadDestination, string>> {
  const raw = process.env.VALME_OS_LANDINGS;
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Partial<Record<LeadDestination, string>>) : {};
  } catch {
    console.error('valme_os_config_invalid', 'VALME_OS_LANDINGS');
    return {};
  }
}

/** Landing de Valme OS para una página `encaja-<slug>` o para el formulario general. */
export function destinationFor(landing?: string): LeadDestination {
  const slug = landing?.startsWith('encaja-') ? landing.slice('encaja-'.length) : undefined;
  return slug === 'tiempo' || slug === 'procesos' || slug === 'crecer' ? slug : 'web';
}

export function valmeConfigured(destination: LeadDestination) {
  return Boolean(landingIds()[destination]);
}

const clip = (v: string | undefined, max: number) => (v ? v.trim().slice(0, max) : undefined);

export async function sendLeadToValmeOs(lead: ValmeLead): Promise<ValmeResult> {
  const landingId = landingIds()[lead.destination];
  if (!landingId) return 'skipped';

  // Valme OS acepta respuestas de hasta 500 caracteres: un texto más largo se reparte en
  // `clave`, `clave (2)`… para no perder nada (el mensaje admite hasta 1000).
  const answers: Record<string, string> = {};
  for (const [k, v] of Object.entries(lead.answers)) {
    const value = v?.trim();
    if (!value) continue;
    for (let i = 0; i * 500 < value.length && i < 4; i++) {
      answers[i === 0 ? k : `${k} (${i + 1})`] = value.slice(i * 500, (i + 1) * 500);
    }
  }
  const a = lead.attribution ?? {};
  const utm = a.utm ?? {};
  const clicks = a.clicks ?? {};

  const body = {
    landingId,
    name: clip(lead.name, 120),
    email: clip(lead.email, 200),
    phone: clip(lead.phone, 30),
    answers,
    consent: true,
    consentText: lead.consentText.slice(0, 2000),
    utm_source: clip(utm.utm_source, 120),
    utm_medium: clip(utm.utm_medium, 120),
    utm_campaign: clip(utm.utm_campaign, 200),
    utm_content: clip(utm.utm_content, 200),
    utm_term: clip(utm.utm_term, 200),
    gclid: clip(clicks.gclid, 400),
    gbraid: clip(clicks.gbraid, 400),
    wbraid: clip(clicks.wbraid, 400),
    fbclid: clip(clicks.fbclid, 400),
    fbp: clip(a.fbp, 200),
    fbc: clip(a.fbc, 400),
    pixelConsent: typeof a.pixelConsent === 'boolean' ? a.pixelConsent : null,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(process.env.VALME_OS_LEADS_URL || DEFAULT_URL, {
      method: 'POST',
      // Valme OS solo acepta envíos de los orígenes dados de alta en la landing.
      headers: { 'content-type': 'application/json', origin: site.url },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('valme_os_lead_failed', res.status);
      return 'error';
    }
    return 'ok';
  } catch (e) {
    console.error('valme_os_lead_failed', e instanceof Error ? e.name : 'unknown');
    return 'error';
  } finally {
    clearTimeout(timer);
  }
}
