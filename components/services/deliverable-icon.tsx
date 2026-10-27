import {
  AppWindow,
  BarChart3,
  Bell,
  Bot,
  Box,
  Code2,
  FileText,
  Gauge,
  GraduationCap,
  KeyRound,
  LayoutTemplate,
  ListChecks,
  Map,
  MousePointerClick,
  Network,
  Palette,
  PenTool,
  Plug,
  Rocket,
  Search,
  Upload,
  Workflow,
} from 'lucide-react';
import type { DeliverableIcon as IconName } from '@/content/services-detail';

const icons = {
  'list-checks': ListChecks,
  'app-window': AppWindow,
  'layout-template': LayoutTemplate,
  rocket: Rocket,
  'bar-chart': BarChart3,
  'file-text': FileText,
  search: Search,
  'pen-tool': PenTool,
  plug: Plug,
  'key-round': KeyRound,
  'graduation-cap': GraduationCap,
  map: Map,
  workflow: Workflow,
  network: Network,
  bot: Bot,
  bell: Bell,
  palette: Palette,
  'mouse-pointer': MousePointerClick,
  code: Code2,
  box: Box,
  gauge: Gauge,
  upload: Upload,
} as const satisfies Record<IconName, unknown>;

/** Iconos de trazo fino (1,5 px) para los entregables de cada servicio (§5.7). */
export function DeliverableIcon({ name, className, size = 22 }: { name: IconName; className?: string; size?: number }) {
  const Icon = icons[name];
  return <Icon className={className} size={size} strokeWidth={1.5} aria-hidden="true" />;
}
