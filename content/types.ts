/** Tipos de contenido compartidos (§3, §8). El contenido vive en /content, separado de la presentación. */

export type ServiceSlug = 'mvp' | 'software-a-medida' | 'automatizacion-ia' | 'productos-creativos';

export type ProjectCategory = 'mvp' | 'empresa' | 'automatizacion' | 'creativo';

export type ServiceIcon = 'rocket' | 'layout-panel' | 'workflow' | 'sparkles';

export type Cta = { label: string; href: string };

/** Resumen de servicio: lo que usan menú, home, footer y tarjetas. El detalle de página vive en content/services-detail.ts. */
export type ServiceSummary = {
  slug: ServiceSlug;
  /** Nombre completo (tarjetas, títulos) */
  title: string;
  /** Nombre corto (menú, footer, chips) */
  shortTitle: string;
  /** Una línea para el mega-menú */
  menuLine: string;
  /** Texto de la tarjeta en la home (§6.9, sección 4) */
  card: string;
  icon: ServiceIcon;
  cta: Cta;
  /** Categoría de proyectos relacionada (filtros y enlazado interno) */
  category: ProjectCategory;
};

export type FaqItem = { q: string; a: string };

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO 8601 (YYYY-MM-DD) */
  date: string;
  updated?: string;
  author: string;
  tags: string[];
  service?: ServiceSlug;
  cover?: string;
  draft: boolean;
  readingMinutes: number;
};

export type ProjectResult = { label: string; value: string };

export type ProjectMeta = {
  slug: string;
  title: string;
  client: string;
  year: number;
  categories: ProjectCategory[];
  services: string[];
  stack: string[];
  /** 1–2 frases */
  summary: string;
  cover: { src: string; alt: string };
  /** SOLO datos reales y verificables */
  results?: ProjectResult[];
  testimonial?: { quote: string; author: string; role: string };
  /** Caso de concepto: se etiqueta claramente en la UI */
  isConcept?: boolean;
  /** Orden manual en índices y rail (menor = antes) */
  order?: number;
  featured?: boolean;
};

export type LegalMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO 8601 */
  updated: string;
};

export type ProcessStep = {
  n: string;
  title: string;
  text: string;
};
