import { assistantMock, deepseekKey } from './config';
import { completeChat } from './deepseek';
import { redact } from './redact';
import type { LeadChat } from './schema';

/**
 * Resumen de la conversación con el asistente para el equipo, que viaja con la reserva o el
 * contacto (Valme OS y aviso por correo). Si DeepSeek no responde a tiempo, se manda lo que
 * escribió el visitante, recortado: el lead nunca se retrasa ni se pierde por esto. Solo servidor.
 */

/** Valme OS acepta respuestas de hasta 4 × 500 caracteres (lib/valme-os.ts). */
const MAX = 2000;
const TIMEOUT_MS = 8000;

const PROMPT = `Resume para el equipo comercial de AUTOMATO esta conversación entre un visitante y Mr. Tomate, el asistente de la web, en 3 a 5 líneas cortas en español:
- Qué necesita o qué le quita tiempo.
- Tamaño de la empresa y sector, si los dijo.
- Programas que usa, si los dijo.
- Urgencia o dudas importantes (por ejemplo, el precio).
Solo lo que dijo el visitante; no inventes ni completes. Si algo no lo dijo, no lo pongas. Sin saludos ni conclusiones.`;

/** Oferta del prototipo: ficha de requisitos para que el equipo prepare las pantallas. */
const PROMO_PROMPT = `El visitante ha pedido el prototipo gratis y Mr. Tomate, el asistente de la web, le ha preguntado por lo que necesita. Con esta conversación, escribe la ficha de requisitos para que el equipo de AUTOMATO prepare el prototipo. En español, texto plano, una línea por apartado y sin adornos:
Problema:
Para quién (empresa, sector, equipo):
Cómo lo hacen hoy:
Quién lo usará y desde dónde:
Imprescindibles de la primera versión:
Datos y programas a conectar:
Plazo y cómo sabrán que funciona:
Dudas abiertas para la llamada:
Solo lo que dijo el visitante (o lo que confirmó cuando Mr. Tomate se lo resumió); no inventes ni completes. Si un apartado no salió, pon «Sin datos».`;

export type SummaryOptions = { promo?: boolean };

/** Lo que escribió el visitante, tal cual pero recortado. */
function fallback(chat: LeadChat): string {
  const said = chat.filter((m) => m.role === 'user').map((m) => `- ${m.content.replace(/\s+/g, ' ').trim()}`);
  const text = `Lo que escribió en el chat:\n${said.join('\n')}`;
  return text.length > MAX ? `${text.slice(0, MAX - 1)}…` : text;
}

export async function summarizeChat(chat: LeadChat | undefined, { promo = false }: SummaryOptions = {}): Promise<string | undefined> {
  if (!chat?.some((m) => m.role === 'user')) return undefined;
  if (assistantMock() || !deepseekKey()) return fallback(chat);

  const transcript = chat
    .map((m) => `${m.role === 'user' ? 'Visitante' : 'Mr. Tomate'}: ${m.role === 'user' ? redact(m.content) : m.content}`)
    .join('\n')
    .slice(-12000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const summary = await completeChat({
      messages: [
        { role: 'system', content: promo ? PROMO_PROMPT : PROMPT },
        { role: 'user', content: transcript },
      ],
      maxTokens: promo ? 600 : 300,
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
