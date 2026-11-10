'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile (§9.4). Solo se monta donde hace falta (/contacto, la agenda y el chat de
 * las landings), así el script no se carga en ninguna otra página. Sin
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY (desarrollo) no se carga nada y se envía `TURNSTILE_DEV_TOKEN`.
 */

type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (code?: string) => void;
  'timeout-callback'?: () => void;
  'before-interactive-callback'?: () => void;
  'after-interactive-callback'?: () => void;
  'unsupported-callback'?: () => void;
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

/** Por qué no se ha podido verificar: fallo del reto, navegador no compatible o script bloqueado. */
export type TurnstileFailure = 'error' | 'unsupported' | 'script';

type Props = {
  /** Recibe el token al superar el reto. */
  onToken: (token: string) => void;
  /** El token ha caducado o el widget ha fallado: hay que volver a verificar. */
  onExpire?: () => void;
  /** Cloudflare pide (true) o deja de pedir (false) que la persona marque la casilla. */
  onInteractive?: (active: boolean) => void;
  /** No se ha podido verificar (además de `onExpire`). `code` es el código de error de Cloudflare. */
  onError?: (reason: TurnstileFailure, code?: string) => void;
  /** «interaction-only»: invisible salvo que Cloudflare necesite que la persona interactúe. */
  appearance?: 'always' | 'interaction-only';
  className?: string;
};

export function Turnstile({ onToken, onExpire, onInteractive, onError, appearance = 'always', className }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const handlers = useRef({ onToken, onExpire, onInteractive, onError });

  useEffect(() => {
    handlers.current = { onToken, onExpire, onInteractive, onError };
  }, [onToken, onExpire, onInteractive, onError]);

  const render = useCallback(() => {
    const el = container.current;
    const ts = window.turnstile;
    if (!el || !ts || !TURNSTILE_SITE_KEY || widgetId.current) return;
    const fail = (reason: TurnstileFailure, code?: string) => {
      handlers.current.onExpire?.();
      handlers.current.onError?.(reason, code);
    };
    try {
      widgetId.current = ts.render(el, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => handlers.current.onToken(token),
        'expired-callback': () => handlers.current.onExpire?.(),
        'error-callback': (code) => {
          handlers.current.onInteractive?.(false);
          fail('error', code);
        },
        // No marcó la casilla a tiempo: se vuelve a empezar para que pueda intentarlo otra vez.
        'timeout-callback': () => {
          handlers.current.onExpire?.();
          handlers.current.onInteractive?.(false);
          if (widgetId.current) window.turnstile?.reset(widgetId.current);
        },
        'before-interactive-callback': () => handlers.current.onInteractive?.(true),
        'after-interactive-callback': () => handlers.current.onInteractive?.(false),
        'unsupported-callback': () => fail('unsupported'),
        theme: 'light',
        language: 'es',
        size: 'flexible',
        appearance,
        'response-field': false,
      });
    } catch {
      fail('error', 'render');
    }
  }, [appearance]);

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
      <Script
        src={TURNSTILE_SRC}
        strategy="afterInteractive"
        onLoad={render}
        onReady={render}
        onError={() => {
          handlers.current.onExpire?.();
          handlers.current.onError?.('script');
        }}
      />
      <div ref={container} />
    </div>
  );
}
