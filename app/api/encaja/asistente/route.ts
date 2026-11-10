import { promoMinStart } from '@/lib/agenda/promo';
import { verifyTurnstile } from '@/lib/agenda/turnstile';
import { assistantConfig, assistantEnabled, assistantMock } from '@/lib/assistant/config';
import { streamChat, UpstreamError, type ApiMessage } from '@/lib/assistant/deepseek';
import { mockTurn } from '@/lib/assistant/mock';
import { systemPrompt } from '@/lib/assistant/prompt';
import { allow } from '@/lib/assistant/rate-limit';
import { redact } from '@/lib/assistant/redact';
import { assistantRequestSchema, type AssistantError, type AssistantEvent, type ChatMessage } from '@/lib/assistant/schema';
import { createSession, readSession } from '@/lib/assistant/session';
import { describeSlots, runTool, TOOLS, type ToolOutcome } from '@/lib/assistant/tools';

/**
 * POST /api/encaja/asistente: un turno de Mr. Tomate, el asistente de las landings de Encaja
 * (docs/encaja/asistente.md). Recibe la conversación entera y responde en streaming (NDJSON,
 * lib/assistant/schema.ts). Con `entry: 'promo'` (oferta del prototipo gratis) reúne requisitos
 * y solo propone huecos a partir de 3 días laborables.
 *
 * Validación → límite por IP → sesión firmada (el primer mensaje pasa Turnstile) → DeepSeek con
 * las instrucciones y el contenido de la landing montados aquí → herramientas (huecos de la
 * agenda, botón del formulario). Antes de salir hacia DeepSeek se quitan emails, teléfonos y
 * documentos de lo que escribe el visitante. Nunca se escribe el contenido de la conversación
 * en los logs.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

const isProduction = process.env.NODE_ENV === 'production';
const encoder = new TextEncoder();
const line = (e: AssistantEvent) => encoder.encode(`${JSON.stringify(e)}\n`);

const headers = {
  'content-type': 'application/x-ndjson; charset=utf-8',
  'cache-control': 'no-store',
  'x-accel-buffering': 'no',
};

/** Error antes de empezar a responder: una sola línea NDJSON con su código HTTP. */
const fail = (error: AssistantError, status: number) =>
  new Response(line({ t: 'error', error }), { status, headers });

/**
 * Historial para el modelo: lo del visitante, sin datos personales evidentes; lo que vio en
 * pantalla, como nota. El saludo de la página (mensajes del asistente antes del primero del
 * visitante) va como contexto en las instrucciones: la API espera que la conversación empiece
 * por el usuario.
 */
function toApiMessages(messages: ChatMessage[]): { opener?: string; history: ApiMessage[] } {
  const first = messages.findIndex((m) => m.role === 'user');
  const opener = messages
    .slice(0, Math.max(first, 0))
    .map((m) => m.content)
    .join(' ')
    .trim();
  const history = messages.slice(Math.max(first, 0)).map((m): ApiMessage => {
    if (m.role === 'user') return { role: 'user', content: redact(m.content) };
    const notes: string[] = [];
    if (m.shown?.slots?.length) notes.push(`(Se le mostraron en pantalla estos huecos: ${describeSlots(m.shown.slots)}.)`);
    if (m.shown?.form) notes.push(`(Se le mostró el botón del formulario: ${m.shown.form}.)`);
    return { role: 'assistant', content: [m.content, ...notes].filter(Boolean).join('\n\n') };
  });
  return { opener: opener ? opener.slice(0, 600) : undefined, history };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('validation', 400);
  }
  const parsed = assistantRequestSchema.safeParse(body);
  if (!parsed.success) return fail('validation', 422);
  const d = parsed.data;

  const last = d.messages.at(-1);
  if (last?.role !== 'user') return fail('validation', 422);
  if (d.messages.filter((m) => m.role === 'user').length > assistantConfig.maxUserTurns) return fail('limit', 429);

  if (!assistantEnabled()) {
    console.error('assistant_config_missing', 'DEEPSEEK_API_KEY / ASSISTANT_SECRET');
    return fail('config', 503);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (!allow(ip)) return fail('rate', 429);

  // Sesión: la que trae el navegador o, si no hay (o ha caducado), una nueva tras Turnstile.
  let newSession: string | null = null;
  if (!readSession(d.session, d.landing)) {
    if (!d.turnstileToken) return fail('session', 401);
    const verdict = await verifyTurnstile(d.turnstileToken, ip);
    if (verdict === 'skipped' && isProduction) {
      console.error('assistant_config_missing', 'TURNSTILE_SECRET_KEY');
      return fail('config', 503);
    }
    if (verdict === 'fail') return fail('captcha', 400);
    newSession = createSession(d.landing);
    if (!newSession) return fail('config', 503);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: AssistantEvent) => {
        try {
          controller.enqueue(line(e));
        } catch {
          /* el navegador ya ha cerrado la conexión */
        }
      };
      if (newSession) send({ t: 'session', token: newSession });

      let wrote = false;
      let showedSlots = false;
      const emitTool = (out: ToolOutcome) => {
        if (out.slots?.slots.length) {
          showedSlots = true;
          send({ t: 'slots', slots: out.slots.slots, mock: out.slots.mock || undefined });
        }
        if (out.form) send({ t: 'form', mode: out.form });
      };

      const promo = d.entry === 'promo';
      const toolOptions = { minStart: promo ? promoMinStart() : undefined };

      try {
        if (assistantMock()) {
          const turn = mockTurn(last.content, promo);
          for (const word of turn.text.split(/(?<=\s)/)) {
            send({ t: 'text', v: word });
            await sleep(25);
          }
          if (turn.tool) emitTool(await runTool(turn.tool.name, turn.tool.args, toolOptions));
          send({ t: 'done' });
          return;
        }

        const { opener, history } = toApiMessages(d.messages);
        const messages: ApiMessage[] = [
          { role: 'system', content: systemPrompt(d.landing, { term: d.term, entry: d.entry, opener }) },
          ...history,
        ];

        for (let round = 0; round <= assistantConfig.maxToolRounds; round++) {
          const lastRound = round === assistantConfig.maxToolRounds;
          const { text, toolCalls } = await streamChat(
            { messages, tools: lastRound ? undefined : TOOLS, signal: req.signal },
            (delta) => {
              wrote ||= delta.trim().length > 0;
              send({ t: 'text', v: delta });
            },
          );
          if (!toolCalls.length) break;
          messages.push({ role: 'assistant', content: text || null, tool_calls: toolCalls });
          for (const call of toolCalls) {
            const out = await runTool(call.function.name, call.function.arguments, toolOptions);
            emitTool(out);
            messages.push({ role: 'tool', tool_call_id: call.id, content: out.result });
          }
          // Separación entre lo escrito antes y después de usar la herramienta.
          if (text.trim()) send({ t: 'text', v: '\n\n' });
        }

        if (!wrote) {
          send({
            t: 'text',
            v: showedSlots
              ? 'Elige el hueco que mejor te venga y lo confirmas abajo con tu nombre y tu email.'
              : 'Perdona, no he podido responderte. ¿Me lo cuentas de otra forma?',
          });
        }
        send({ t: 'done' });
      } catch (e) {
        const status = e instanceof UpstreamError ? e.status : undefined;
        console.error('assistant_upstream_failed', e instanceof Error ? e.message : 'unknown', status ?? '');
        send({ t: 'error', error: 'upstream' });
      } finally {
        try {
          controller.close();
        } catch {
          /* ya cerrado */
        }
      }
    },
  });

  return new Response(stream, { status: 200, headers });
}
