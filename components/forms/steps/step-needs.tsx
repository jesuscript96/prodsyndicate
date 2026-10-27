'use client';

import { NEED_OPTIONS } from '@/lib/validators';
import { ChoiceGroup } from '../choice-group';

/** Paso 2 · ¿Qué necesitas? (multi) — 8 opciones (§8.10). */
export function StepNeeds() {
  return (
    <ChoiceGroup
      name="needs"
      type="checkbox"
      legend="¿Qué necesitas?"
      hideLegend
      hint="Puedes elegir varias opciones."
      options={NEED_OPTIONS}
    />
  );
}
