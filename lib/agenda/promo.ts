import { agendaConfig } from './config';
import { isoWeekday, zonedParts, zonedTimeToUtc } from './time';

/**
 * Promoción «Llévate tu prototipo GRATIS» (docs/encaja/asistente.md): el prototipo se prepara
 * antes de la llamada con lo que se cuenta en el chat de Mr. Tomate, así que la llamada de la
 * promoción es, como pronto, a 3 días laborables. Navegador y servidor.
 */

export const PROMO_BUSINESS_DAYS = 3;

/** Inicio (00:00, hora de Madrid) del tercer día laborable a partir de hoy. Sin festivos. */
export function promoMinStart(now: number = Date.now()): number {
  const tz = agendaConfig.timeZone;
  const p = zonedParts(now, tz);
  // Mediodía UTC del día de hoy en Madrid: sumar días así no se tuerce con el cambio de hora.
  let cursor = Date.UTC(p.year, p.month - 1, p.day, 12);
  let added = 0;
  while (added < PROMO_BUSINESS_DAYS) {
    cursor += 86_400_000;
    const d = new Date(cursor);
    if (isoWeekday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()) <= 5) added++;
  }
  const d = new Date(cursor);
  return zonedTimeToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), 0, 0, tz);
}
