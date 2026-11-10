'use client';

import Link from 'next/link';
import { ArrowUp, CalendarClock, CircleAlert, Mail, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { TURNSTILE_DEV_TOKEN, Turnstile, turnstileEnabled } from '@/components/forms/turnstile';
import { encajaAssistant, type EncajaSlug } from '@/content/encaja';
import { track } from '@/lib/analytics';
import { loadChat, loadSession, openAgenda, saveChat, saveSession, type StoredChat, type StoredMessage } from '@/lib/assistant/client';
import type { AssistantError, AssistantEvent, Shown } from '@/lib/assistant/schema';
import { cn } from '@/lib/utils';
import { site } from '@/site.config';

/**
 * Chat del asistente (docs/encaja/asistente.md). Antes del primer mensaje enseña qué es y el
 * aviso de DeepSeek; «Empezar» es el consentimiento. La conversación se manda entera en cada
 * turno a /api/encaja/asistente y la respuesta llega en streaming. Los huecos que propone salen
 * como botones que abren la agenda de la landing con ese hueco ya elegido.
 */

type Props = { open: boolean; onClose: () => void; landing: EncajaSlug; location: string };

const MAX_CHARS = 500;
const MAX_TURNS = 20;
const copy = encajaAssistant;

/** Quita el formato Markdown que se le escape al modelo (el chat es texto plano). */
const plain = (s: string) => s.replace(/\*\*|__|^#+\s*/gm, '').replace(/\n{3,}/g, '\n\n');

function readTerm(): string | undefined {
  try {
    const utm = JSON.parse(sessionStorage.getItem('utm') ?? 'null') as Record<string, string> | null;
    return utm?.utm_term?.slice(0, 200) || undefined;
  } catch {
    return undefined;
  }
}

export function AssistantPanel({ open, onClose, landing, location }: Props) {
  const [chat, setChat] = useState<StoredChat>(() => loadChat(landing));
  const [session, setSession] = useState<string | undefined>(() => loadSession(landing));
  const [token, setToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [partial, setPartial] = useState<{ text: string; shown: Shown } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  const userTurns = chat.messages.filter((m) => m.role === 'user').length;
  const limitReached = userTurns >= MAX_TURNS;
  const needsVerify = !session && turnstileEnabled;

  const [tz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid');
  const slotLabel = useMemo(
    () => new Intl.DateTimeFormat('es-ES', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    [tz],
  );

  const update = useCallback(
    (next: StoredChat) => {
      setChat(next);
      saveChat(landing, next);
    },
    [landing],
  );

  // Al abrir: foco en el campo de texto. Escape cierra.
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => field.current?.focus());
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Bajar al último mensaje mientras se escribe la respuesta.
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, partial?.text, notice]);

  useEffect(() => () => abort.current?.abort(), []);

  const fail = (error: AssistantError | 'network') => {
    track('chat_error', { location, type: error });
    if (error === 'session' || error === 'captcha') {
      setSession(undefined);
      saveSession(landing, undefined);
      setToken('');
      setTurnstileKey((k) => k + 1);
      setNotice('Tenemos que volver a comprobar que no eres un robot. Cuando termine, vuelve a enviar tu mensaje.');
    } else if (error === 'limit') {
      setNotice(copy.limit);
    } else if (error === 'rate') {
      setNotice('Has enviado muchos mensajes seguidos. Espera unos minutos o reserva la llamada abajo.');
    } else {
      setNotice(`Ahora mismo no puedo responder. Puedes reservar la llamada abajo o escribirnos a ${site.email}.`);
    }
  };

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, MAX_CHARS);
    if (!text || busy || limitReached) return;
    const turnstileToken = session ? undefined : turnstileEnabled ? token : TURNSTILE_DEV_TOKEN;
    if (!session && !turnstileToken) {
      setNotice('Espera un momento a que termine la verificación antispam y vuelve a enviar.');
      return;
    }

    const before = chat.messages;
    const messages: StoredMessage[] = [...before, { role: 'user', content: text }];
    update({ ...chat, messages });
    setInput('');
    setNotice(null);
    setBusy(true);
    setPartial({ text: '', shown: {} });
    track('chat_message', { location, n: messages.filter((m) => m.role === 'user').length });

    // Si falla, se deshace el mensaje y vuelve al campo para reintentarlo.
    const undo = () => {
      update({ ...chat, messages: before });
      setInput(text);
    };

    const controller = new AbortController();
    abort.current = controller;
    let reply = '';
    const shown: Shown = {};
    let failed: AssistantError | 'network' | null = null;
    let finished = false;

    try {
      const res = await fetch('/api/encaja/asistente', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ landing, messages, session, turnstileToken, term: readTerm() }),
        signal: controller.signal,
      });
      if (!res.body) throw new Error('no_body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const chunk = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!chunk) continue;
          const e = JSON.parse(chunk) as AssistantEvent;
          if (e.t === 'session') {
            setSession(e.token);
            saveSession(landing, e.token);
          } else if (e.t === 'text') {
            reply += e.v;
            setPartial({ text: reply, shown: { ...shown } });
          } else if (e.t === 'slots') {
            shown.slots = e.slots;
            setPartial({ text: reply, shown: { ...shown } });
            track('chat_slots', { location, count: e.slots.length });
          } else if (e.t === 'form') {
            shown.form = e.mode;
            setPartial({ text: reply, shown: { ...shown } });
          } else if (e.t === 'error') {
            failed = e.error;
          } else if (e.t === 'done') {
            finished = true;
          }
        }
      }
    } catch {
      if (!controller.signal.aborted) failed = 'network';
    } finally {
      abort.current = null;
      setBusy(false);
      setPartial(null);
    }

    const content = plain(reply).trim();
    if (failed || !finished || !content) {
      undo();
      fail(failed ?? 'network');
      return;
    }
    const answer: StoredMessage = { role: 'assistant', content, ...(shown.slots || shown.form ? { shown } : {}) };
    update({ ...chat, messages: [...messages, answer] });
    setAnnounce(content);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  const handoff = (mode: 'llamada' | 'contacto', slot?: string) => {
    track('chat_handoff', { location, mode, with_slot: Boolean(slot) });
    openAgenda({ mode, slot });
    onClose();
  };

  const start = () => {
    update({ ...chat, consent: true });
    requestAnimationFrame(() => field.current?.focus());
  };

  const renderShown = (s: Shown | undefined) => {
    if (!s) return null;
    return (
      <>
        {s.slots && s.slots.length > 0 && (
          <div className="assistant__slots" role="group" aria-label="Huecos para la llamada">
            {s.slots.map((iso) => (
              <button key={iso} type="button" className="assistant__slot" onClick={() => handoff('llamada', iso)}>
                <CalendarClock aria-hidden="true" />
                <span>{slotLabel.format(new Date(iso)).replace(/\./g, '')}</span>
              </button>
            ))}
            <button type="button" className="assistant__more" onClick={() => handoff('llamada')}>
              Ver más horas
            </button>
          </div>
        )}
        {s.form && (
          <button type="button" className="assistant__cta" onClick={() => handoff(s.form!)}>
            {s.form === 'contacto' ? <Mail aria-hidden="true" /> : <CalendarClock aria-hidden="true" />}
            <span>{s.form === 'contacto' ? 'Dejar mis datos' : 'Ver la agenda'}</span>
          </button>
        )}
      </>
    );
  };

  const showStarters = chat.consent && userTurns === 0 && !busy;

  return (
    <div
      className={cn('assistant', open && 'is-open')}
      role="dialog"
      aria-modal="false"
      aria-labelledby="assistant-title"
      hidden={!open}
      data-lenis-prevent
    >
      <header className="assistant__head">
        <div className="assistant__heading">
          <h2 id="assistant-title" className="assistant__title">
            {copy.title}
          </h2>
          <span className="assistant__badge">{copy.badge}</span>
        </div>
        <button type="button" className="assistant__close" onClick={onClose} aria-label="Cerrar el asistente">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className="assistant__body" ref={list}>
        <p className="assistant__msg assistant__msg--bot">{copy.intro}</p>

        {!chat.consent ? (
          <div className="assistant__consent">
            <p className="assistant__notice">
              {copy.notice}{' '}
              <Link href="/legal/privacidad" target="_blank" rel="noopener noreferrer">
                Política de privacidad
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </Link>
              .
            </p>
            <button type="button" className="btn btn--primary btn--sm assistant__start" onClick={start}>
              {copy.start}
            </button>
          </div>
        ) : (
          <>
            <p className="assistant__msg assistant__msg--bot">{copy.greeting}</p>
            {chat.messages.map((m, i) => (
              <div key={i} className="assistant__turn">
                <p className={cn('assistant__msg', m.role === 'user' ? 'assistant__msg--user' : 'assistant__msg--bot')}>
                  {m.content}
                </p>
                {m.role === 'assistant' && renderShown(m.shown)}
              </div>
            ))}
            {partial && (
              <div className="assistant__turn">
                {partial.text ? (
                  <p className="assistant__msg assistant__msg--bot">{plain(partial.text)}</p>
                ) : (
                  <p className="assistant__msg assistant__msg--bot assistant__typing" aria-label="Escribiendo">
                    <span />
                    <span />
                    <span />
                  </p>
                )}
                {renderShown(partial.shown)}
              </div>
            )}
            {showStarters && (
              <div className="assistant__starters" role="group" aria-label="Preguntas frecuentes">
                {copy.starters[landing].map((s) => (
                  <button key={s} type="button" className="assistant__starter" onClick={() => void send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {limitReached && !busy && (
              <div className="assistant__turn">
                <p className="assistant__msg assistant__msg--bot">{copy.limit}</p>
                {renderShown({ form: 'llamada' })}
              </div>
            )}
          </>
        )}

        {notice && (
          <div className="assistant__alert" role="alert">
            <CircleAlert aria-hidden="true" />
            <p>{notice}</p>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {chat.consent && (
        <form className="assistant__composer" onSubmit={submit}>
          {needsVerify && (
            <Turnstile key={turnstileKey} className="assistant__turnstile" onToken={setToken} onExpire={() => setToken('')} />
          )}
          <div className="assistant__field">
            <label htmlFor="assistant-input" className="sr-only">
              Tu mensaje
            </label>
            <textarea
              id="assistant-input"
              ref={field}
              rows={1}
              maxLength={MAX_CHARS}
              placeholder={copy.placeholder}
              value={input}
              disabled={limitReached}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button type="submit" className="assistant__send" disabled={busy || !input.trim() || limitReached} aria-label="Enviar">
              <ArrowUp aria-hidden="true" />
            </button>
          </div>
          <p className="assistant__foot">{copy.footer}</p>
        </form>
      )}
    </div>
  );
}
