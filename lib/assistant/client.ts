import { encajaAssistant } from '@/content/encaja';
import type { AssistantEntry, LeadChat, Shown } from './schema';

/**
 * Lado del navegador de Mr. Tomate: la conversación vive en sessionStorage (se borra al cerrar
 * el navegador y no se guarda en ningún servidor), el chat se abre con un evento (pop-up de la
 * oferta, botón del hero) y la agenda de la landing escucha otro para abrirse con el hueco que se
 * eligió en el chat.
 */

export type StoredMessage = { role: 'user' | 'assistant'; content: string; shown?: Shown };

export type StoredChat = { v: 1; entry?: AssistantEntry; messages: StoredMessage[] };

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
  return { v: 1, messages: [] };
}

export function saveChat(slug: string, chat: StoredChat) {
  try {
    sessionStorage.setItem(chatKey(slug), JSON.stringify(chat));
  } catch {
    /* sin almacenamiento: el chat funciona igual mientras la página esté abierta */
  }
}

/** Conversación con el saludo de Mr. Tomate delante, si aún no lo tiene. */
export function withOpener(chat: StoredChat): StoredChat {
  if (chat.messages.length) return chat;
  const opener = encajaAssistant.openers[chat.entry === 'promo' ? 'promo' : 'default'];
  return { ...chat, messages: [{ role: 'assistant', content: opener }] };
}

/** Pasa la conversación a la oferta del prototipo: Mr. Tomate empieza a pedir requisitos. */
export function enterPromo(slug: string) {
  const chat = loadChat(slug);
  if (chat.entry === 'promo') return;
  const opener = encajaAssistant.openers.promo;
  const messages: StoredMessage[] = chat.messages.length ? [...chat.messages, { role: 'assistant', content: opener }] : [];
  saveChat(slug, withOpener({ ...chat, entry: 'promo', messages }));
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
  return messages.map(({ role, content }) => ({ role, content: content.slice(0, 2000) })).slice(-43);
}

/** ¿Llega desde la oferta del prototipo? (la agenda empieza a 3 días laborables) */
export function isPromoChat(landing: string): boolean {
  if (typeof window === 'undefined') return false;
  return loadChat(slugFromLanding(landing)).entry === 'promo';
}

/* ───────────── Abrir el chat ───────────── */

export const ASSISTANT_EVENT = 'encaja:asistente';

export type AssistantRequest = { entry: AssistantEntry };

export function openAssistant(entry: AssistantEntry = 'default') {
  window.dispatchEvent(new CustomEvent<AssistantRequest>(ASSISTANT_EVENT, { detail: { entry } }));
}

/* ───────────── Del chat a la agenda ───────────── */

export const AGENDA_EVENT = 'encaja:agenda';

export type AgendaRequest = { mode: 'llamada' | 'contacto'; slot?: string };

export function openAgenda(detail: AgendaRequest) {
  window.dispatchEvent(new CustomEvent<AgendaRequest>(AGENDA_EVENT, { detail }));
}
