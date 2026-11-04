import { agendaConfig } from './config';
import { busyIntervals } from './google';
import { computeSlots, type Interval } from './slots';

const DAY = 86_400_000;
const MEMO_MS = 60_000;

/** Caché de un minuto: varias visitas seguidas no hacen una consulta a Google cada una. */
let memo: { at: number; busy: Interval[] } | null = null;

export function invalidateBusy() {
  memo = null;
}

/** Huecos libres a partir de ahora. `fresh` ignora la caché (al reservar). */
export async function availableSlots(now: number, { fresh = false } = {}): Promise<number[]> {
  let busy: Interval[];
  if (!fresh && memo && now - memo.at < MEMO_MS) {
    busy = memo.busy;
  } else {
    busy = await busyIntervals(now, now + (agendaConfig.daysAhead + 1) * DAY);
    memo = { at: now, busy };
  }
  return computeSlots(now, busy, agendaConfig);
}
