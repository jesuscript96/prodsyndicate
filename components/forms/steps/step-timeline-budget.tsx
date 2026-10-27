'use client';

import { BUDGET_OPTIONS, TIMELINE_OPTIONS } from '@/lib/validators';
import { ChoiceGroup } from '../choice-group';

/**
 * Paso 4 · ¿Plazos y presupuesto? (§8.10).
 * ⚠️ Los rangos de presupuesto ({{RANGOS}}) se rellenan en `BUDGET_RANGES`
 * (lib/validators.ts); mientras tanto solo aparece "Prefiero comentarlo".
 */
export function StepTimelineBudget() {
  return (
    <>
      <ChoiceGroup name="timeline" type="radio" legend="Plazo" options={TIMELINE_OPTIONS} />
      <ChoiceGroup
        name="budget"
        type="radio"
        legend="Presupuesto"
        hint="Opcional. Nos ayuda a proponerte el alcance adecuado."
        options={BUDGET_OPTIONS}
        required={false}
      />
    </>
  );
}
