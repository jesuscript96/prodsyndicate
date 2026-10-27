import type { ServiceSlug } from '@/content/types';
import { cn } from '@/lib/utils';

type Props = { slug: ServiceSlug; className?: string };

const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * Ilustraciones de línea (trazo 1,5 px, un punto de acento) para cada servicio.
 * Decorativas: `aria-hidden`. Se usan en las tarjetas grandes de /servicios y en el hero de cada servicio.
 */
export function ServiceIllustration({ slug, className }: Props) {
  return (
    <svg
      viewBox="0 0 320 240"
      className={cn('service-illustration', className)}
      aria-hidden="true"
      focusable="false"
    >
      {slug === 'mvp' && (
        <g {...common}>
          {/* Ventana de producto */}
          <rect x="40" y="48" width="200" height="150" rx="18" />
          <path d="M40 80h200" />
          <circle cx="58" cy="64" r="2.5" fill="currentColor" stroke="none" />
          <circle cx="70" cy="64" r="2.5" fill="currentColor" stroke="none" />
          {/* Contenido mínimo */}
          <path d="M64 110h96M64 130h64M64 150h80" />
          <rect x="176" y="104" width="44" height="60" rx="10" />
          {/* Chip v1 */}
          <rect x="196" y="24" width="84" height="32" rx="16" />
          <path d="M214 40h8l4-8 4 8h8" />
          <path d="M246 34v12M256 34v12" />
          {/* Flecha de lanzamiento */}
          <path d="M264 200c0-40 12-70 24-96" />
          <path d="M278 116l10-12 2 16" />
          <circle cx="264" cy="200" r="6" fill="var(--signal)" stroke="none" />
        </g>
      )}

      {slug === 'software-a-medida' && (
        <g {...common}>
          {/* Panel con barra lateral */}
          <rect x="32" y="40" width="256" height="168" rx="18" />
          <path d="M96 40v168" />
          <path d="M48 70h32M48 90h32M48 110h24" />
          {/* Tarjetas */}
          <rect x="112" y="60" width="72" height="48" rx="10" />
          <rect x="200" y="60" width="72" height="48" rx="10" />
          <rect x="112" y="124" width="160" height="64" rx="10" />
          {/* Gráfica de líneas */}
          <path d="M124 176l24-18 20 10 28-24 24 12 28-20" />
          {/* Integraciones */}
          <circle cx="288" cy="40" r="10" />
          <path d="M278 40h-10" />
          <circle cx="288" cy="40" r="3" fill="var(--signal)" stroke="none" />
        </g>
      )}

      {slug === 'automatizacion-ia' && (
        <g {...common}>
          {/* Nodos */}
          <rect x="24" y="96" width="64" height="48" rx="12" />
          <rect x="128" y="40" width="64" height="48" rx="12" />
          <rect x="128" y="152" width="64" height="48" rx="12" />
          <rect x="232" y="96" width="64" height="48" rx="12" />
          {/* Conexiones */}
          <path d="M88 120c20 0 20-56 40-56" />
          <path d="M88 120c20 0 20 56 40 56" />
          <path d="M192 64c20 0 20 56 40 56" />
          <path d="M192 176c20 0 20-56 40-56" />
          {/* Contenido de nodos */}
          <path d="M40 120h32M144 64h32M144 176h32" />
          {/* Chispa de IA */}
          <path d="M264 108l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
          <circle cx="56" cy="120" r="3" fill="var(--signal)" stroke="none" />
        </g>
      )}

      {slug === 'productos-creativos' && (
        <g {...common}>
          {/* Capas desplazadas */}
          <rect x="56" y="72" width="176" height="120" rx="20" transform="rotate(-6 144 132)" />
          <rect x="72" y="56" width="176" height="120" rx="20" transform="rotate(-2 160 116)" />
          <rect x="88" y="40" width="176" height="120" rx="20" />
          {/* Onda de animación */}
          <path d="M108 112c16-24 32-24 48 0s32 24 48 0 32-24 48 0" />
          {/* Cursor */}
          <path d="M232 160l28 12-12 4-4 12z" />
          <circle cx="112" cy="68" r="4" fill="var(--signal)" stroke="none" />
        </g>
      )}
    </svg>
  );
}
