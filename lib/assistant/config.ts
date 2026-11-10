/**
 * Asistente con IA de las landings de Encaja (docs/encaja/asistente.md). Solo servidor.
 *
 * Se enciende cuando hay clave de DeepSeek y secreto para firmar las sesiones. En desarrollo,
 * sin clave, responde en modo de prueba (lib/assistant/mock.ts) para poder probar la interfaz.
 */

const isProduction = process.env.NODE_ENV === 'production';

export const assistantConfig = {
  /** API de DeepSeek en formato OpenAI (https://api-docs.deepseek.com). */
  baseUrl: 'https://api.deepseek.com',
  /** `deepseek-flash` por defecto: rápido y barato. `deepseek-v4-pro` si hiciera falta más calidad. */
  model: process.env.DEEPSEEK_MODEL || 'deepseek-flash',
  /** Tope de cada respuesta. Las respuestas son de 1 a 3 frases; esto solo corta si se desmadra. */
  maxTokens: 450,
  temperature: 0.4,
  /** Mensajes del visitante por conversación. Pasado el tope, se le lleva a la agenda. */
  maxUserTurns: 20,
  /** Caracteres por mensaje del visitante. */
  maxUserChars: 500,
  /** Caracteres por respuesta del asistente que se aceptan de vuelta en el historial. */
  maxAssistantChars: 2000,
  /** Duración de una sesión firmada; después hay que volver a pasar Turnstile. */
  sessionMinutes: 45,
  /** Rondas de herramientas por turno (proponer huecos, enseñar el formulario). */
  maxToolRounds: 2,
  /** Límite por IP y por instancia del servidor: peticiones por ventana. */
  rateLimit: { requests: 40, windowMinutes: 10 },
  /** Tiempo máximo de espera a DeepSeek por llamada. */
  timeoutMs: 25000,
} as const;

export const deepseekKey = () => process.env.DEEPSEEK_API_KEY || '';

/** Secreto para firmar las sesiones. En desarrollo vale uno fijo; en producción es obligatorio. */
export function assistantSecret(): string {
  const secret = process.env.ASSISTANT_SECRET;
  if (secret) return secret;
  return isProduction ? '' : 'dev-assistant-secret';
}

/** Modo de prueba: en desarrollo y sin clave de DeepSeek, respuestas simuladas. */
export const assistantMock = () => !isProduction && !deepseekKey();

/** ¿Se enseña el asistente? Con clave y secreto, o en desarrollo (modo de prueba). */
export function assistantEnabled(): boolean {
  if (!isProduction) return true;
  return Boolean(deepseekKey() && assistantSecret());
}
