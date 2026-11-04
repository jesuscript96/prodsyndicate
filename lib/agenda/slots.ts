import { isoWeekday, zonedParts, zonedTimeToUtc } from './time';

/** Franjas de un día en hora local: [['10:00', '14:00'], ['16:00', '19:00']]. */
export type DayRanges = readonly (readonly [string, string])[];

export type AgendaConfig = {
  /** Zona horaria del calendario y del horario de llamadas */
  timeZone: string;
  /** Duración de cada llamada */
  slotMinutes: number;
  /** Cada cuántos minutos empieza un hueco */
  stepMinutes: number;
  /** Margen libre antes y después de otros eventos */
  bufferMinutes: number;
  /** Antelación mínima para reservar */
  minNoticeMinutes: number;
  /** Días que se ofrecen, contando hoy */
  daysAhead: number;
  /** Horario por día ISO (1 = lunes … 7 = domingo). Un día sin entrada no tiene huecos. */
  hours: Partial<Record<number, DayRanges>>;
};

export type Interval = { start: number; end: number };

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Huecos libres (inicio en ms UTC, ordenados) desde `now` hasta `daysAhead` días: dentro del
 * horario, con la antelación mínima y sin solaparse con `busy` (ampliado con el margen).
 */
export function computeSlots(now: number, busy: readonly Interval[], cfg: AgendaConfig): number[] {
  const tz = cfg.timeZone;
  const today = zonedParts(now, tz);
  const earliest = now + cfg.minNoticeMinutes * 60000;
  const slotMs = cfg.slotMinutes * 60000;
  const bufferMs = cfg.bufferMinutes * 60000;
  const out: number[] = [];

  for (let i = 0; i < cfg.daysAhead; i++) {
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    for (const [from, to] of cfg.hours[isoWeekday(y, m, d)] ?? []) {
      const last = toMinutes(to) - cfg.slotMinutes;
      for (let mins = toMinutes(from); mins <= last; mins += cfg.stepMinutes) {
        const start = zonedTimeToUtc(y, m, d, Math.floor(mins / 60), mins % 60, tz);
        if (start < earliest) continue;
        const end = start + slotMs;
        if (busy.some((b) => b.start < end + bufferMs && b.end > start - bufferMs)) continue;
        out.push(start);
      }
    }
  }
  return out;
}
