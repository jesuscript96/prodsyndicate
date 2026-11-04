/**
 * Fechas en una zona horaria concreta sin dependencias: Intl da la hora local de un instante y,
 * a la inversa, convertimos una hora local («martes 10:30 en Madrid») a un instante UTC,
 * resolviendo los cambios de horario de verano.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number };

/** Fecha y hora locales de un instante (ms) en `timeZone`. */
export function zonedParts(ms: number, timeZone: string): ZonedParts {
  const parts = formatter(timeZone).formatToParts(new Date(ms));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

/** Desfase de `timeZone` respecto a UTC en un instante, en minutos (Madrid: 60 o 120). */
export function offsetMinutes(ms: number, timeZone: string): number {
  const p = zonedParts(ms, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round((asUtc - Math.floor(ms / 60000) * 60000) / 60000);
}

/** Instante UTC (ms) de una hora local en `timeZone`. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = offsetMinutes(guess, timeZone);
  const ms = guess - first * 60000;
  const second = offsetMinutes(ms, timeZone);
  return second === first ? ms : guess - second * 60000;
}

/** Día de la semana ISO (1 = lunes … 7 = domingo) de una fecha de calendario. */
export function isoWeekday(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return d === 0 ? 7 : d;
}
