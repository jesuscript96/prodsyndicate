import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

/**
 * Registro único de plugins (§6.6a). Importar siempre GSAP desde aquí.
 * Flip no está aquí: este módulo entra en todas las páginas y Flip solo lo usa
 * components/projects/project-grid.tsx, que lo registra por su cuenta.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  // Evita recalcular el pin cuando la barra de URL de iOS/Android cambia el viewport
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
