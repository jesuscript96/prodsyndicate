'use client';

import { Check, CircleAlert } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { ContactFormValues, Option } from '@/lib/validators';
import { cn } from '@/lib/utils';

type ChoiceField = 'audience' | 'needs' | 'stage' | 'timeline' | 'budget';

type Props<V extends string> = {
  name: ChoiceField;
  type: 'radio' | 'checkbox';
  /** Pregunta del grupo. Con `hideLegend` queda solo para lectores de pantalla. */
  legend: string;
  hideLegend?: boolean;
  hint?: string;
  options: readonly Option<V>[];
  columns?: 1 | 2;
  required?: boolean;
};

/**
 * Grupo de opciones como tarjetas (§8.10). Inputs nativos (radio/checkbox)
 * visualmente ocultos: navegación por teclado y semántica sin esfuerzo.
 */
export function ChoiceGroup<V extends string>({
  name,
  type,
  legend,
  hideLegend,
  hint,
  options,
  columns = 2,
  required = type === 'radio',
}: Props<V>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContactFormValues>();

  const error = errors[name]?.message;
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset
      className="choice-group"
      role={type === 'radio' ? 'radiogroup' : 'group'}
      aria-describedby={describedBy}
      aria-required={type === 'radio' && required ? true : undefined}
      aria-invalid={type === 'radio' && error ? true : undefined}
    >
      <legend className={cn('field__label', hideLegend && 'sr-only')}>{legend}</legend>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      <div className={cn('choice-grid', columns === 1 && 'choice-grid--1')}>
        {options.map((o) => {
          const id = `${name}-${o.value}`;
          return (
            <label key={o.value} htmlFor={id} className="choice">
              <input id={id} type={type} value={o.value} className="choice__input" {...register(name)} />
              <span className="choice__box">
                <span className="choice__label">{o.label}</span>
                <Check className="choice__check" aria-hidden="true" />
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="field__error" role="alert">
          <CircleAlert aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}
