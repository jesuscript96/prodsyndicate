'use client';

import { useEffect } from 'react';

/**
 * Al aterrizar guarda utm_* y el referrer en sessionStorage (§9.4) para que el
 * asistente de contacto los envíe como `utm` y `source`. Sin datos personales.
 */
export function UtmCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      params.forEach((v, k) => {
        if (k.startsWith('utm_') && v) utm[k] = v.slice(0, 120);
      });
      if (Object.keys(utm).length && !sessionStorage.getItem('utm')) {
        sessionStorage.setItem('utm', JSON.stringify(utm));
      }
      if (!sessionStorage.getItem('source')) {
        const ref = document.referrer;
        const external = ref && !ref.startsWith(window.location.origin);
        sessionStorage.setItem('source', external ? new URL(ref).hostname.slice(0, 200) : 'direct');
      }
    } catch {
      /* sessionStorage no disponible: se ignora */
    }
  }, []);
  return null;
}
