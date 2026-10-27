'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CircleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { FormProvider, useForm, type DefaultValues, type FieldErrors } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import type { PostMeta } from '@/content/types';
import { track } from '@/lib/analytics';
import { gsap, useGSAP } from '@/lib/gsap';
import { clamp } from '@/lib/utils';
import {
  STEP_COUNT,
  STEP_FIELDS,
  contactFormSchema,
  stepOfField,
  toContactInput,
  type ContactFormField,
  type ContactFormValues,
} from '@/lib/validators';
import { site } from '@/site.config';
import { ContactSuccess } from './contact-success';
import { StepAudience } from './steps/step-audience';
import { StepContact } from './steps/step-contact';
import { StepMessage } from './steps/step-message';
import { StepNeeds } from './steps/step-needs';
import { StepStage } from './steps/step-stage';
import { StepTimelineBudget } from './steps/step-timeline-budget';
import { TURNSTILE_DEV_TOKEN, Turnstile, turnstileEnabled } from './turnstile';
import { WizardProgress } from './wizard-progress';
import './forms.css';

/* ───────────── Pasos (§8.10) ───────────── */

const STEPS = [
  { id: 'audience', title: '¿Quién eres?', Component: StepAudience },
  { id: 'needs', title: '¿Qué necesitas?', Component: StepNeeds },
  { id: 'stage', title: '¿En qué punto estás?', Component: StepStage },
  { id: 'timeline', title: '¿Plazos y presupuesto?', Component: StepTimelineBudget },
  { id: 'message', title: 'Cuéntanos más', Component: StepMessage },
  { id: 'contact', title: '¿Cómo te contactamos?', Component: StepContact },
] as const;

const LAST = STEP_COUNT - 1;
const DRAFT_KEY = 'contact-draft';

const defaultValues: DefaultValues<ContactFormValues> = {
  needs: [],
  budget: undefined,
  message: '',
  linksText: '',
  name: '',
  email: '',
  company: '',
  phone: '',
  consent: false,
  website: '',
};

type Status = 'idle' | 'sending' | 'error' | 'success';
type ErrorType = 'validation' | 'captcha' | 'server' | 'network' | 'config';

type ApiResponse = {
  ok?: boolean;
  error?: string;
  issues?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
};

type Draft = { v: 1; step: number; values: Partial<ContactFormValues> };

/* ───────────── sessionStorage (autoguardado, utm y origen) ───────────── */

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Draft>;
    if (d.v !== 1 || typeof d.values !== 'object' || !d.values) return null;
    return { v: 1, step: typeof d.step === 'number' ? d.step : 0, values: d.values };
  } catch {
    return null;
  }
}

function writeDraft(step: number, values: Partial<ContactFormValues>) {
  try {
    // Nunca se guarda el honeypot ni el token de Turnstile (no forma parte de `values`).
    const safe = Object.fromEntries(Object.entries(values).filter(([k]) => k !== 'website'));
    const draft: Draft = { v: 1, step, values: safe as Partial<ContactFormValues> };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* sessionStorage no disponible */
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nada */
  }
}

function readAttribution(): { utm?: Record<string, string>; source?: string } {
  try {
    const out: { utm?: Record<string, string>; source?: string } = {};
    const rawUtm = sessionStorage.getItem('utm');
    if (rawUtm) {
      const parsed: unknown = JSON.parse(rawUtm);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const utm: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === 'string') utm[k.slice(0, 60)] = v.slice(0, 200);
        }
        if (Object.keys(utm).length) out.utm = utm;
      }
    }
    const source = sessionStorage.getItem('source');
    if (source) out.source = source.slice(0, 200);
    return out;
  } catch {
    return {};
  }
}

/* ───────────── Asistente ───────────── */

type Props = {
  /** Dos artículos recomendados para el estado de éxito (puede ir vacío). */
  posts: PostMeta[];
};

/**
 * Asistente de contacto en 6 pasos (§8.10, §9.4): react-hook-form + zod por paso,
 * barra de progreso, Atrás, autoguardado en sessionStorage, foco al título de
 * cada paso (aria-live), errores enlazados y foco al primer error, honeypot y
 * Turnstile en el último paso. Eventos: form_start, form_step, form_submit, form_error.
 */
export function ContactWizard({ posts }: Props) {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
    mode: 'onTouched',
    shouldFocusError: true,
  });
  const { handleSubmit, trigger, reset, getValues, setError, setFocus, subscribe, register } = form;

  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [token, setToken] = useState('');
  const [tokenMissing, setTokenMissing] = useState(false);
  const [turnstileKey, setTurnstileKey] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const navigated = useRef(false);
  const restored = useRef(false);
  const stepRef = useRef(0);

  /* Restaurar borrador (solo cliente, tras la hidratación) */
  useEffect(() => {
    const draft = readDraft();
    if (!draft) {
      restored.current = true;
      return;
    }
    reset({ ...defaultValues, ...draft.values, website: '' } as ContactFormValues, { keepDefaultValues: true });
    const target = clamp(draft.step, 0, LAST);
    // El autoguardado no escribe hasta terminar la restauración: si no, el doble
    // montaje de StrictMode guardaría el paso 0 y la segunda pasada lo leería.
    const id = window.setTimeout(() => {
      setStep(target);
      restored.current = true;
    }, 0);
    return () => window.clearTimeout(id);
  }, [reset]);

  /* Autoguardado: cada cambio de valores y cada cambio de paso */
  useEffect(() => {
    stepRef.current = step;
    if (restored.current) writeDraft(step, getValues());
  }, [step, getValues]);

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        if (restored.current) writeDraft(stepRef.current, values);
      },
    });
    return unsubscribe;
  }, [subscribe]);

  /* Foco al título del paso tras navegar (no en la carga inicial) */
  useEffect(() => {
    if (!navigated.current) return;
    titleRef.current?.focus({ preventScroll: false });
  }, [step]);

  /* Entrada suave del panel al cambiar de paso (solo transform/opacity) */
  useGSAP(
    () => {
      const el = panelRef.current;
      if (!el || !navigated.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(el, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' });
      });
      return () => mm.revert();
    },
    { dependencies: [step], scope: rootRef },
  );

  const onFirstFocus = () => {
    if (started.current) return;
    started.current = true;
    track('form_start');
  };

  const goTo = useCallback((next: number) => {
    navigated.current = true;
    setStep(clamp(next, 0, LAST));
  }, []);

  const goNext = useCallback(async () => {
    const ok = await trigger(STEP_FIELDS[step] as ContactFormField[], { shouldFocus: true });
    if (!ok) {
      track('form_error', { type: 'validation' });
      return;
    }
    const next = step + 1;
    goTo(next);
    track('form_step', { step: next + 1 });
  }, [goTo, step, trigger]);

  const goBack = () => {
    setStatus((s) => (s === 'error' ? 'idle' : s));
    goTo(step - 1);
  };

  /** Lleva al usuario al paso del primer error y lo enfoca. */
  const jumpToFirstError = useCallback(
    (fields: string[]) => {
      const steps = fields.map(stepOfField).filter((i) => i >= 0).sort((a, b) => a - b);
      const target = steps[0];
      if (target === undefined) return;
      if (target !== stepRef.current) goTo(target);
      const first = fields.find((f) => stepOfField(f) === target) as ContactFormField | undefined;
      if (first) window.setTimeout(() => setFocus(first), 0);
    },
    [goTo, setFocus],
  );

  const onInvalid = (errors: FieldErrors<ContactFormValues>) => {
    track('form_error', { type: 'validation' });
    jumpToFirstError(Object.keys(errors));
  };

  const send = async (values: ContactFormValues) => {
    const turnstileToken = turnstileEnabled ? token : TURNSTILE_DEV_TOKEN;
    if (!turnstileToken) {
      setTokenMissing(true);
      return;
    }
    setTokenMissing(false);
    setStatus('sending');
    setErrorType(null);

    const payload = toContactInput(values, { turnstileToken, ...readAttribution() });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        clearDraft();
        track('form_submit', { audience: values.audience });
        setStatus('success');
        return;
      }

      const type: ErrorType =
        data.error === 'validation' || data.error === 'captcha' || data.error === 'config' ? data.error : 'server';
      track('form_error', { type });
      setErrorType(type);
      setStatus('error');

      if (type === 'validation' && data.issues?.fieldErrors) {
        const fields: string[] = [];
        for (const [key, msgs] of Object.entries(data.issues.fieldErrors)) {
          const field = (key === 'links' ? 'linksText' : key) as ContactFormField;
          if (stepOfField(field) < 0 || !msgs?.length) continue;
          setError(field, { type: 'server', message: msgs[0] });
          fields.push(field);
        }
        jumpToFirstError(fields);
      }
      if (type === 'captcha') {
        // El token ya no sirve: se vuelve a montar el widget para verificar de nuevo.
        setToken('');
        setTurnstileKey((k) => k + 1);
      }
    } catch {
      track('form_error', { type: 'network' });
      setErrorType('network');
      setStatus('error');
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'sending') return;
    if (step < LAST) {
      void goNext();
      return;
    }
    void handleSubmit(send, onInvalid)(e);
  };

  if (status === 'success') return <ContactSuccess posts={posts} />;

  const { title, Component } = STEPS[step];
  const isLast = step === LAST;

  return (
    <div ref={rootRef}>
      <FormProvider {...form}>
        <form
          className="card wizard"
          onSubmit={onSubmit}
          onFocusCapture={onFirstFocus}
          noValidate
          aria-busy={status === 'sending' || undefined}
          data-step={step + 1}
        >
          <div className="wizard__head">
            <WizardProgress step={step + 1} total={STEP_COUNT} />
            <div className="wizard__live" aria-live="polite" aria-atomic="true">
              <p className="label">
                Paso {step + 1} de {STEP_COUNT}
              </p>
              <h2 ref={titleRef} tabIndex={-1} className="h3 wizard__title">
                {title}
              </h2>
            </div>
          </div>

          <div ref={panelRef} key={step} className="wizard__panel">
            <Component />
            {isLast && (
              <div className="wizard__antispam">
                <Turnstile
                  key={turnstileKey}
                  onToken={(t) => {
                    setToken(t);
                    setTokenMissing(false);
                  }}
                  onExpire={() => setToken('')}
                />
                {tokenMissing && (
                  <p className="field__error" role="alert">
                    <CircleAlert aria-hidden="true" />
                    <span>Completa la verificación antispam para enviar.</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Honeypot (§9.4): los humanos no lo ven ni lo alcanzan con el teclado */}
          <input
            type="text"
            className="hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            {...register('website')}
          />

          {status === 'error' && (
            <div className="wizard__alert" role="alert">
              <CircleAlert aria-hidden="true" />
              <p>
                No hemos podido enviarlo. Inténtalo de nuevo o escríbenos a{' '}
                <a href={`mailto:${site.email}`}>{site.email}</a>.
                {errorType === 'captcha' && ' La verificación antispam ha caducado: complétala otra vez.'}
                {errorType === 'validation' && ' Revisa los campos marcados.'}
              </p>
            </div>
          )}

          <div className="wizard__nav">
            {step > 0 ? (
              <Button variant="ghost" onClick={goBack} magnetic={false} disabled={status === 'sending'}>
                <ArrowLeft aria-hidden="true" className="inline-block size-[18px] align-[-3px]" /> Atrás
              </Button>
            ) : (
              <span className="wizard__nav-spacer" />
            )}
            <Button type="submit" arrow={!isLast} disabled={status === 'sending'}>
              {isLast ? (status === 'sending' ? 'Enviando…' : 'Enviar') : 'Siguiente'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
