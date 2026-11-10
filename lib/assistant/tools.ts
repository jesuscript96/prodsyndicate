import { availableSlots } from '@/lib/agenda/availability';
import { agendaConfig } from '@/lib/agenda/config';
import { googleConfigured } from '@/lib/agenda/google';
import { computeSlots } from '@/lib/agenda/slots';
import { zonedParts } from '@/lib/agenda/time';
import type { ToolDef } from './deepseek';

/**
 * Herramientas del asistente. No reserva nada: propone huecos reales de la agenda (los mismos
 * que /api/agenda/disponibilidad) y la página los enseña como botones que llevan a la agenda con
 * el hueco ya elegido. La reserva la confirma el visitante en el formulario, con su
 * consentimiento y Turnstile. Solo servidor.
 */

export const TOOLS: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'proponer_huecos',
      description:
        'Busca huecos libres para la llamada de 30 minutos y los enseña en la página como botones. Úsala cuando el visitante quiera la llamada o pregunte cuándo podéis hablar.',
      parameters: {
        type: 'object',
        properties: {
          franja: {
            type: 'string',
            enum: ['mañana', 'tarde', 'cualquiera'],
            description: 'Franja que prefiere el visitante, si la ha dicho. Si no, «cualquiera».',
          },
          dia: {
            type: 'string',
            description: 'Día concreto que pide, en formato AAAA-MM-DD (hora de España). Vacío si no ha pedido uno.',
          },
        },
        required: ['franja'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mostrar_formulario',
      description:
        'Enseña un botón que lleva al formulario de la página: «llamada» para ver la agenda completa, «contacto» para dejar sus datos y que le escriban.',
      parameters: {
        type: 'object',
        properties: { modo: { type: 'string', enum: ['llamada', 'contacto'] } },
        required: ['modo'],
      },
    },
  },
];

const TZ = agendaConfig.timeZone;
const isProduction = process.env.NODE_ENV === 'production';
const MAX_SLOTS = 4;

const dayKey = (ms: number) => {
  const p = zonedParts(ms, TZ);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
};

const label = new Intl.DateTimeFormat('es-ES', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

async function allSlots(now: number): Promise<{ slots: number[]; mock: boolean }> {
  if (googleConfigured()) return { slots: await availableSlots(now), mock: false };
  if (isProduction) return { slots: [], mock: false };
  return { slots: computeSlots(now, [], agendaConfig), mock: true };
}

/**
 * Elige hasta 4 huecos: si pide un día, repartidos en ese día; si no, el primero de cada día
 * para que tenga dónde elegir sin una lista larga.
 */
export function pickSlots(slots: number[], franja: string, dia?: string): number[] {
  const inRange = slots.filter((s) => {
    const h = zonedParts(s, TZ).hour;
    return franja === 'mañana' ? h < 14 : franja === 'tarde' ? h >= 14 : true;
  });
  const wanted = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? inRange.filter((s) => dayKey(s) === dia) : [];
  if (wanted.length) {
    const step = Math.max(1, Math.floor(wanted.length / MAX_SLOTS));
    return wanted.filter((_, i) => i % step === 0).slice(0, MAX_SLOTS);
  }
  const perDay: number[] = [];
  const seen = new Set<string>();
  for (const s of inRange) {
    const k = dayKey(s);
    if (seen.has(k)) continue;
    seen.add(k);
    perDay.push(s);
    if (perDay.length === MAX_SLOTS) break;
  }
  return perDay;
}

export type ToolOutcome = {
  /** Lo que se le devuelve al modelo */
  result: string;
  slots?: { slots: string[]; mock: boolean };
  form?: 'llamada' | 'contacto';
};

type RunOptions = {
  now?: number;
  /** Primer instante reservable (la oferta del prototipo empieza a 3 días laborables) */
  minStart?: number;
};

export async function runTool(name: string, rawArgs: string, { now = Date.now(), minStart }: RunOptions = {}): Promise<ToolOutcome> {
  let args: Record<string, unknown> = {};
  try {
    args = rawArgs ? (JSON.parse(rawArgs) as Record<string, unknown>) : {};
  } catch {
    /* argumentos mal formados: se usan los valores por defecto */
  }

  if (name === 'proponer_huecos') {
    const franja = typeof args.franja === 'string' ? args.franja : 'cualquiera';
    const dia = typeof args.dia === 'string' ? args.dia : undefined;
    try {
      const all = await allSlots(now);
      const slots = minStart ? all.slots.filter((s) => s >= minStart) : all.slots;
      const mock = all.mock;
      let picked = pickSlots(slots, franja, dia);
      let note = '';
      if (!picked.length && (franja !== 'cualquiera' || dia)) {
        picked = pickSlots(slots, 'cualquiera');
        if (picked.length) note = 'No hay huecos con esa preferencia; se le enseñan los más próximos. Díselo.';
      }
      if (!picked.length) {
        return {
          result: JSON.stringify({ huecos: [], nota: 'No hay huecos libres en los próximos días. Ofrécele dejar sus datos (mostrar_formulario, modo contacto).' }),
        };
      }
      return {
        result: JSON.stringify({
          huecos: picked.map((s) => label.format(new Date(s))),
          nota: `${note} La página ya le enseña estos huecos como botones; no los repitas uno a uno.`.trim(),
        }),
        slots: { slots: picked.map((s) => new Date(s).toISOString()), mock },
      };
    } catch (e) {
      console.error('assistant_slots_failed', e instanceof Error ? e.message : 'unknown');
      return {
        result: JSON.stringify({ huecos: [], nota: 'No se ha podido consultar la agenda. Ofrécele el formulario (mostrar_formulario).' }),
      };
    }
  }

  if (name === 'mostrar_formulario') {
    const form = args.modo === 'contacto' ? 'contacto' : 'llamada';
    return { result: JSON.stringify({ ok: true, nota: 'La página ya le enseña el botón.' }), form };
  }

  return { result: JSON.stringify({ error: 'herramienta desconocida' }) };
}

/** Texto de los huecos para la nota de contexto («Se le mostraron…»). */
export function describeSlots(isoSlots: string[]): string {
  return isoSlots.map((s) => label.format(new Date(s))).join('; ');
}
