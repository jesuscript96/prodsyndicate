'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EncajaSlug } from '@/content/encaja';
import { encajaAssistant } from '@/content/encaja';
import { track } from '@/lib/analytics';
import { ASSISTANT_EVENT, enterPromo, type AssistantRequest } from '@/lib/assistant/client';
import type { AssistantEntry } from '@/lib/assistant/schema';
import { TomatoAvatar } from './tomato-avatar';
import './assistant.css';

/**
 * Botón flotante de Mr. Tomate (docs/encaja/asistente.md). El chat se descarga al pasar por
 * encima, al pulsar o al llegar el pop-up de la oferta, para no pesar en la carga de la landing.
 * Se abre también con el evento `encaja:asistente` (pop-up, con `entry: 'promo'`) y con cualquier
 * enlace a `#mr-tomate` (botón del hero).
 */

const loadPanel = () => import('./assistant-panel');
const AssistantPanel = dynamic(() => loadPanel().then((m) => m.AssistantPanel), { ssr: false });

export function AssistantLauncher({ landing, location }: { landing: EncajaSlug; location: string }) {
  const [open, setOpen] = useState(false);
  /** Cambia para volver a montar el chat con la conversación guardada (al pasar a la oferta). */
  const [panelKey, setPanelKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  const show = useCallback(
    (entry: AssistantEntry, source: string) => {
      if (entry === 'promo') {
        enterPromo(landing);
        setPanelKey((k) => k + 1);
      }
      setMounted(true);
      setOpen(true);
      track('chat_open', { location, source, entry });
    },
    [landing, location],
  );

  // Pop-up de la oferta y botón del hero.
  useEffect(() => {
    const onRequest = (e: Event) => show((e as CustomEvent<AssistantRequest>).detail?.entry ?? 'default', 'evento');
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href$="#mr-tomate"]');
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      show('default', 'hero');
    };
    window.addEventListener(ASSISTANT_EVENT, onRequest);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener(ASSISTANT_EVENT, onRequest);
      document.removeEventListener('click', onClick, true);
    };
  }, [show]);

  const hide = () => {
    setOpen(false);
    requestAnimationFrame(() => button.current?.focus());
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className="assistant-launcher"
        hidden={open}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => show('default', 'boton')}
        onPointerEnter={() => void loadPanel()}
        onFocus={() => void loadPanel()}
      >
        <TomatoAvatar className="assistant-launcher__avatar" />
        <span className="assistant-launcher__label">{encajaAssistant.launcher}</span>
      </button>
      {mounted && (
        <AssistantPanel key={panelKey} open={open} onClose={hide} landing={landing} location={location} />
      )}
    </>
  );
}
