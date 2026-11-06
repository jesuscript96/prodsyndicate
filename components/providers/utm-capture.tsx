'use client';

import { useEffect } from 'react';
import { CLICK_ID_PARAMS } from '@/lib/attribution';

/**
 * Al aterrizar guarda en sessionStorage (§9.4) los utm_*, los identificadores de clic de los
 * anuncios (gclid, gbraid, wbraid, fbclid) y el dominio de procedencia, para que los formularios
 * los adjunten al lead (`lib/attribution.ts`). Se queda el primer origen de la sesión.
 */
export function UtmCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      const clicks: Record<string, string> = {};
      params.forEach((v, k) => {
        if (k.startsWith('utm_') && v) utm[k] = v.slice(0, 120);
        if ((CLICK_ID_PARAMS as readonly string[]).includes(k) && v) clicks[k] = v.slice(0, 400);
      });
      if (Object.keys(utm).length && !sessionStorage.getItem('utm')) {
        sessionStorage.setItem('utm', JSON.stringify(utm));
      }
      if (Object.keys(clicks).length && !sessionStorage.getItem('clicks')) {
        sessionStorage.setItem('clicks', JSON.stringify(clicks));
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
