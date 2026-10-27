import type { ReactNode } from 'react';

/**
 * Convierte "De la idea a un *MVP* que…" en nodos React con la palabra acento
 * en `<em className="accent-word text-accent">` (regla 3 de CLAUDE.md).
 */
export function renderAccent(text: string, accentClass = 'accent-word text-accent'): ReactNode[] {
  const parts = text.split(/\*([^*]+)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <em key={i} className={accentClass}>
        {part}
      </em>
    ) : (
      part
    ),
  );
}

export function AccentTitle({ text, accentClass }: { text: string; accentClass?: string }) {
  return <>{renderAccent(text, accentClass)}</>;
}
