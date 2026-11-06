import { NextResponse } from 'next/server';
import { z } from 'zod';
import { consentRecord } from '@/lib/agenda/consent';
import { contactLeadSchema, type ContactLeadResponse } from '@/lib/agenda/schema';
import { verifyTurnstile } from '@/lib/agenda/turnstile';
import { encajaPresentationPath, getEncajaLanding } from '@/content/encaja';
import { absoluteUrl } from '@/lib/seo';
import { destinationFor, sendLeadToValmeOs, valmeConfigured } from '@/lib/valme-os';

/**
 * POST /api/encaja/contacto: «prefiero que me escribáis» en las landings de Encaja.
 * Honeypot → validación → Turnstile → lead en Valme OS, que lo guarda en el CRM, manda el correo
 * con el resumen en PDF de la landing y avisa al equipo. Devuelve el enlace al PDF para la
 * pantalla de confirmación.
 *
 * Sin Valme OS configurado: en producción responde 503 'config' (el formulario ofrece el email);
 * en desarrollo simula el envío. Nunca se escriben datos personales en los logs.
 */

export const runtime = 'nodejs';

const isProduction = process.env.NODE_ENV === 'production';

const json = (body: ContactLeadResponse | Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });

function presentationFor(landing?: string) {
  const found = landing?.startsWith('encaja-') ? getEncajaLanding(landing.slice('encaja-'.length)) : undefined;
  return found ? absoluteUrl(encajaPresentationPath(found.slug)) : undefined;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot: a un bot se le responde como si hubiera ido bien.
  if (body && typeof body === 'object' && typeof (body as { website?: unknown }).website === 'string') {
    if ((body as { website: string }).website.length > 0) return json({ ok: true });
  }

  const parsed = contactLeadSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation', issues: z.flattenError(parsed.error) }, 422);
  }
  const d = parsed.data;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const verdict = await verifyTurnstile(d.turnstileToken, ip);
  if (verdict === 'skipped' && isProduction) {
    console.error('contact_lead_config_missing', 'TURNSTILE_SECRET_KEY');
    return json({ ok: false, error: 'config' }, 503);
  }
  if (verdict === 'fail') return json({ ok: false, error: 'captcha' }, 400);

  const presentationUrl = presentationFor(d.landing);
  const destination = destinationFor(d.landing);

  if (!valmeConfigured(destination)) {
    if (isProduction) {
      console.error('valme_os_config_missing', 'VALME_OS_LANDINGS');
      return json({ ok: false, error: 'config' }, 503);
    }
    console.info('[contacto] lead simulado (sin Valme OS, solo desarrollo)', {
      landing: d.landing ?? null,
      hasCompany: Boolean(d.company),
      hasPhone: Boolean(d.phone),
      messageLength: d.message?.length ?? 0,
    });
    return json({ ok: true, presentationUrl, mock: true });
  }

  const result = await sendLeadToValmeOs({
    destination,
    name: d.name,
    email: d.email,
    phone: d.phone,
    answers: {
      tipo: 'Quiere que le escribamos',
      empresa: d.company,
      mensaje: d.message,
      pagina: d.landing,
      origen: d.source,
    },
    consentText: consentRecord('contacto'),
    attribution: { utm: d.utm, clicks: d.clicks, fbp: d.fbp, fbc: d.fbc, pixelConsent: d.pixelConsent },
  });
  if (result !== 'ok') return json({ ok: false, error: 'server' }, 502);

  return json({ ok: true, presentationUrl });
}
