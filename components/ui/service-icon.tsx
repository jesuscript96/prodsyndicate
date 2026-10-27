import { LayoutPanelLeft, Rocket, Sparkles, Workflow } from 'lucide-react';
import type { ServiceIcon as IconName } from '@/content/types';

const icons = {
  rocket: Rocket,
  'layout-panel': LayoutPanelLeft,
  workflow: Workflow,
  sparkles: Sparkles,
} as const;

/** Iconos de trazo fino (1,5 px) para los 4 servicios (§5.7). */
export function ServiceIcon({ name, className, size = 22 }: { name: IconName; className?: string; size?: number }) {
  const Icon = icons[name];
  return <Icon className={className} size={size} strokeWidth={1.5} aria-hidden="true" />;
}
