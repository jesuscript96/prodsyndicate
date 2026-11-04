/**
 * Verificación de Cloudflare Turnstile en servidor (misma lógica que /api/contact).
 * `skipped` solo significa «sin TURNSTILE_SECRET_KEY»: en producción la ruta debe rechazarlo.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<'ok' | 'fail' | 'skipped'> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return 'skipped';
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return data.success ? 'ok' : 'fail';
  } catch {
    console.error('turnstile_verify_unreachable');
    return 'fail';
  }
}
