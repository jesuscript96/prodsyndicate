'use client';

import { MAX_LINKS, MAX_MESSAGE } from '@/lib/validators';
import { Field } from '../field';

/** Paso 5 · Cuéntanos más — texto libre (máx. 1500) + enlaces de referencia (§8.10). */
export function StepMessage() {
  return (
    <>
      <Field
        name="message"
        label="Tu mensaje"
        optional
        hint="Qué quieres construir, para quién y qué tienes ya. Cuanto más contexto, mejor propuesta."
        textarea
        rows={7}
        maxLength={MAX_MESSAGE}
        showCount
      />
      <Field
        name="linksText"
        label="Enlaces de referencia"
        optional
        hint={`Uno por línea, con https:// — webs, prototipos o productos que te inspiran (hasta ${MAX_LINKS}).`}
        textarea
        short
        rows={3}
        inputMode="url"
        autoComplete="off"
      />
    </>
  );
}
