import { assistantConfig } from './config';

/**
 * Límite de peticiones por IP en memoria. Es por instancia del servidor (Vercel puede tener
 * varias), así que es un freno de mano, no una barrera: el tope real del gasto es el saldo prepago
 * de DeepSeek, y el de cada conversación, `maxUserTurns`.
 */

const hits = new Map<string, number[]>();

export function allow(ip: string | undefined, now = Date.now()): boolean {
  const key = ip || 'sin-ip';
  const windowMs = assistantConfig.rateLimit.windowMinutes * 60000;
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= assistantConfig.rateLimit.requests) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Limpieza ocasional para que el mapa no crezca sin fin.
  if (hits.size > 5000) {
    for (const [k, list] of hits) if (!list.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return true;
}
