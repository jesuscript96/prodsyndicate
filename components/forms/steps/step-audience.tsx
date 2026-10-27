'use client';

import { AUDIENCE_OPTIONS } from '@/lib/validators';
import { ChoiceGroup } from '../choice-group';

/** Paso 1 · ¿Quién eres? — Emprendedor/a · Empresa (§8.10). */
export function StepAudience() {
  return <ChoiceGroup name="audience" type="radio" legend="¿Quién eres?" hideLegend options={AUDIENCE_OPTIONS} />;
}
