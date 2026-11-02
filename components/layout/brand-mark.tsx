import { BRAND_MARK } from './brand-mark.data';

type Props = {
  /** Lado en píxeles (el SVG es cuadrado). */
  size?: number;
  className?: string;
  /** Dibuja las semillas. Por defecto solo a partir de 32 px: por debajo son ruido. */
  detailed?: boolean;
};

/**
 * Isotipo AUTOMATO: tomate cortado por la mitad, visto desde el corte. La piel
 * usa `currentColor`; las cavidades, el acento ultramar; semillas y carne, papel.
 * Decorativo: el texto accesible lo pone el enlace que lo envuelve.
 */
export function BrandMark({ size = 22, className, detailed = size >= 32 }: Props) {
  return (
    <svg width={size} height={size} viewBox={BRAND_MARK.viewBox} aria-hidden="true" focusable="false" className={className}>
      {BRAND_MARK.cavities.map((d) => (
        <path key={d} d={d} fill="var(--accent)" stroke="var(--accent)" strokeWidth={BRAND_MARK.round} strokeLinejoin="round" />
      ))}
      {detailed &&
        BRAND_MARK.seeds.map((s) => (
          <ellipse
            key={`${s.cx}-${s.cy}`}
            cx={s.cx}
            cy={s.cy}
            rx={s.rx}
            ry={s.ry}
            transform={`rotate(${s.rot} ${s.cx} ${s.cy})`}
            fill="var(--paper)"
          />
        ))}
      <path d={BRAND_MARK.outline} fill="none" stroke="currentColor" strokeWidth={BRAND_MARK.strokeSkin} strokeLinejoin="round" />
    </svg>
  );
}
