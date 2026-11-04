/**
 * Visual del hero de «Camino» (el mismo flujo que el anuncio 22): un proceso real, paso a paso,
 * con un hueco marcado donde se valora si aporta la IA. Texto real en HTML, legible por lectores.
 */
const STEPS = [
  { n: '01', text: 'Entra un pedido' },
  { n: '02', text: 'Se revisan los datos' },
  { n: null, text: '¿Aquí aporta IA?' },
  { n: '03', text: 'Se factura' },
  { n: '04', text: 'Se avisa al cliente' },
] as const;

export function FlowVisual() {
  return (
    <figure className="lp-flow">
      <figcaption className="sr-only">Un proceso de ejemplo, paso a paso.</figcaption>
      <ol className="lp-flow__list">
        {STEPS.map((step, i) => (
          <li
            key={step.text}
            className={step.n ? 'lp-flow__step' : 'lp-flow__step lp-flow__step--ia'}
            data-side={i % 2 ? 'right' : 'left'}
          >
            {step.n ? (
              <>
                <span className="lp-flow__n" aria-hidden="true">
                  {step.n}
                </span>
                {step.text}
              </>
            ) : (
              <em className="accent-word">{step.text}</em>
            )}
          </li>
        ))}
      </ol>
    </figure>
  );
}
