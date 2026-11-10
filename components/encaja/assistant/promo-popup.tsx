'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { encajaPromo, type EncajaSlug } from '@/content/encaja';
import { track } from '@/lib/analytics';
import { loadChat, openAssistant } from '@/lib/assistant/client';
import { TomatoAvatar } from './tomato-avatar';
import './assistant.css';

/**
 * Pop-up de llegada con la oferta «Llévate tu prototipo GRATIS» (docs/encaja/asistente.md).
 * Sale una vez por sesión, poco después de llegar y nunca encima del aviso de cookies: espera a
 * que se haya decidido. No sale si ya se ha hablado con Mr. Tomate o si se llega directo a la
 * agenda. El botón abre el chat en modo oferta: Mr. Tomate empieza a pedir los requisitos.
 */

const SEEN_KEY = 'encaja_promo_visto';
const DELAY_MS = 1500;

function cookieDecided(): boolean {
  try {
    const v = localStorage.getItem('valme_cookies');
    return v === 'granted' || v === 'denied';
  } catch {
    return true; // sin almacenamiento no hay aviso de cookies que esperar
  }
}

function shouldShow(landing: EncajaSlug): boolean {
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false;
  } catch {
    return false;
  }
  if (window.location.hash === '#contacto') return false;
  return !loadChat(landing).messages.some((m) => m.role === 'user');
}

export function PromoPopup({ landing, location }: { landing: EncajaSlug; location: string }) {
  const [open, setOpen] = useState(false);
  const cta = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // Llegada: espera a la decisión de cookies y a un respiro antes de enseñarse.
  useEffect(() => {
    if (!shouldShow(landing)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reveal = () => {
      timer = setTimeout(() => {
        if (!shouldShow(landing)) return;
        try {
          sessionStorage.setItem(SEEN_KEY, '1');
        } catch {
          /* sin almacenamiento: puede volver a salir al recargar */
        }
        returnFocus.current = document.activeElement as HTMLElement | null;
        setOpen(true);
        track('promo_view', { location });
      }, DELAY_MS);
    };
    if (cookieDecided()) {
      reveal();
      return () => clearTimeout(timer);
    }
    const poll = setInterval(() => {
      if (!cookieDecided()) return;
      clearInterval(poll);
      reveal();
    }, 500);
    return () => {
      clearInterval(poll);
      clearTimeout(timer);
    };
  }, [landing, location]);

  // Abierto: foco en el botón, sin scroll de fondo.
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => cta.current?.focus());
    const lenis = window.__lenis;
    lenis?.stop();
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      lenis?.start();
      html.style.overflow = prev;
    };
  }, [open]);

  const close = (how: 'cta' | 'dismiss' | 'escape' | 'fondo' | 'cerrar') => {
    setOpen(false);
    if (how === 'cta') {
      track('promo_click', { location });
      openAssistant('promo');
      return;
    }
    track('promo_close', { location, how });
    requestAnimationFrame(() => returnFocus.current?.focus?.());
  };

  // Escape cierra y el tabulador no se escapa de la tarjeta.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close('escape');
      return;
    }
    if (e.key !== 'Tab' || !card.current) return;
    const items = [...card.current.querySelectorAll<HTMLElement>('button')];
    const first = items[0];
    const last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  if (!open) return null;

  return (
    <div className="promo" onClick={(e) => e.target === e.currentTarget && close('fondo')} onKeyDown={onKeyDown} data-lenis-prevent>
      <div ref={card} className="promo__card" role="dialog" aria-modal="true" aria-labelledby="promo-title" aria-describedby="promo-text">
        <button type="button" className="promo__close" onClick={() => close('cerrar')} aria-label="Cerrar la oferta">
          <X aria-hidden="true" />
        </button>
        <TomatoAvatar className="promo__avatar" />
        <span className="promo__label">{encajaPromo.label}</span>
        <h2 id="promo-title" className="promo__title">
          {encajaPromo.title.before}
          <em>{encajaPromo.title.accent}</em>
          {encajaPromo.title.after}
        </h2>
        <p id="promo-text" className="promo__text">
          {encajaPromo.text}
        </p>
        <p className="promo__about">{encajaPromo.about}</p>
        <p className="promo__note">{encajaPromo.note}</p>
        <div className="promo__actions">
          <button ref={cta} type="button" className="promo__cta" onClick={() => close('cta')}>
            <TomatoAvatar />
            <span>{encajaPromo.cta}</span>
          </button>
          <button type="button" className="promo__dismiss" onClick={() => close('dismiss')}>
            {encajaPromo.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
