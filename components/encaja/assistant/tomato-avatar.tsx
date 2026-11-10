import { cn } from '@/lib/utils';

/** Mr. Tomate: un tomate con hojas y una cara sencilla. Decorativo (el nombre va al lado). */
export function TomatoAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={cn('tomato-avatar', className)}>
      <circle cx="24" cy="27" r="18" fill="var(--signal)" />
      <ellipse cx="17" cy="21" rx="4.5" ry="3" fill="#ffffff" opacity="0.28" />
      <path
        d="M24 11c-2.2-3.6-6.4-4.4-9.4-2.6 2.7.4 4.6 1.8 5.6 3.6-3.4-.6-6.8.6-8.6 3.2 3.4-.8 6.6-.2 8.8 1.4L24 15l3.6 1.6c2.2-1.6 5.4-2.2 8.8-1.4-1.8-2.6-5.2-3.8-8.6-3.2 1-1.8 2.9-3.2 5.6-3.6-3-1.8-7.2-1-9.4 2.6Z"
        fill="#2f8f3a"
      />
      <rect x="23" y="5" width="2" height="7" rx="1" fill="#2f8f3a" />
      <circle cx="18.5" cy="27" r="2" fill="var(--ink)" />
      <circle cx="29.5" cy="27" r="2" fill="var(--ink)" />
      <path d="M19.5 32.5c2.6 2.6 6.4 2.6 9 0" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
