import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
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
import { sendLeadToValmeOs, valmeConfigured, type ValmeResult } from '@/lib/valme-os';

/**
 * POST /api/contact (§9.3): verificación Turnstile → validación zod → lead en
 * Valme OS (landing «web» de VALME_OS_LANDINGS: CRM y aviso al equipo) y, si
 * está configurado, en Supabase → aviso por email (Resend, best effort).
 * Basta con que uno de los dos guarde el lead.
 *
 * Degradación en desarrollo (NODE_ENV !== 'production'):
 * - sin TURNSTILE_SECRET_KEY se omite la verificación;
 * - sin Valme OS ni Supabase se registra en consola un resumen SIN datos
 *   personales y se responde ok:true.
 * En producción, sin ninguno de los dos se responde 500 'config'.
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

async function notifyByEmail(d: ContactInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to) return;

  const resend = new Resend(apiKey);
  const lines = [
    `Nombre: ${d.name}`,
    `Email: ${d.email}`,
    d.company ? `Empresa: ${d.company}` : '',
    d.phone ? `Teléfono: ${d.phone}` : '',
    `Perfil: ${label(AUDIENCE_OPTIONS, d.audience)}`,
    `Necesita: ${d.needs.map((n) => label(NEED_OPTIONS, n)).join(', ')}`,
    `Etapa: ${label(STAGE_OPTIONS, d.stage)}`,
    `Plazo: ${label(TIMELINE_OPTIONS, d.timeline)}`,
    d.budget ? `Presupuesto: ${label(BUDGET_OPTIONS, d.budget)}` : '',
    d.source ? `Origen: ${d.source}` : '',
    d.utm && Object.keys(d.utm).length
      ? `UTM: ${Object.entries(d.utm)
          .map(([k, v]) => `${k}=${v}`)
          .join(' · ')}`
      : '',
    '',
    d.message ?? '',
    d.links?.length ? `\nEnlaces:\n${d.links.join('\n')}` : '',
  ];

  await resend.emails.send({
    from,
    to,
    replyTo: d.email,
    subject: `Nuevo lead: ${d.name} (${label(AUDIENCE_OPTIONS, d.audience)})`,
    text: lines.filter(Boolean).join('\n'),
  });
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

  // Persistencia: Valme OS y, si está configurado, Supabase. Basta con uno.
  const valme = await sendToValme(d);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    if (valme === 'ok' || (valme === 'skipped' && !isProduction)) {
      if (valme === 'skipped') console.info('[contact] lead recibido (sin Valme OS ni Supabase, solo desarrollo)', safeSummary(d));
      try {
        await notifyByEmail(d);
      } catch {
        console.error('lead_email_failed');
      }
      return json({ ok: true });
    }
    if (valme === 'skipped') {
      console.error('contact_config_missing', 'VALME_OS_LANDINGS / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
      return json({ ok: false, error: 'config' }, 500);
    }
    return json({ ok: false, error: 'server' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
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
    if (valme !== 'ok') return json({ ok: false, error: 'server' }, 500);
  }

  // Aviso por email: best effort (el lead ya está guardado).
  try {
    await notifyByEmail(d);
  } catch {
    console.error('lead_email_failed');
  }

  return json({ ok: true });
}
