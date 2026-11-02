'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import './cookie-banner.css';

type Choice = 'granted' | 'denied';

const STORAGE_KEY = 'valme_cookies';
/** Lo lanza «Configurar cookies» (pie de página) para volver a abrir el aviso. */
const OPEN_EVENT = 'valme:configurar-cookies';

function updateConsent(value: Choice) {
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  const consent = {
    ad_storage: value,
    analytics_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  };
  // window.gtag lo define el script de consentimiento del <head> (app/layout.tsx).
  w.gtag?.('consent', 'update', consent);
  // Evento para GTM: las etiquetas que piden consentimiento (el píxel de Meta) se disparan
  // en esta misma página, no en la siguiente.
  w.dataLayer?.push({ event: 'valme_consentimiento', valme_cookies: value });
}

/** «Configurar cookies»: vuelve a abrir el aviso para aceptar o rechazar de nuevo. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Configurar cookies
    </button>
  );
}

/** Aviso de cookies (Valme): sólo aparece si no hay elección guardada en localStorage. */
export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== 'granted' && saved !== 'denied') setOpen(true);
    } catch {
      setOpen(true);
    }
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  const choose = (value: Choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* localStorage no disponible: se aplica sólo a esta visita */
    }
    updateConsent(value);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <section className="cookie-banner" role="region" aria-labelledby="cookie-banner-title">
      <div className="cookie-banner__inner card">
        <div className="cookie-banner__text">
          <h2 id="cookie-banner-title" className="label">
            Cookies
          </h2>
          <p>
            Con tu permiso usamos cookies de analítica y publicidad para medir las visitas y saber qué campañas
            funcionan. Más detalle en la{' '}
            <Link href="/legal/cookies">política de cookies</Link> y la{' '}
            <Link href="/legal/privacidad">política de privacidad</Link>.
          </p>
        </div>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            data-valme-cookies="denied"
            onClick={() => choose('denied')}
          >
            Rechazar
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            data-valme-cookies="granted"
            onClick={() => choose('granted')}
          >
            Aceptar
          </button>
        </div>
      </div>
    </section>
  );
}
