'use client';

import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { ContactFormValues } from '@/lib/validators';
import { Field } from '../field';

/**
 * Paso 6 · ¿Cómo te contactamos? — nombre, email, empresa (si aplica), teléfono
 * (opcional) y casilla de consentimiento obligatoria con enlace a privacidad (§8.10).
 */
export function StepContact() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContactFormValues>();
  const consentError = errors.consent?.message;

  return (
    <>
      <div className="field__row">
        <Field name="name" label="Nombre" autoComplete="name" />
        <Field name="email" label="Email" type="email" inputMode="email" autoComplete="email" />
      </div>
      <div className="field__row">
        <Field name="company" label="Empresa" optional hint="Si aplica." autoComplete="organization" />
        <Field name="phone" label="Teléfono" optional type="tel" inputMode="tel" autoComplete="tel" />
      </div>

      <div className="grid gap-2">
        <div className="consent">
          <input
            id="field-consent"
            type="checkbox"
            className="consent__input"
            aria-required={true}
            aria-invalid={consentError ? true : undefined}
            aria-describedby={consentError ? 'field-consent-error' : undefined}
            {...register('consent')}
          />
          <label htmlFor="field-consent" className="consent__label">
            He leído y acepto la{' '}
            <Link href="/legal/privacidad" target="_blank" rel="noopener noreferrer">
              política de privacidad
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </Link>
            . Usaremos tus datos solo para responder a esta solicitud.
          </label>
        </div>
        {consentError && (
          <p id="field-consent-error" className="field__error" role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{consentError}</span>
          </p>
        )}
      </div>
    </>
  );
}
