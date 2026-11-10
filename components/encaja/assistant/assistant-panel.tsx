'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, CalendarClock, CircleAlert, Mail, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { TURNSTILE_DEV_TOKEN, Turnstile, turnstileEnabled, type TurnstileFailure } from '@/components/forms/turnstile';
import { encajaAssistant, type EncajaSlug } from '@/content/encaja';
import { track } from '@/lib/analytics';
import { loadChat, loadSession, openAgenda, saveChat, saveSession, withOpener, type StoredChat, type StoredMessage } from '@/lib/assistant/client';
import type { AssistantError, AssistantEvent, Shown } from '@/lib/assistant/schema';
import { cn } from '@/lib/utils';
import { site } from '@/site.config';
import { TomatoAvatar } from './tomato-avatar';

/**
 * Chat de Mr. Tomate (docs/encaja/asistente.md). Empieza con su saludo (distinto si llega desde la
 * oferta del prototipo). La conversación se manda entera en cada turno a /api/encaja/asistente y
 * la respuesta llega en streaming. Los huecos que propone salen como botones que abren la agenda
 * de la landing con ese hueco ya elegido. Turnstile va invisible salvo que Cloudflare dude.
 *
 * Si se escribe antes de que Turnstile termine (pasa sobre todo en móvil), el mensaje queda en
 * espera a la vista con un indicador animado y sale solo al llegar el token. Si Cloudflare pide
 * marcar la casilla, se avisa y se señala; si falla, se explica y se puede reintentar.
 */

type Props = { open: boolean; onClose: () => void; landing: EncajaSlug; location: string };
/** Estado de la comprobación anti-robots (solo cuenta mientras no hay sesión). */
type Verify = 'checking' | 'interactive' | 'ready' | 'failed' | 'unsupported';

const MAX_CHARS = 500;
const MAX_TURNS = 20;
/** Si la comprobación tarda más que esto con un mensaje esperando, se ofrece reintentar. */
const SLOW_MS = 12000;
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
  const [chat, setChat] = useState<StoredChat>(() => withOpener(loadChat(landing)));
  const [session, setSession] = useState<string | undefined>(() => loadSession(landing));
  const [token, setToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [partial, setPartial] = useState<{ text: string; shown: Shown } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const [verify, setVerifyState] = useState<Verify>('checking');
  const [slow, setSlow] = useState(false);
  /** Tras «Reintentar», el widget de Cloudflare se ve entero (con su propio progreso). */
  const [visibleCheck, setVisibleCheck] = useState(false);
  /** Mensaje enviado antes de pasar Turnstile, a la vista mientras espera. */
  const [pending, setPending] = useState<string | null>(null);

  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  /** Copia de `pending` para los callbacks de Turnstile: sale solo en cuanto llega el token. */
  const waiting = useRef<string | null>(null);
  /** Si el servidor rechaza la verificación, el mensaje se reintenta solo una vez. */
  const requeued = useRef(false);

  const userTurns = chat.messages.filter((m) => m.role === 'user').length;
  const limitReached = userTurns >= MAX_TURNS;
  const needsVerify = !session && turnstileEnabled;

  const setVerify = (v: Verify) => {
    setVerifyState(v);
    setSlow(false);
  };
  const queue = (text: string | null) => {
    waiting.current = text;
    setPending(text);
    setSlow(false);
  };
  /** Nuevo reto de Turnstile desde cero (botón «Reintentar» o token gastado). */
  const reverify = () => {
    setToken('');
    setVerify('checking');
    setTurnstileKey((k) => k + 1);
  };

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

  // Bajar al último mensaje mientras se escribe la respuesta (o mientras espera la comprobación).
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, partial?.text, notice, pending, verify, slow]);

  // Comprobación lenta con un mensaje esperando: se ofrece reintentar.
  useEffect(() => {
    if (!pending || verify !== 'checking') return;
    const t = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => window.clearTimeout(t);
  }, [pending, verify, turnstileKey]);

  useEffect(() => () => abort.current?.abort(), []);

  const fail = (error: AssistantError | 'network') => {
    track('chat_error', { location, type: error });
    if (error === 'session' || error === 'captcha') {
      setSession(undefined);
      saveSession(landing, undefined);
      reverify();
      setNotice('Tenemos que volver a comprobar que no eres un robot. Cuando termine, vuelve a enviar tu mensaje.');
    } else if (error === 'limit') {
      setNotice(copy.limit);
    } else if (error === 'rate') {
      setNotice('Has enviado muchos mensajes seguidos. Espera unos minutos o reserva la llamada abajo.');
    } else {
      setNotice(`Ahora mismo no puedo responder. Puedes reservar la llamada abajo o escribirnos a ${site.email}.`);
    }
  };

  /**
   * `fromInput`: el texto viene del campo (se vacía al enviarlo). `freshToken`: lo manda Turnstile
   * para un mensaje que estaba esperando.
   */
  const send = async (raw: string, opts: { fromInput?: boolean; freshToken?: string } = {}) => {
    const text = raw.trim().slice(0, MAX_CHARS);
    if (!text || busy || limitReached) return;
    if (waiting.current && !opts.freshToken) return; // ya hay uno esperando la comprobación
    const turnstileToken = session ? undefined : turnstileEnabled ? opts.freshToken || token : TURNSTILE_DEV_TOKEN;
    if (!session && !turnstileToken) {
      // Aún sin token: el mensaje queda a la vista, esperando, y sale solo al terminar.
      queue(text);
      if (opts.fromInput) setInput('');
      setNotice(null);
      if (verify === 'failed' || verify === 'unsupported') reverify();
      return;
    }
    queue(null);

    const before = chat.messages;
    const messages: StoredMessage[] = [...before, { role: 'user', content: text }];
    update({ ...chat, messages });
    if (opts.fromInput) setInput('');
    setNotice(null);
    setBusy(true);
    setPartial({ text: '', shown: {} });
    track('chat_message', { location, n: messages.filter((m) => m.role === 'user').length });

    // Si falla, se deshace el mensaje y vuelve al campo para reintentarlo (sin pisar lo que se esté escribiendo).
    const undo = () => {
      update({ ...chat, messages: before });
      setInput((current) => (current.trim() ? current : text));
    };

    const controller = new AbortController();
    abort.current = controller;
    let reply = '';
    const shown: Shown = {};
    let failed: AssistantError | 'network' | null = null;
    let finished = false;
    let gotSession = false;

    try {
      const res = await fetch('/api/encaja/asistente', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ landing, messages, session, turnstileToken, term: readTerm(), entry: chat.entry }),
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
            gotSession = true;
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
      const error = failed ?? 'network';
      // La verificación caducó o no valió: nuevo reto y el mismo mensaje sale solo (una vez).
      if ((error === 'session' || error === 'captcha') && !requeued.current && turnstileEnabled) {
        requeued.current = true;
        update({ ...chat, messages: before });
        setSession(undefined);
        saveSession(landing, undefined);
        reverify();
        queue(text);
        track('chat_error', { location, type: error });
        return;
      }
      // Un token de Turnstile solo vale una vez: si no se llegó a abrir sesión, hace falta otro.
      if (turnstileToken && turnstileEnabled && !gotSession) reverify();
      undo();
      fail(error);
      return;
    }
    requeued.current = false;
    const answer: StoredMessage = { role: 'assistant', content, ...(shown.slots || shown.form ? { shown } : {}) };
    update({ ...chat, messages: [...messages, answer] });
    setAnnounce(content);
  };

  // Turnstile listo: si había un mensaje esperando, sale ya.
  const onToken = (t: string) => {
    setToken(t);
    setVerify('ready');
    const text = waiting.current;
    if (text) void send(text, { freshToken: t });
  };

  // Cloudflare pide marcar la casilla: en móvil se cierra el teclado para que se vea entera.
  const onInteractive = (active: boolean) => {
    setVerify(active ? 'interactive' : 'checking');
    if (!active) return;
    track('chat_verify', { location, step: 'casilla' });
    if (window.matchMedia('(pointer: coarse)').matches && document.activeElement === field.current) field.current?.blur();
  };

  const onVerifyError = (reason: TurnstileFailure, code?: string) => {
    setVerify(reason === 'unsupported' ? 'unsupported' : 'failed');
    track('chat_error', { location, type: 'turnstile', code: code ?? reason });
  };

  const retryVerify = () => {
    track('chat_verify', { location, step: 'reintentar' });
    setVisibleCheck(true);
    reverify();
  };

  const mail = (
    <a href={`mailto:${site.email}`} className="assistant__mail">
      {site.email}
    </a>
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(input, { fromInput: true });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input, { fromInput: true });
    }
  };

  const handoff = (mode: 'llamada' | 'contacto', slot?: string) => {
    track('chat_handoff', { location, mode, with_slot: Boolean(slot) });
    openAgenda({ mode, slot });
    onClose();
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
        {/* Oferta del prototipo: siempre a la vista junto a la agenda, no solo si el modelo lo dice */}
        {chat.entry === 'promo' && (s.slots?.length || s.form) && <p className="assistant__condition">{copy.promoCondition}</p>}
      </>
    );
  };

  const showStarters = userTurns === 0 && !busy && !pending;

  /** Lo que se cuenta de la comprobación: con un mensaje esperando, o si Cloudflare pide algo. */
  const renderVerify = () => {
    if (!needsVerify) return null;
    if (verify === 'failed' || verify === 'unsupported') {
      return (
        <div className="assistant__alert" role="alert">
          <CircleAlert aria-hidden="true" />
          <div className="assistant__alert-body">
            <p>
              {verify === 'unsupported' ? (
                <>Tu navegador no permite la comprobación anti-robots. Prueba desde otro navegador o escríbenos a {mail}.</>
              ) : (
                <>No hemos podido comprobar que no eres un robot. Suele arreglarse al reintentar; si no, escríbenos a {mail}.</>
              )}
            </p>
            {verify === 'failed' && (
              <button type="button" className="assistant__alert-action" onClick={retryVerify}>
                Reintentar
              </button>
            )}
          </div>
        </div>
      );
    }
    if (verify === 'interactive') {
      return (
        <div className="assistant__verify assistant__verify--action" role="status">
          <ArrowDown className="assistant__verify-arrow" aria-hidden="true" />
          <p>
            <strong>Falta un paso: marca la casilla de aquí abajo.</strong>
            {pending ? 'Es la comprobación anti-robots; tu mensaje se envía solo en cuanto la marques.' : 'Es la comprobación anti-robots; después ya puedes escribir.'}
          </p>
        </div>
      );
    }
    if (!pending) return null;
    return (
      <div className="assistant__verify" role="status">
        <span className="assistant__spinner" aria-hidden="true" />
        <div className="assistant__verify-body">
          <p>
            <strong>Comprobando que no eres un robot…</strong>
            {slow ? (
              <>Está tardando más de lo normal. Si no se arregla al reintentar, escríbenos a {mail}.</>
            ) : (
              'Tarda unos segundos. Tu mensaje se envía solo en cuanto termine.'
            )}
          </p>
          {slow && (
            <button type="button" className="assistant__retry" onClick={retryVerify}>
              Volver a intentarlo
            </button>
          )}
        </div>
      </div>
    );
  };
  const starters = chat.entry === 'promo' ? copy.promoStarters : copy.starters[landing];

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
          <TomatoAvatar className="assistant__avatar" />
          <div className="assistant__who">
            <h2 id="assistant-title" className="assistant__title">
              {copy.name} <span className="assistant__badge">{copy.badge}</span>
            </h2>
            <p className="assistant__role">{copy.role}</p>
          </div>
        </div>
        <button type="button" className="assistant__close" onClick={onClose} aria-label="Cerrar el chat">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className="assistant__body" ref={list}>
        {chat.messages.map((m, i) => (
          <div key={i} className="assistant__turn">
            <p className={cn('assistant__msg', m.role === 'user' ? 'assistant__msg--user' : 'assistant__msg--bot')}>
              {m.content}
            </p>
            {m.role === 'assistant' && renderShown(m.shown)}
          </div>
        ))}
        {pending && (
          <div className="assistant__turn">
            <p className="assistant__msg assistant__msg--user assistant__msg--pending">{pending}</p>
          </div>
        )}
        {renderVerify()}
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
          <div className="assistant__starters" role="group" aria-label="Respuestas rápidas">
            {starters.map((s) => (
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

      <form className="assistant__composer" onSubmit={submit}>
        {needsVerify && (
          <Turnstile
            key={turnstileKey}
            className={cn('assistant__turnstile', verify === 'interactive' && 'is-interactive')}
            appearance={visibleCheck ? 'always' : 'interaction-only'}
            onToken={onToken}
            onExpire={() => {
              setToken('');
              setVerify('checking');
            }}
            onInteractive={onInteractive}
            onError={onVerifyError}
          />
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
          <button
            type="submit"
            className="assistant__send"
            disabled={busy || Boolean(pending) || !input.trim() || limitReached}
            aria-label="Enviar"
          >
            <ArrowUp aria-hidden="true" />
          </button>
        </div>
        <p className="assistant__foot">
          {copy.footer}{' '}
          <Link href="/legal/privacidad" target="_blank" rel="noopener noreferrer">
            Privacidad
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </Link>
        </p>
      </form>
    </div>
  );
}
