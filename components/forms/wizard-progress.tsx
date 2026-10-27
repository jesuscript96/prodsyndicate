/**
 * Barra de progreso del asistente (§8.10). Solo anima `transform`.
 * Es decorativa: el texto "Paso n de N" vive en la región aria-live del asistente.
 */
export function WizardProgress({ step, total }: { step: number; total: number }) {
  const ratio = Math.min(1, Math.max(0, step / total));
  return (
    <div className="wizard__progress" aria-hidden="true">
      <span className="wizard__bar" style={{ transform: `scaleX(${ratio})` }} />
    </div>
  );
}
