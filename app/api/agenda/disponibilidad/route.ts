import { NextResponse } from 'next/server';
import { availableSlots } from '@/lib/agenda/availability';
import { agendaConfig } from '@/lib/agenda/config';
import { googleConfigured } from '@/lib/agenda/google';
import type { AvailabilityResponse } from '@/lib/agenda/schema';
import { computeSlots } from '@/lib/agenda/slots';

/**
 * GET /api/agenda/disponibilidad: huecos libres para una llamada de 30 minutos, calculados con el
 * horario de lib/agenda/config.ts menos lo ocupado en Google Calendar (free/busy, sin leer eventos).
 * En desarrollo sin credenciales de Google devuelve el horario completo marcado `mock`.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isProduction = process.env.NODE_ENV === 'production';

const json = (body: AvailabilityResponse, status = 200) =>
  NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });

export async function GET() {
  const now = Date.now();
  const base = { timeZone: agendaConfig.timeZone, slotMinutes: agendaConfig.slotMinutes };
  const toIso = (list: number[]) => list.map((ms) => new Date(ms).toISOString());

  if (!googleConfigured()) {
    if (isProduction) {
      console.error('agenda_config_missing', 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN');
      return json({ ok: false, error: 'config' }, 503);
    }
    return json({ ok: true, ...base, slots: toIso(computeSlots(now, [], agendaConfig)), mock: true });
  }

  try {
    return json({ ok: true, ...base, slots: toIso(await availableSlots(now)) });
  } catch (e) {
    console.error('agenda_freebusy_failed', e instanceof Error ? e.message : 'unknown');
    return json({ ok: false, error: 'calendar' }, 502);
  }
}
