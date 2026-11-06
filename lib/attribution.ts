/**
 * Origen de la visita para adjuntarlo a un lead (solo navegador). `UtmCapture` guarda al aterrizar
 * los `utm_*`, los identificadores de clic de los anuncios (gclid, gbraid, wbraid, fbclid) y el
 * dominio de procedencia en sessionStorage; aquí se leen al enviar un formulario, junto con las
 * cookies del píxel de Meta (`_fbp`, `_fbc`) y la decisión del aviso de cookies.
 */

export const CLICK_ID_PARAMS = ['gclid', 'gbraid', 'wbraid', 'fbclid'] as const;

export type ClientAttribution = {
  utm?: Record<string, string>;
  clicks?: Record<string, string>;
  source?: string;
  fbp?: string;
  fbc?: string;
  pixelConsent?: boolean | null;
};

function readRecord(key: string, maxKey: number, maxValue: number): Record<string, string> | undefined {
  const raw = sessionStorage.getItem(key);
  if (!raw) return undefined;
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === 'string' && v) out[k.slice(0, maxKey)] = v.slice(0, maxValue);
  }
  return Object.keys(out).length ? out : undefined;
}

function cookie(name: string): string | undefined {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)).slice(0, 400) : undefined;
}

export function readAttribution(): ClientAttribution {
  const out: ClientAttribution = {};
  try {
    out.utm = readRecord('utm', 60, 200);
    out.clicks = readRecord('clicks', 20, 400);
    const source = sessionStorage.getItem('source');
    if (source) out.source = source.slice(0, 200);
  } catch {
    /* sessionStorage no disponible */
  }
  try {
    const decision = localStorage.getItem('valme_cookies');
    out.pixelConsent = decision === 'granted' ? true : decision === 'denied' ? false : null;
  } catch {
    out.pixelConsent = null;
  }
  try {
    if (out.pixelConsent) {
      out.fbp = cookie('_fbp');
      out.fbc = cookie('_fbc');
    }
  } catch {
    /* cookies no disponibles */
  }
  return out;
}
