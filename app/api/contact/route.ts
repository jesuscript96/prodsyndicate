import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  AUDIENCE_OPTIONS,
  BUDGET_OPTIONS,
  NEED_OPTIONS,
  STAGE_OPTIONS,
  TIMELINE_OPTIONS,
  contactSchema,
  type ContactInput,
} from '@/lib/validators';
import { consentRecord } from '@/lib/agenda/consent';
import { notifyNewLead, type NoticeResult } from '@/lib/notify';
import { sendLeadToValmeOs, valmeConfigured, type ValmeResult } from '@/lib/valme-os';

/**
 * POST /api/contact (§9.3): verificación Turnstile → validación zod → lead en
 * Valme OS (landing «web» de VALME_OS_LANDINGS: CRM y aviso al equipo), aviso
 * por correo (lib/notify.ts) y, si está configurado, copia en Supabase. Basta
 * con que llegue por una de las tres vías.
 *
 * Degradación en desarrollo (NODE_ENV !== 'production'):
 * - sin TURNSTILE_SECRET_KEY se omite la verificación;
 * - sin ninguna de las tres vías se registra en consola un resumen SIN datos
 *   personales y se responde ok:true.
 * En producción, sin ninguna se responde 500 'config'.
 * Nunca se escriben datos personales en los logs.
 */

export const runtime = 'nodejs';

const isProduction = process.env.NODE_ENV === 'production';

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

const label = (options: readonly { value: string; label: string }[], value: string | undefined) =>
  options.find((o) => o.value === value)?.label ?? value ?? '—';

/** Resultado de la verificación antispam. `skipped` solo ocurre en desarrollo sin clave. */
async function verifyTurnstile(token: string, ip?: string): Promise<'ok' | 'fail' | 'skipped'> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return 'skipped';
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return data.success ? 'ok' : 'fail';
  } catch {
    console.error('turnstile_verify_unreachable');
    return 'fail';
  }
}

/** Resumen apto para logs: nada de nombre, email, empresa, teléfono, mensaje ni enlaces. */
function safeSummary(d: ContactInput) {
  return {
    audience: d.audience,
    needs: d.needs,
    stage: d.stage,
    timeline: d.timeline,
    budget: d.budget ?? null,
    messageLength: d.message?.length ?? 0,
    linksCount: d.links?.length ?? 0,
    hasCompany: Boolean(d.company),
    hasPhone: Boolean(d.phone),
    source: d.source ?? null,
    utmKeys: d.utm ? Object.keys(d.utm) : [],
  };
}

/** Lead en Valme OS con las respuestas del asistente en texto legible. */
function sendToValme(d: ContactInput): Promise<ValmeResult> {
  if (!valmeConfigured('web')) return Promise.resolve('skipped');
  return sendLeadToValmeOs({
    destination: 'web',
    name: d.name,
    email: d.email,
    phone: d.phone,
    answers: {
      tipo: 'Formulario de contacto',
      perfil: label(AUDIENCE_OPTIONS, d.audience),
      necesita: d.needs.map((n) => label(NEED_OPTIONS, n)).join(', '),
      etapa: label(STAGE_OPTIONS, d.stage),
      plazo: label(TIMELINE_OPTIONS, d.timeline),
      presupuesto: d.budget ? label(BUDGET_OPTIONS, d.budget) : undefined,
      empresa: d.company,
      mensaje: d.message,
      enlaces: d.links?.join(' '),
      pagina: '/contacto',
      origen: d.source,
    },
    consentText: consentRecord('formulario'),
    attribution: { utm: d.utm, clicks: d.clicks, fbp: d.fbp, fbc: d.fbc, pixelConsent: d.pixelConsent },
  });
}

/** Aviso por correo (lib/notify.ts) con las respuestas del asistente en texto legible. */
function notify(d: ContactInput): Promise<NoticeResult> {
  return notifyNewLead({
    kind: 'formulario',
    name: d.name,
    email: d.email,
    phone: d.phone,
    company: d.company,
    message: d.message,
    page: '/contacto',
    source: d.source,
    utm: d.utm,
    clicks: d.clicks,
    details: [
      ['Perfil', label(AUDIENCE_OPTIONS, d.audience)],
      ['Necesita', d.needs.map((n) => label(NEED_OPTIONS, n)).join(', ')],
      ['Etapa', label(STAGE_OPTIONS, d.stage)],
      ['Plazo', label(TIMELINE_OPTIONS, d.timeline)],
      ['Presupuesto', d.budget ? label(BUDGET_OPTIONS, d.budget) : undefined],
      ['Enlaces', d.links?.join(' ')],
    ],
  });
}

/** Copia en Supabase (tabla public.leads), si está configurado. */
async function saveToSupabase(d: ContactInput): Promise<'ok' | 'skipped' | 'error'> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return 'skipped';
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from('leads').insert({
    audience: d.audience,
    needs: d.needs,
    stage: d.stage,
    timeline: d.timeline,
    budget: d.budget ?? null,
    message: d.message ?? null,
    links: d.links ?? null,
    name: d.name,
    email: d.email,
    company: d.company ?? null,
    phone: d.phone ?? null,
    consent: d.consent,
    source: d.source ?? null,
    utm: d.utm ?? null,
  });
  if (error) {
    console.error('lead_insert_failed', error.code); // sin datos personales en logs
    return 'error';
  }
  return 'ok';
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot: si viene relleno, simulamos éxito y no hacemos nada. Se comprueba
  // ANTES de validar: el esquema exige que llegue vacío y un bot recibiría un 422
  // que delata la trampa.
  if (
    body &&
    typeof body === 'object' &&
    'website' in body &&
    typeof (body as { website: unknown }).website === 'string' &&
    (body as { website: string }).website.length > 0
  ) {
    return json({ ok: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation', issues: z.flattenError(parsed.error) }, 422);
  }
  const d = parsed.data;

  // Antispam
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const verdict = await verifyTurnstile(d.turnstileToken, ip);
  if (verdict === 'skipped' && isProduction) {
    console.error('contact_config_missing', 'TURNSTILE_SECRET_KEY');
    return json({ ok: false, error: 'config' }, 500);
  }
  if (verdict === 'fail') return json({ ok: false, error: 'captcha' }, 400);

  // Valme OS, aviso por correo y, si está configurado, Supabase. Basta con que llegue por una vía.
  const [valme, notice, stored] = await Promise.all([sendToValme(d), notify(d), saveToSupabase(d)]);
  if (valme === 'ok' || notice === 'ok' || stored === 'ok') return json({ ok: true });

  if (valme === 'skipped' && notice === 'skipped' && stored === 'skipped') {
    if (!isProduction) {
      console.info('[contact] lead recibido (sin Valme OS, aviso ni Supabase, solo desarrollo)', safeSummary(d));
      return json({ ok: true });
    }
    console.error('contact_config_missing', 'VALME_OS_LANDINGS / RESEND_API_KEY / SUPABASE_URL');
    return json({ ok: false, error: 'config' }, 500);
  }
  return json({ ok: false, error: 'server' }, 500);
}
