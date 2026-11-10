import { z } from 'zod';

/**
 * Contrato entre el chat (components/encaja/assistant) y /api/encaja/asistente. Compartido por
 * navegador y servidor: aquí no puede haber nada que solo exista en el servidor.
 */

export const assistantLandings = ['tiempo', 'procesos', 'crecer'] as const;

/** Cómo se abrió el chat: «promo» = desde la oferta del prototipo gratis (pop-up de llegada). */
export type AssistantEntry = 'default' | 'promo';

/** Lo que la página enseñó junto a una respuesta (botones de huecos o del formulario). */
export const shownSchema = z.object({
  slots: z.array(z.iso.datetime()).max(6).optional(),
  form: z.enum(['llamada', 'contacto']).optional(),
});

export const chatMessageSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('user'), content: z.string().trim().min(1).max(500) }),
  z.object({ role: z.literal('assistant'), content: z.string().max(2000), shown: shownSchema.optional() }),
]);

export const assistantRequestSchema = z.object({
  landing: z.enum(assistantLandings),
  /** Conversación entera, en orden (puede empezar con el saludo de Mr. Tomate). La última es del visitante. */
  messages: z.array(chatMessageSchema).min(1).max(43),
  /** Si se abrió desde la oferta del prototipo: Mr. Tomate pasa a reunir requisitos */
  entry: z.enum(['default', 'promo']).optional(),
  /** Sesión firmada que devolvió el servidor en el primer mensaje */
  session: z.string().max(400).optional(),
  /** Turnstile, solo para abrir sesión */
  turnstileToken: z.string().max(2048).optional(),
  /** Palabra clave del anuncio (`utm_term`) */
  term: z.string().max(200).optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type Shown = z.infer<typeof shownSchema>;
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

/** Conversación que viaja con la reserva o el contacto (solo texto). */
export const leadChatSchema = z
  .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) }))
  .max(43);

export type LeadChat = z.infer<typeof leadChatSchema>;

/**
 * Respuesta en streaming: una línea JSON por evento (NDJSON).
 * - session: sesión firmada para los siguientes mensajes
 * - text: trozo de la respuesta
 * - slots: huecos para enseñar como botones (ISO, UTC)
 * - form: enseñar el botón del formulario
 * - done / error
 */
export type AssistantEvent =
  | { t: 'session'; token: string }
  | { t: 'text'; v: string }
  | { t: 'slots'; slots: string[]; mock?: boolean }
  | { t: 'form'; mode: 'llamada' | 'contacto' }
  | { t: 'done' }
  | { t: 'error'; error: AssistantError };

export type AssistantError = 'validation' | 'captcha' | 'session' | 'limit' | 'rate' | 'config' | 'upstream';
