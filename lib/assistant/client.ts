import type { LeadChat, Shown } from './schema';

/**
 * Lado del navegador del asistente: la conversación vive en sessionStorage (se borra al cerrar
 * el navegador y no se guarda en ningún servidor) y la agenda de la landing escucha un evento
 * para abrirse con el hueco que se eligió en el chat.
 */

export type StoredMessage = { role: 'user' | 'assistant'; content: string; shown?: Shown };

export type StoredChat = { v: 1; consent: boolean; messages: StoredMessage[] };

const chatKey = (slug: string) => `encaja_chat:${slug}`;
const sessionKey = (slug: string) => `encaja_chat_session:${slug}`;

/** «encaja-tiempo» → «tiempo» (la agenda recibe la landing con prefijo). */
export const slugFromLanding = (landing: string) => landing.replace(/^encaja-/, '');

export function loadChat(slug: string): StoredChat {
  try {
    const raw = sessionStorage.getItem(chatKey(slug));
    const parsed = raw ? (JSON.parse(raw) as StoredChat) : null;
    if (parsed?.v === 1 && Array.isArray(parsed.messages)) return parsed;
  } catch {
    /* sessionStorage no disponible o dato corrupto */
  }
  return { v: 1, consent: false, messages: [] };
}

export function saveChat(slug: string, chat: StoredChat) {
  try {
    sessionStorage.setItem(chatKey(slug), JSON.stringify(chat));
  } catch {
    /* sin almacenamiento: el chat funciona igual mientras la página esté abierta */
  }
}

export function loadSession(slug: string): string | undefined {
  try {
    return sessionStorage.getItem(sessionKey(slug)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function saveSession(slug: string, token: string | undefined) {
  try {
    if (token) sessionStorage.setItem(sessionKey(slug), token);
    else sessionStorage.removeItem(sessionKey(slug));
  } catch {
    /* sin almacenamiento */
  }
}

/** Conversación para adjuntar a la reserva o al contacto (solo texto), si la hubo. */
export function readChatForLead(landing: string): LeadChat | undefined {
  if (typeof window === 'undefined') return undefined;
  const { messages } = loadChat(slugFromLanding(landing));
  if (!messages.some((m) => m.role === 'user')) return undefined;
  return messages.map(({ role, content }) => ({ role, content: content.slice(0, 2000) })).slice(-40);
}

/* ───────────── Del chat a la agenda ───────────── */

export const AGENDA_EVENT = 'encaja:agenda';

export type AgendaRequest = { mode: 'llamada' | 'contacto'; slot?: string };

export function openAgenda(detail: AgendaRequest) {
  window.dispatchEvent(new CustomEvent<AgendaRequest>(AGENDA_EVENT, { detail }));
}
