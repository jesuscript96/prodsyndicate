'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile (§9.4). Solo se monta en el paso 6 de /contacto, así el
 * script no se carga en ninguna otra página. Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * (desarrollo) no se carga nada y el formulario envía `TURNSTILE_DEV_TOKEN`.
 */

type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  'timeout-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  size?: 'normal' | 'flexible' | 'compact';
  appearance?: 'always' | 'execute' | 'interaction-only';
  'response-field'?: boolean;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: TurnstileOptions) => string | undefined;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY);
/** Token que acepta el servidor en desarrollo cuando no hay clave configurada. */
export const TURNSTILE_DEV_TOKEN = 'dev-no-turnstile';

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type Props = {
  /** Recibe el token al superar el reto. */
  onToken: (token: string) => void;
  /** El token ha caducado o el widget ha fallado: hay que volver a verificar. */
  onExpire?: () => void;
  className?: string;
};

export function Turnstile({ onToken, onExpire, className }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
  }, [onToken, onExpire]);

  const render = useCallback(() => {
    const el = container.current;
    const ts = window.turnstile;
    if (!el || !ts || !TURNSTILE_SITE_KEY || widgetId.current) return;
    widgetId.current = ts.render(el, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => onTokenRef.current(token),
      'expired-callback': () => onExpireRef.current?.(),
      'error-callback': () => onExpireRef.current?.(),
      'timeout-callback': () => onExpireRef.current?.(),
      theme: 'light',
      language: 'es',
      size: 'flexible',
      'response-field': false,
    });
  }, []);

  useEffect(() => {
    if (!turnstileEnabled) return;
    // Si el script ya está cargado (vuelta a la página o al paso 6), renderiza directamente.
    render();
    return () => {
      if (widgetId.current) {
        try {
          window.turnstile?.remove(widgetId.current);
        } catch {
          /* el widget ya no existe */
        }
        widgetId.current = undefined;
      }
    };
  }, [render]);

  if (!turnstileEnabled) return null;

  return (
    <div className={className}>
      <Script src={TURNSTILE_SRC} strategy="afterInteractive" onLoad={render} onReady={render} />
      <div ref={container} />
    </div>
  );
}
