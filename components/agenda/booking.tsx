'use client';

import Link from 'next/link';
import { Check, CircleAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { TURNSTILE_DEV_TOKEN, Turnstile, turnstileEnabled } from '@/components/forms/turnstile';
import { Button } from '@/components/ui/button';
import { track, trackLead, type LeadType } from '@/lib/analytics';
import { consentCopy } from '@/lib/agenda/consent';
import type { AvailabilityResponse, BookingResponse, ContactLeadResponse } from '@/lib/agenda/schema';
import { PROMO_BUSINESS_DAYS, promoMinStart } from '@/lib/agenda/promo';
import { AGENDA_EVENT, isPromoChat, readChatForLead, type AgendaRequest } from '@/lib/assistant/client';
import { readAttribution } from '@/lib/attribution';
import { cn } from '@/lib/utils';
import { site } from '@/site.config';
import '@/components/forms/forms.css';
import './booking.css';

/**
 * Cierre de las landings (docs/agenda-google.md): reservar una llamada o, si se prefiere, dejar los
 * datos para que escribamos nosotros. Las dos vías acaban en Valme OS (CRM y correo con el resumen
 * en PDF de la landing) y cuentan como conversión.
 *
 * Llamada: pide los huecos libres al acercarse, agrupa por día en la zona horaria de quien visita
 * y al confirmar crea el evento con Google Meet. Contacto: mismo formulario sin hueco
 * (/api/encaja/contacto); también es la salida cuando la agenda no carga o no tiene huecos.
 * Turnstile solo se carga al llegar al formulario.
 * Eventos: form_start, form_submit y form_error con `lead_type`; en GTM, `generate_lead`.
 *
 * Asistente (docs/encaja/asistente.md): escucha `encaja:agenda` para abrirse con el hueco o el modo
 * que se eligió en el chat, y si hubo conversación la adjunta al lead para que el equipo la vea.
 * Si la conversación viene de la oferta del prototipo, solo enseña huecos a partir de 3 días
 * laborables (hay que prepararlo antes) y marca el lead como `promo`.
 */

type Props = {
  /** Landing o página de origen (analítica, evento del calendario y landing de Valme OS) */
  landing: string;
  /** Ubicación para analítica */
  location: string;
  /**
   * Ofrecer «te escribimos nosotros» (por defecto, sí). En /contacto no hace falta: la página ya
   * es el formulario, y si la agenda no carga se ofrece el email.
   */
  withContact?: boolean;
  /** Sin marco de tarjeta, para meterla dentro de otra tarjeta. */
  bare?: boolean;
  className?: string;
};

type Values = { name: string; email: string; company: string; phone: string; message: string; consent: boolean };
type FieldName = keyof Values;
type Done = { mode: LeadType; email: string; start?: string; meetUrl?: string; presentationUrl?: string; mock?: boolean };
type ApiResponse = (BookingResponse | ContactLeadResponse) & {
  issues?: { fieldErrors?: Partial<Record<string, string[]>> };
};

const EMPTY: Values = { name: '', email: '', company: '', phone: '', message: '', consent: false };
const AGENDA_TZ = 'Europe/Madrid';
const MAX_MESSAGE = 1000;

function validate(v: Values): Partial<Record<FieldName, string>> {
  const e: Partial<Record<FieldName, string>> = {};
  if (v.name.trim().length < 2) e.name = 'Escribe tu nombre';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = v.email.trim() ? 'Email no válido' : 'Escribe tu email';
  if (v.message.length > MAX_MESSAGE) e.message = `Máximo ${MAX_MESSAGE} caracteres`;
  if (!v.consent) e.consent = 'Debes aceptar la política de privacidad';
  return e;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Booking({ landing, location, withContact = true, bare = false, className }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const tracked = useRef(false);

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const [slots, setSlots] = useState<string[]>([]);
  const [mock, setMock] = useState(false);
  const [mode, setMode] = useState<LeadType>('llamada');
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [website, setWebsite] = useState('');
  const [token, setToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  /** Hueco elegido en el chat del asistente, pendiente de que cargue la agenda */
  const pending = useRef<string | null>(null);
  /** La conversación con Mr. Tomate viene de la oferta del prototipo */
  const [promo, setPromo] = useState(false);

  // Zona horaria de quien visita (solo se usa una vez cargada la agenda, ya en el navegador)
  const [tz] = useState(() =>
    typeof window === 'undefined' ? AGENDA_TZ : Intl.DateTimeFormat().resolvedOptions().timeZone || AGENDA_TZ,
  );

  const fmt = useMemo(
    () => ({
      key: new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }),
      weekday: new Intl.DateTimeFormat('es-ES', { timeZone: tz, weekday: 'short' }),
      date: new Intl.DateTimeFormat('es-ES', { timeZone: tz, day: 'numeric', month: 'short' }),
      time: new Intl.DateTimeFormat('es-ES', { timeZone: tz, hour: '2-digit', minute: '2-digit' }),
      long: new Intl.DateTimeFormat('es-ES', {
        timeZone: tz,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }),
    [tz],
  );

  const days = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of slots) {
      const k = fmt.key.format(new Date(s));
      const list = map.get(k);
      if (list) list.push(s);
      else map.set(k, [s]);
    }
    return [...map.entries()].map(([key, list]) => ({ key, slots: list }));
  }, [slots, fmt]);

  const activeDay = days.find((d) => d.key === day) ?? days[0];
  const agendaOk = status === 'ready' && days.length > 0;
  /** Sin agenda (no carga o no hay huecos) solo queda dejar los datos. */
  const noAgenda = status === 'unavailable' || (status === 'ready' && days.length === 0);
  const kind: LeadType = withContact && noAgenda ? 'contacto' : mode;
  const isCall = kind === 'llamada';

  /** Deja elegido el hueco que se escogió en el chat, si sigue libre. */
  const applyWanted = useCallback(
    (wanted: string, list: string[]) => {
      const s = new Date(wanted).toISOString();
      if (!list.includes(s)) {
        setNotice('Ese hueco ya no está libre. Elige otro, por favor.');
        return;
      }
      setDay(fmt.key.format(new Date(s)));
      setSlot(s);
      if (!tracked.current) {
        tracked.current = true;
        track('form_start', { location, lead_type: 'llamada' });
      }
    },
    [fmt, location],
  );

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/agenda/disponibilidad', { cache: 'no-store' });
      const data = (await res.json()) as AvailabilityResponse;
      if (!res.ok || !data.ok) throw new Error(data.ok ? 'http' : data.error);
      const isPromo = isPromoChat(landing);
      const min = isPromo ? promoMinStart() : 0;
      const list = min ? data.slots.filter((s) => Date.parse(s) >= min) : data.slots;
      setPromo(isPromo);
      setSlots(list);
      setMock(Boolean(data.mock));
      setStatus('ready');
      if (pending.current) {
        applyWanted(pending.current, list);
        pending.current = null;
      }
    } catch {
      setStatus('unavailable');
    }
  }, [applyWanted, landing]);

  // Pide la agenda al acercarse (o al llegar por el ancla), no en cada visita que rebota arriba.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const start = () => {
      if (started.current) return;
      started.current = true;
      void load();
    };
    if (!('IntersectionObserver' in window)) {
      start();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: '900px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  // Del chat a la agenda: modo (llamada o contacto) y, si lo hay, el hueco ya elegido.
  useEffect(() => {
    const onAgenda = (e: Event) => {
      const detail = (e as CustomEvent<AgendaRequest>).detail;
      if (!detail) return;
      setMode(detail.mode === 'contacto' && withContact ? 'contacto' : 'llamada');
      setNotice(null);
      setErrors({});
      // Se recarga siempre: la agenda puede haber cambiado y, si viene de la oferta, se filtra.
      pending.current = detail.mode === 'llamada' && detail.slot ? detail.slot : null;
      started.current = true;
      void load();
      const target = root.current?.closest('section') ?? root.current;
      if (target) {
        const lenis = window.__lenis;
        if (lenis) lenis.scrollTo(target, { offset: -96 });
        else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      requestAnimationFrame(() => headRef.current?.focus({ preventScroll: true }));
    };
    window.addEventListener(AGENDA_EVENT, onAgenda);
    return () => window.removeEventListener(AGENDA_EVENT, onAgenda);
  }, [load, withContact]);

  const tzNote = [
    tz === AGENDA_TZ ? 'Horas en hora peninsular española.' : `Horas en tu zona horaria (${tz.replace(/_/g, ' ')}).`,
    promo ? `Los huecos empiezan a ${PROMO_BUSINESS_DAYS} días laborables: así nos da tiempo a preparar tu prototipo.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const contactIntro =
    status === 'unavailable'
      ? 'Ahora mismo no podemos enseñarte la agenda. Déjanos tus datos y te escribimos para buscar un hueco.'
      : noAgenda
        ? 'No quedan huecos libres en los próximos días. Déjanos tus datos y te escribimos para buscar uno.'
        : 'Déjanos tus datos y te escribimos para ver tu caso. Te mandamos también el resumen de una página por email.';

  const markStarted = (leadType: LeadType) => {
    if (tracked.current) return;
    tracked.current = true;
    track('form_start', { location, lead_type: leadType });
  };

  const pickSlot = (s: string) => {
    markStarted('llamada');
    setSlot(s);
    setNotice(null);
  };

  const switchMode = (next: LeadType) => {
    setMode(next);
    setNotice(null);
    setErrors({});
    requestAnimationFrame(() => headRef.current?.focus());
  };

  const set = <K extends FieldName>(name: K, value: Values[K]) => {
    markStarted(kind);
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const fail = (message: string, type: string) => {
    track('form_error', { type, location, lead_type: kind });
    setNotice(message);
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending || (isCall && !slot)) return;
    const found = validate(values);
    if (Object.keys(found).length) {
      setErrors(found);
      track('form_error', { type: 'validation', location, lead_type: kind });
      const first = (['name', 'email', 'message', 'consent'] as const).find((k) => found[k]);
      if (first) document.getElementById(`booking-${first}`)?.focus();
      return;
    }
    const turnstileToken = turnstileEnabled ? token : TURNSTILE_DEV_TOKEN;
    if (!turnstileToken) {
      setNotice('Espera un momento a que termine la verificación antispam y vuelve a pulsar.');
      return;
    }

    setSending(true);
    setNotice(null);
    const attribution = readAttribution();
    const lead = {
      name: values.name,
      email: values.email,
      company: values.company || undefined,
      phone: values.phone || undefined,
      message: values.message || undefined,
      consent: values.consent,
      website,
      turnstileToken,
      landing,
      source: [`lp-${landing}`, attribution.source].filter(Boolean).join(' · ').slice(0, 200),
      utm: attribution.utm,
      clicks: attribution.clicks,
      fbp: attribution.fbp,
      fbc: attribution.fbc,
      pixelConsent: attribution.pixelConsent,
      chat: readChatForLead(landing),
      promo: isPromoChat(landing) || undefined,
    };
    try {
      const res = await fetch(isCall ? '/api/agenda/reservar' : '/api/encaja/contacto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(isCall ? { start: slot, ...lead } : lead),
      });
      const data = (await res.json().catch(() => ({}))) as ApiResponse;

      if (res.ok && data.ok) {
        track('form_submit', { location, lead_type: kind });
        trackLead(kind, landing);
        setDone({
          mode: kind,
          email: values.email.trim(),
          start: 'start' in data ? data.start : undefined,
          meetUrl: 'meetUrl' in data ? data.meetUrl : undefined,
          presentationUrl: data.presentationUrl,
          mock: data.mock,
        });
        requestAnimationFrame(() => doneRef.current?.focus());
        return;
      }

      const error = data.ok === false ? data.error : 'server';
      // El servidor ya ha gastado el token de Turnstile (salvo en la validación): hace falta otro.
      if (error !== 'validation') {
        setToken('');
        setTurnstileKey((k) => k + 1);
      }
      if (error === 'slot_taken') {
        setSlot(null);
        fail('Ese hueco se acaba de ocupar. Elige otro, por favor.', error);
        void load();
      } else if (error === 'validation') {
        const fe = data.issues?.fieldErrors ?? {};
        const next: Partial<Record<FieldName, string>> = {};
        for (const k of ['name', 'email', 'company', 'phone', 'message', 'consent'] as const) {
          if (fe[k]?.length) next[k] = fe[k]![0];
        }
        setErrors(next);
        fail('Revisa los campos marcados.', error);
      } else if (error === 'captcha') {
        fail('No hemos podido verificar que no eres un robot. Vuelve a intentarlo.', error);
      } else if (isCall) {
        fail(`No hemos podido reservar la llamada. Escríbenos a ${site.email} y te proponemos un hueco.`, error);
      } else {
        fail(`No hemos podido enviar tus datos. Escríbenos a ${site.email} y te respondemos.`, error);
      }
    } catch {
      fail(`No hay conexión. Vuelve a intentarlo o escríbenos a ${site.email}.`, 'network');
    } finally {
      setSending(false);
    }
  };

  /* ───────────── Estados ───────────── */

  if (done) {
    const firstName = values.name.trim().split(/\s+/)[0];
    return (
      <div className={cn('booking', bare ? 'booking--bare' : 'card', className)} ref={root}>
        <div className="booking__done" role="status">
          <span className="booking__done-icon" aria-hidden="true">
            <Check />
          </span>
          {done.mode === 'llamada' && done.start ? (
            <>
              <h3 ref={doneRef} tabIndex={-1} className="h3 booking__done-title">
                Llamada reservada
              </h3>
              <p className="body-l">{capitalize(fmt.long.format(new Date(done.start)))}</p>
              <p className="text-ink-2">
                Te hemos enviado la invitación con el enlace de Google Meet a <strong>{done.email}</strong>
                {done.presentationUrl ? ', junto con un resumen de una página para preparar la llamada' : ''}. Si en
                unos minutos no la ves, mira en correo no deseado.
              </p>
            </>
          ) : (
            <>
              <h3 ref={doneRef} tabIndex={-1} className="h3 booking__done-title">
                Recibido{firstName ? `, ${firstName}` : ''}
              </h3>
              <p className="text-ink-2">
                Te escribimos a <strong>{done.email}</strong> para ver tu caso.
                {done.presentationUrl
                  ? ' Mientras, aquí tienes el resumen de una página con lo que puedes esperar y cómo trabajamos; te lo mandamos también por email.'
                  : ''}
              </p>
            </>
          )}
          <div className="booking__done-actions">
            {done.presentationUrl && (
              <Button href={done.presentationUrl} external arrow="up">
                Ver el resumen
              </Button>
            )}
            {done.meetUrl && (
              <Button href={done.meetUrl} external variant="secondary" arrow="up">
                Abrir Google Meet
              </Button>
            )}
          </div>
          {done.mock && <p className="label">Modo de prueba: no se ha creado ni enviado nada.</p>}
        </div>
      </div>
    );
  }

  const showForm = !isCall || Boolean(slot);

  return (
    <div className={cn('booking', bare ? 'booking--bare' : 'card', className)} ref={root} aria-busy={status === 'loading' || undefined}>
      <div className="booking__head">
        <h3 ref={headRef} tabIndex={-1} className="h4 booking__title">
          {isCall ? 'Elige un hueco' : 'Te escribimos nosotros'}
        </h3>
        <p className="booking__tz">{isCall ? tzNote : contactIntro}</p>
      </div>

      {isCall && (status === 'idle' || status === 'loading') && (
        <div className="booking__skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {isCall && status === 'loading' && <p className="sr-only">Cargando la agenda…</p>}

      {isCall && noAgenda && (
        <div className="booking__fallback">
          <p>
            {status === 'unavailable'
              ? 'Ahora mismo no podemos enseñarte la agenda. Escríbenos y te proponemos un hueco.'
              : 'No quedan huecos libres en los próximos días. Escríbenos y buscamos uno.'}
          </p>
          <Button href={`mailto:${site.email}?subject=${encodeURIComponent('Llamada de 30 minutos')}`} arrow>
            {site.email}
          </Button>
        </div>
      )}

      {isCall && agendaOk && activeDay && (
        <>
          <fieldset className="booking__group">
            <legend className="sr-only">Día</legend>
            <div className="booking__days">
              {days.map((d) => {
                const date = new Date(d.slots[0]);
                return (
                  <label key={d.key} className="booking__day">
                    <input
                      type="radio"
                      name="booking-day"
                      value={d.key}
                      checked={d.key === activeDay.key}
                      onChange={() => setDay(d.key)}
                    />
                    <span>
                      <span className="booking__day-week">{fmt.weekday.format(date).replace('.', '')}</span>
                      <span className="booking__day-date">{fmt.date.format(date).replace('.', '')}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="booking__group">
            <legend className="sr-only">Hora</legend>
            <div className="booking__times">
              {activeDay.slots.map((s) => (
                <label key={s} className="booking__time">
                  <input type="radio" name="booking-time" value={s} checked={slot === s} onChange={() => pickSlot(s)} />
                  <span>{fmt.time.format(new Date(s))}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {mock && <p className="label">Modo de prueba: horario completo, sin consultar Google Calendar.</p>}
        </>
      )}

      {showForm && (
        <form className={cn('booking__form', !isCall && 'booking__form--plain')} onSubmit={submit} noValidate>
          {isCall && slot && (
            <p className="booking__picked">
              <span className="label">Tu llamada</span>
              <span>{capitalize(fmt.long.format(new Date(slot)))}</span>
            </p>
          )}

          <div className="field__row">
            <TextField id="name" label="Nombre" value={values.name} error={errors.name} autoComplete="name" onChange={(v) => set('name', v)} />
            <TextField
              id="email"
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              hint={isCall ? 'Aquí te llega la invitación de Google Meet.' : 'Aquí te escribimos y te mandamos el resumen.'}
              value={values.email}
              error={errors.email}
              onChange={(v) => set('email', v)}
            />
          </div>
          <div className="field__row">
            <TextField id="company" label="Empresa" optional autoComplete="organization" value={values.company} error={errors.company} onChange={(v) => set('company', v)} />
            <TextField id="phone" label="Teléfono" optional type="tel" inputMode="tel" autoComplete="tel" value={values.phone} error={errors.phone} onChange={(v) => set('phone', v)} />
          </div>
          <TextField
            id="message"
            label="¿Qué proceso te quita más tiempo?"
            optional
            textarea
            value={values.message}
            error={errors.message}
            onChange={(v) => set('message', v)}
          />

          <div className="hp" aria-hidden="true">
            <label htmlFor="booking-website">No rellenes este campo</label>
            <input id="booking-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <div className="consent">
              <input
                id="booking-consent"
                type="checkbox"
                className="consent__input"
                checked={values.consent}
                aria-required={true}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? 'booking-consent-error' : undefined}
                onChange={(e) => set('consent', e.target.checked)}
              />
              <label htmlFor="booking-consent" className="consent__label">
                He leído y acepto la{' '}
                <Link href="/legal/privacidad" target="_blank" rel="noopener noreferrer">
                  política de privacidad
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </Link>
                . {consentCopy[kind]}
              </label>
            </div>
            {errors.consent && (
              <p id="booking-consent-error" className="field__error" role="alert">
                <CircleAlert aria-hidden="true" />
                <span>{errors.consent}</span>
              </p>
            )}
          </div>

          <Turnstile key={turnstileKey} onToken={setToken} onExpire={() => setToken('')} />

          {notice && (
            <div ref={alertRef} tabIndex={-1} className="wizard__alert" role="alert">
              <CircleAlert aria-hidden="true" />
              <p className="m-0">{notice}</p>
            </div>
          )}

          <Button type="submit" arrow disabled={sending} className="booking__submit">
            {isCall ? (sending ? 'Reservando…' : 'Confirmar llamada') : sending ? 'Enviando…' : 'Enviar mis datos'}
          </Button>
        </form>
      )}

      {!showForm && notice && (
        <div ref={alertRef} tabIndex={-1} className="wizard__alert" role="alert">
          <CircleAlert aria-hidden="true" />
          <p className="m-0">{notice}</p>
        </div>
      )}

      {/* Cambio de vía: escribir en vez de reservar, o volver a la agenda si tiene huecos */}
      {withContact && isCall && status !== 'unavailable' && (
        <p className="booking__switch">
          ¿Ninguna hora te va bien?{' '}
          <button type="button" onClick={() => switchMode('contacto')}>
            Déjanos tus datos y te escribimos
          </button>
        </p>
      )}
      {withContact && !isCall && agendaOk && (
        <p className="booking__switch">
          ¿Prefieres hablar ya?{' '}
          <button type="button" onClick={() => switchMode('llamada')}>
            Elige un hueco en la agenda
          </button>
        </p>
      )}
    </div>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
  textarea?: boolean;
  type?: string;
  inputMode?: 'text' | 'email' | 'tel';
  autoComplete?: string;
};

function TextField({ id, label, value, onChange, error, hint, optional, textarea, type = 'text', inputMode, autoComplete }: TextFieldProps) {
  const fieldId = `booking-${id}`;
  const describedBy = [hint ? `${fieldId}-hint` : null, error ? `${fieldId}-error` : null].filter(Boolean).join(' ') || undefined;
  const shared = {
    id: fieldId,
    value,
    className: cn('field__input', textarea && 'field__textarea field__textarea--short'),
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': optional ? undefined : true,
    autoComplete,
  };
  return (
    <div className="field">
      <label htmlFor={fieldId} className="field__label">
        {label} {optional && <span className="field__optional">(opcional)</span>}
      </label>
      {hint && (
        <p id={`${fieldId}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {textarea ? (
        <textarea {...shared} rows={3} maxLength={MAX_MESSAGE} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...shared} type={type} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && (
        <p id={`${fieldId}-error`} className="field__error" role="alert">
          <CircleAlert aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
