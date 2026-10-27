import { cn } from '@/lib/utils';
import './company.css';

/** Avatar abstracto (sin foto): círculo, arcos y hairlines con el acento ultramar. Decorativo. */
export function AbstractAvatar({ className }: { className?: string }) {
  return (
    <svg
      className={cn('co-avatar', className)}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="100" cy="88" r="40" stroke="var(--ink)" strokeWidth="1" />
      <path d="M40 176c0-33 27-56 60-56s60 23 60 56" stroke="var(--ink)" strokeWidth="1" />
      <path d="M100 48a40 40 0 0 1 40 40" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" />
      <path d="M60 88a40 40 0 0 0 20 34" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="100" cy="88" r="6" fill="var(--accent)" />
      <path d="M24 176h152" stroke="var(--line)" strokeWidth="1" />
    </svg>
  );
}
