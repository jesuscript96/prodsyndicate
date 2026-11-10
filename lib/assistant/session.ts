import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { assistantConfig, assistantSecret } from './config';

/**
 * Sesión del chat sin base de datos: un token firmado (HMAC-SHA256) que se entrega tras pasar
 * Turnstile en el primer mensaje y caduca a los `sessionMinutes`. Evita que alguien use la ruta
 * como un chat gratis sin pasar el antispam. Solo servidor.
 */

type Payload = { sid: string; landing: string; exp: number };

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');

function sign(data: string, secret: string) {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function createSession(landing: string, now = Date.now()): string | null {
  const secret = assistantSecret();
  if (!secret) return null;
  const payload: Payload = { sid: randomUUID(), landing, exp: now + assistantConfig.sessionMinutes * 60000 };
  const data = b64(JSON.stringify(payload));
  return `${data}.${sign(data, secret)}`;
}

/** Devuelve la sesión si la firma es buena, no ha caducado y es de esta landing. */
export function readSession(token: string | undefined, landing: string, now = Date.now()): Payload | null {
  const secret = assistantSecret();
  if (!token || !secret) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as Payload;
    if (typeof p.exp !== 'number' || p.exp < now || p.landing !== landing) return null;
    return p;
  } catch {
    return null;
  }
}
