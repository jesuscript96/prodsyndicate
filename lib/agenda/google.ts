import type { Interval } from './slots';

/**
 * Google Calendar por REST con OAuth (refresh token de la cuenta dueña del calendario), sin SDK.
 * Variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN y, opcional,
 * GOOGLE_CALENDAR_ID (por defecto «primary») y GOOGLE_BUSY_CALENDARS (más calendarios, separados
 * por comas, que también cuentan como ocupado). Cómo obtenerlas: docs/agenda-google.md.
 * Solo servidor: nunca importar desde un componente de cliente.
 */

const API = 'https://www.googleapis.com/calendar/v3';

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

const calendarId = () => process.env.GOOGLE_CALENDAR_ID || 'primary';

export class GoogleCalendarError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? '',
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !data.access_token) {
    // invalid_grant: el refresh token ha caducado o se ha revocado (ver docs/agenda-google.md)
    throw new GoogleCalendarError(`token:${data.error ?? res.status}`, res.status);
  }
  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cached.token;
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...init.headers },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { status?: string; message?: string } };
    throw new GoogleCalendarError(`calendar:${res.status}:${body.error?.status ?? ''}`, res.status);
  }
  return (await res.json()) as T;
}

/** Intervalos ocupados entre `from` y `to` (ms) en el calendario principal y los adicionales. */
export async function busyIntervals(from: number, to: number): Promise<Interval[]> {
  const ids = [calendarId(), ...(process.env.GOOGLE_BUSY_CALENDARS ?? '').split(',')]
    .map((s) => s.trim())
    .filter(Boolean);
  type FreeBusy = {
    calendars: Record<string, { busy?: { start: string; end: string }[]; errors?: { reason: string }[] }>;
  };
  const data = await call<FreeBusy>('/freeBusy', {
    method: 'POST',
    body: JSON.stringify({
      timeMin: new Date(from).toISOString(),
      timeMax: new Date(to).toISOString(),
      items: ids.map((id) => ({ id })),
    }),
  });
  const out: Interval[] = [];
  for (const id of ids) {
    const cal = data.calendars[id];
    // Un calendario que no se puede leer no se ignora: sin saber si está libre, no se ofrece nada.
    if (!cal || cal.errors?.length) throw new GoogleCalendarError(`freebusy:${cal?.errors?.[0]?.reason ?? 'missing'}`);
    for (const b of cal.busy ?? []) out.push({ start: Date.parse(b.start), end: Date.parse(b.end) });
  }
  return out;
}

export type NewMeeting = {
  start: number;
  end: number;
  timeZone: string;
  summary: string;
  description: string;
  attendee: { email: string; name: string };
  /** Datos internos (origen, landing): no los ven los invitados */
  privateProps?: Record<string, string>;
};

/**
 * Crea el evento con enlace de Google Meet e invita al cliente: Google le envía la invitación
 * por email (sendUpdates=all) desde la cuenta dueña del calendario.
 */
export async function createMeeting(m: NewMeeting): Promise<{ id: string; meetUrl?: string }> {
  type Created = {
    id: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
  };
  const created = await call<Created>(
    `/calendars/${encodeURIComponent(calendarId())}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: 'POST',
      body: JSON.stringify({
        summary: m.summary,
        description: m.description,
        start: { dateTime: new Date(m.start).toISOString(), timeZone: m.timeZone },
        end: { dateTime: new Date(m.end).toISOString(), timeZone: m.timeZone },
        attendees: [{ email: m.attendee.email, displayName: m.attendee.name }],
        guestsCanInviteOthers: false,
        guestsCanSeeOtherGuests: false,
        reminders: { useDefault: true },
        extendedProperties: m.privateProps ? { private: m.privateProps } : undefined,
        conferenceData: {
          createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
        },
      }),
    },
  );
  const video = created.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri;
  return { id: created.id, meetUrl: created.hangoutLink ?? video };
}
