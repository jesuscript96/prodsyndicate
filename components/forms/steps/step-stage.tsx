'use client';

import { STAGE_OPTIONS } from '@/lib/validators';
import { ChoiceGroup } from '../choice-group';

/** Paso 3 · ¿En qué punto estás? (§8.10). */
export function StepStage() {
  return <ChoiceGroup name="stage" type="radio" legend="¿En qué punto estás?" hideLegend options={STAGE_OPTIONS} />;
}
