'use client';

import dynamic from 'next/dynamic';
import { MessageCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import type { EncajaSlug } from '@/content/encaja';
import { encajaAssistant } from '@/content/encaja';
import { track } from '@/lib/analytics';
import './assistant.css';

/**
 * Botón flotante del asistente (docs/encaja/asistente.md). El chat se descarga solo al pasar
 * por encima o al pulsar, para no pesar en la carga de la landing. No se abre solo.
 */

const loadPanel = () => import('./assistant-panel');
const AssistantPanel = dynamic(() => loadPanel().then((m) => m.AssistantPanel), { ssr: false });

export function AssistantLauncher({ landing, location }: { landing: EncajaSlug; location: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  const show = () => {
    setMounted(true);
    setOpen(true);
    track('chat_open', { location });
  };

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
        onClick={show}
        onPointerEnter={() => void loadPanel()}
        onFocus={() => void loadPanel()}
      >
        <MessageCircle aria-hidden="true" />
        <span className="assistant-launcher__label">{encajaAssistant.launcher}</span>
      </button>
      {mounted && <AssistantPanel open={open} onClose={hide} landing={landing} location={location} />}
    </>
  );
}
