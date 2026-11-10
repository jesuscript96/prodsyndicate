import { assistantMock, deepseekKey } from './config';
import { completeChat } from './deepseek';
import { redact } from './redact';
import type { LeadChat } from './schema';

/**
 * Resumen de la conversación con el asistente para el equipo, que viaja con la reserva o el
 * contacto (Valme OS y aviso por correo). Si DeepSeek no responde a tiempo, se manda lo que
 * escribió el visitante, recortado: el lead nunca se retrasa ni se pierde por esto. Solo servidor.
 */

const MAX = 1500;
const TIMEOUT_MS = 6000;

const PROMPT = `Resume para el equipo comercial de AUTOMATO esta conversación entre un visitante y el asistente de la web, en 3 a 5 líneas cortas en español:
- Qué necesita o qué le quita tiempo.
- Tamaño de la empresa y sector, si los dijo.
- Programas que usa, si los dijo.
- Urgencia o dudas importantes (por ejemplo, el precio).
Solo lo que dijo el visitante; no inventes ni completes. Si algo no lo dijo, no lo pongas. Sin saludos ni conclusiones.`;

/** Lo que escribió el visitante, tal cual pero recortado. */
function fallback(chat: LeadChat): string {
  const said = chat.filter((m) => m.role === 'user').map((m) => `- ${m.content.replace(/\s+/g, ' ').trim()}`);
  const text = `Lo que escribió en el chat:\n${said.join('\n')}`;
  return text.length > MAX ? `${text.slice(0, MAX - 1)}…` : text;
}

export async function summarizeChat(chat: LeadChat | undefined): Promise<string | undefined> {
  if (!chat?.some((m) => m.role === 'user')) return undefined;
  if (assistantMock() || !deepseekKey()) return fallback(chat);

  const transcript = chat
    .map((m) => `${m.role === 'user' ? 'Visitante' : 'Asistente'}: ${m.role === 'user' ? redact(m.content) : m.content}`)
    .join('\n')
    .slice(-12000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const summary = await completeChat({
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: transcript },
      ],
      maxTokens: 300,
      signal: controller.signal,
    });
    return summary ? summary.slice(0, MAX) : fallback(chat);
  } catch (e) {
    console.error('assistant_summary_failed', e instanceof Error ? e.message : 'unknown');
    return fallback(chat);
  } finally {
    clearTimeout(timer);
  }
}
