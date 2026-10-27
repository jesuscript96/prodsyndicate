'use client';

import { CircleAlert } from 'lucide-react';
import type { HTMLInputAutoCompleteAttribute, HTMLInputTypeAttribute } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { ContactFormValues } from '@/lib/validators';
import { cn } from '@/lib/utils';

type TextField = 'name' | 'email' | 'company' | 'phone' | 'message' | 'linksText';

type Props = {
  name: TextField;
  label: string;
  hint?: string;
  optional?: boolean;
  type?: HTMLInputTypeAttribute;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  inputMode?: 'text' | 'email' | 'tel' | 'url';
  textarea?: boolean;
  short?: boolean;
  rows?: number;
  maxLength?: number;
  /** Muestra el contador "n / máx." (requiere maxLength) */
  showCount?: boolean;
  placeholder?: string;
};

/** Campo de texto con etiqueta, pista, error enlazado por aria-describedby y aria-invalid. */
export function Field({
  name,
  label,
  hint,
  optional,
  type = 'text',
  autoComplete,
  inputMode,
  textarea,
  short,
  rows,
  maxLength,
  showCount,
  placeholder,
}: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ContactFormValues>();
  const value = useWatch({ control, name, disabled: !showCount }) ?? '';

  const error = errors[name]?.message;
  const id = `field-${name}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const shared = {
    id,
    className: cn('field__input', textarea && 'field__textarea', textarea && short && 'field__textarea--short'),
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': optional ? undefined : true,
    maxLength,
    placeholder,
    autoComplete,
    ...register(name),
  };

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
        {optional && <span className="field__optional"> (opcional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {textarea ? <textarea rows={rows ?? 6} {...shared} /> : <input type={type} inputMode={inputMode} {...shared} />}
      {(error || (showCount && maxLength)) && (
        <div className="field__meta">
          {error && (
            <p id={errorId} className="field__error" role="alert">
              <CircleAlert aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
          {showCount && maxLength && (
            <span className="field__count" aria-hidden="true">
              {value.length} / {maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
