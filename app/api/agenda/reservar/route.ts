import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { availableSlots, invalidateBusy } from '@/lib/agenda/availability';
import { agendaConfig } from '@/lib/agenda/config';
import { createMeeting, googleConfigured } from '@/lib/agenda/google';
import { bookingSchema, type BookingInput, type BookingResponse } from '@/lib/agenda/schema';
import { computeSlots } from '@/lib/agenda/slots';
import { verifyTurnstile } from '@/lib/agenda/turnstile';
import { consentRecord } from '@/lib/agenda/consent';
import { encajaPresentationPath, getEncajaLanding } from '@/content/encaja';
import { absoluteUrl } from '@/lib/seo';
import { notifyNewLead } from '@/lib/notify';
import { destinationFor, sendLeadToValmeOs } from '@/lib/valme-os';
import { site } from '@/site.config';

/**
 * POST /api/agenda/reservar: honeypot → validación → Turnstile → comprobación del hueco con
 * free/busy al momento → evento en Google Calendar con Google Meet e invitación al cliente.
 * Después registra el lead en Valme OS (CRM, correo con el resumen en PDF y aviso al equipo),
 * avisa por correo (lib/notify.ts) y, si está configurado, lo guarda en Supabase. Nada de eso
 * tumba la reserva: el evento ya está creado.
 *
 * Sin credenciales: en producción responde 503 'config'; en desarrollo simula la reserva
 * (no crea nada) y registra un resumen SIN datos personales. Nunca se escriben datos personales
 * en los logs. Turnstile es obligatorio en producción: sin él cualquiera podría enviar
 * invitaciones desde el calendario del negocio.
 */

export const runtime = 'nodejs';

const isProduction = process.env.NODE_ENV === 'production';

const json = (body: BookingResponse | Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });

const when = (ms: number) =>
  new Intl.DateTimeFormat('es-ES', {
    timeZone: agendaConfig.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));

/** Presentación en PDF de la landing de origen (`encaja-<slug>`), si la tiene. */
function presentationFor(landing?: string) {
  const found = landing?.startsWith('encaja-') ? getEncajaLanding(landing.slice('encaja-'.length)) : undefined;
  return found ? absoluteUrl(encajaPresentationPath(found.slug)) : undefined;
}

function description(d: BookingInput, presentationUrl?: string) {
  return [
    `Llamada de ${agendaConfig.slotMinutes} minutos con AUTOMATO para hablar del proceso que más tiempo te quita.`,
    'Entra desde el enlace de Google Meet de esta invitación.',
    presentationUrl
      ? `\nAntes de la llamada, aquí tienes un resumen de una página con lo que puedes esperar y cómo trabajamos:\n${presentationUrl}\n`
      : '',
    `Si necesitas cambiarla, escríbenos a ${site.email}.`,
    '',
    '—',
    `Nombre: ${d.name}`,
    d.company ? `Empresa: ${d.company}` : '',
    d.phone ? `Teléfono: ${d.phone}` : '',
    d.message ? `\nLo que nos has contado:\n${d.message}` : '',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

async function saveLead(d: BookingInput, start: number) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from('leads').insert({
    audience: 'empresa',
    needs: ['herramienta-interna'],
    message: [`Llamada reservada: ${when(start)}.`, d.message ?? ''].filter(Boolean).join('\n'),
    name: d.name,
    email: d.email,
    company: d.company ?? null,
    phone: d.phone ?? null,
    consent: d.consent,
    source: d.source ?? null,
    utm: d.utm ?? null,
  });
  if (error) console.error('booking_lead_insert_failed', error.code);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot antes de validar (como /api/contact): a un bot se le responde como si hubiera ido bien.
  if (body && typeof body === 'object' && typeof (body as { website?: unknown }).website === 'string') {
    if ((body as { website: string }).website.length > 0) {
      const start = Date.parse(String((body as { start?: unknown }).start ?? '')) || Date.now();
      return json({
        ok: true,
        start: new Date(start).toISOString(),
        end: new Date(start + agendaConfig.slotMinutes * 60000).toISOString(),
      });
    }
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation', issues: z.flattenError(parsed.error) }, 422);
  }
  const d = parsed.data;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const verdict = await verifyTurnstile(d.turnstileToken, ip);
  if (verdict === 'skipped' && isProduction) {
    console.error('agenda_config_missing', 'TURNSTILE_SECRET_KEY');
    return json({ ok: false, error: 'config' }, 503);
  }
  if (verdict === 'fail') return json({ ok: false, error: 'captcha' }, 400);

  const start = Date.parse(d.start);
  const end = start + agendaConfig.slotMinutes * 60000;
  const iso = { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
  const presentationUrl = presentationFor(d.landing);

  if (!googleConfigured()) {
    if (isProduction) {
      console.error('agenda_config_missing', 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN');
      return json({ ok: false, error: 'config' }, 503);
    }
    // Misma comprobación del hueco que en producción, contra el horario sin ocupaciones.
    if (!computeSlots(Date.now(), [], agendaConfig).includes(start)) {
      return json({ ok: false, error: 'slot_taken' }, 409);
    }
    console.info('[agenda] reserva simulada (sin Google, solo desarrollo)', {
      start: iso.start,
      landing: d.landing ?? null,
      hasCompany: Boolean(d.company),
      hasPhone: Boolean(d.phone),
      messageLength: d.message?.length ?? 0,
    });
    return json({ ok: true, ...iso, presentationUrl, mock: true });
  }

  try {
    // El hueco se comprueba con datos frescos: puede haberse ocupado desde que se cargó la página.
    const slots = await availableSlots(Date.now(), { fresh: true });
    if (!slots.includes(start)) return json({ ok: false, error: 'slot_taken' }, 409);

    const meeting = await createMeeting({
      start,
      end,
      timeZone: agendaConfig.timeZone,
      summary: `Llamada con AUTOMATO · ${d.company || d.name}`,
      description: description(d, presentationUrl),
      attendee: { email: d.email, name: d.name },
      privateProps: {
        source: (d.source ?? 'web').slice(0, 200),
        landing: d.landing ?? '',
        utm: d.utm ? JSON.stringify(d.utm).slice(0, 1000) : '',
      },
    });
    invalidateBusy();

    const valme = await sendLeadToValmeOs({
      destination: destinationFor(d.landing),
      name: d.name,
      email: d.email,
      phone: d.phone,
      answers: {
        tipo: 'Llamada reservada',
        llamada: `${when(start)} (hora peninsular)`,
        empresa: d.company,
        mensaje: d.message,
        pagina: d.landing,
        origen: d.source,
      },
      consentText: consentRecord('llamada'),
      attribution: { utm: d.utm, clicks: d.clicks, fbp: d.fbp, fbc: d.fbc, pixelConsent: d.pixelConsent },
    });
    if (valme === 'skipped' && isProduction) console.error('valme_os_config_missing', 'VALME_OS_LANDINGS');

    try {
      await saveLead(d, start);
    } catch {
      console.error('booking_lead_insert_failed');
    }
    await notifyNewLead({
      kind: 'llamada',
      name: d.name,
      email: d.email,
      phone: d.phone,
      company: d.company,
      message: d.message,
      page: d.landing,
      source: d.source,
      utm: d.utm,
      clicks: d.clicks,
      when: when(start),
      meetUrl: meeting.meetUrl,
    });

    return json({ ok: true, ...iso, meetUrl: meeting.meetUrl, presentationUrl });
  } catch (e) {
    console.error('agenda_booking_failed', e instanceof Error ? e.message : 'unknown');
    return json({ ok: false, error: 'calendar' }, 502);
  }
}
