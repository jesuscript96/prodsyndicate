import type { TitleParts } from '@/content/company';
import { cn } from '@/lib/utils';

/** Titular con 1–2 palabras de acento en serif cursiva (regla 3 de CLAUDE.md). */
export function AccentTitle({ parts, color = true }: { parts: TitleParts; color?: boolean }) {
  return (
    <>
      {parts.before}
      <em className={cn('accent-word', color && 'text-accent')}>{parts.accent}</em>
      {parts.after}
    </>
  );
}
