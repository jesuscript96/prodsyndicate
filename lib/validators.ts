import { z } from 'zod';

/**
 * Validación compartida cliente/servidor del asistente de contacto (§9.1),
 * adaptada a zod 4. Las etiquetas en español de cada opción (§8.10) viven
 * aquí para que el formulario y el email de aviso usen el mismo texto.
 */

export type Option<V extends string = string> = { value: V; label: string };

/* ───────────── Paso 1 · ¿Quién eres? ───────────── */

export const AUDIENCES = ['emprendedor', 'empresa'] as const;
export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_OPTIONS: readonly Option<Audience>[] = [
  { value: 'emprendedor', label: 'Emprendedor/a' },
  { value: 'empresa', label: 'Empresa' },
];

/* ───────────── Paso 2 · ¿Qué necesitas? (multi) ───────────── */

export const NEEDS = [
  'mvp',
  'app-web',
  'app-movil',
  'herramienta-interna',
  'automatizacion-ia',
  'ux-ui',
  'web-creativa',
  'no-se',
] as const;
export type Need = (typeof NEEDS)[number];

export const NEED_OPTIONS: readonly Option<Need>[] = [
  { value: 'mvp', label: 'MVP' },
  { value: 'app-web', label: 'App web' },
  { value: 'app-movil', label: 'App móvil' },
  { value: 'herramienta-interna', label: 'Herramienta interna' },
  { value: 'automatizacion-ia', label: 'Automatización e IA' },
  { value: 'ux-ui', label: 'Diseño UX/UI' },
  { value: 'web-creativa', label: 'Web creativa' },
  { value: 'no-se', label: 'Aún no lo sé' },
];

/* ───────────── Paso 3 · ¿En qué punto estás? ───────────── */

export const STAGES = ['idea', 'prototipo', 'producto-existente', 'rehacer'] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_OPTIONS: readonly Option<Stage>[] = [
  { value: 'idea', label: 'Solo una idea' },
  { value: 'prototipo', label: 'Tengo diseño o prototipo' },
  { value: 'producto-existente', label: 'Ya existe un producto' },
  { value: 'rehacer', label: 'Necesito rehacer o mejorar algo' },
];

/* ───────────── Paso 4 · ¿Plazos y presupuesto? ───────────── */

export const TIMELINES = ['lo-antes-posible', '1-3-meses', '3-6-meses', 'sin-fecha'] as const;
export type Timeline = (typeof TIMELINES)[number];

export const TIMELINE_OPTIONS: readonly Option<Timeline>[] = [
  { value: 'lo-antes-posible', label: 'Lo antes posible' },
  { value: '1-3-meses', label: '1–3 meses' },
  { value: '3-6-meses', label: '3–6 meses' },
  { value: 'sin-fecha', label: 'Sin fecha' },
];

/**
 * ⚠️ Rangos de presupuesto `{{RANGOS}}`: pendientes de negocio (TODO.md).
 * Rellenar con pares { value, label }, p. ej. { value: '5k-15k', label: '5.000 – 15.000 €' }.
 * Mientras esté vacío, el formulario solo ofrece "Prefiero comentarlo".
 */
export const BUDGET_RANGES: readonly Option[] = [
  // { value: '…', label: '…' },
];

export const BUDGET_DISCUSS: Option = { value: 'prefiero-comentarlo', label: 'Prefiero comentarlo' };

export const BUDGET_OPTIONS: readonly Option[] = [...BUDGET_RANGES, BUDGET_DISCUSS];

/* ───────────── Esquema de la API (§9.1) ───────────── */

const trimmedEmail = z
  .string({ error: 'Escribe tu email' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Email no válido' }).max(200, 'Email demasiado largo'));

export const contactSchema = z.object({
  audience: z.enum(AUDIENCES, { error: 'Elige una opción' }),
  needs: z
    .array(z.enum(NEEDS), { error: 'Elige al menos una opción' })
    .min(1, 'Elige al menos una opción')
    .max(8),
  stage: z.enum(STAGES, { error: 'Elige una opción' }),
  timeline: z.enum(TIMELINES, { error: 'Elige un plazo' }),
  budget: z.string().max(60).optional(),
  message: z.string().trim().max(1500, 'Máximo 1500 caracteres').optional(),
  links: z.array(z.url({ error: 'Enlace no válido' })).max(5, 'Máximo 5 enlaces').optional(),
  name: z.string({ error: 'Escribe tu nombre' }).trim().min(2, 'Escribe tu nombre').max(120, 'Nombre demasiado largo'),
  email: trimmedEmail,
  company: z.string().trim().max(160, 'Nombre de empresa demasiado largo').optional(),
  phone: z.string().trim().max(40, 'Teléfono demasiado largo').optional(),
  consent: z
    .boolean({ error: 'Debes aceptar la política de privacidad' })
    .refine((v) => v === true, { message: 'Debes aceptar la política de privacidad' }),
  website: z.string().max(0).optional(), // honeypot: debe llegar vacío
  turnstileToken: z.string().min(1),
  utm: z.record(z.string(), z.string()).optional(),
  source: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/* ───────────── Esquema del formulario (cliente) ───────────── */

export const MAX_LINKS = 5;
export const MAX_MESSAGE = 1500;

/** Convierte el texto "un enlace por línea" en una lista limpia de URLs. */
export function parseLinks(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n|,|\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const isUrl = (s: string) => z.url().safeParse(s).success;

/**
 * Lo que guarda react-hook-form: igual que la API, pero los enlaces se escriben
 * en un solo campo de texto (`linksText`) y el token de Turnstile, `utm` y
 * `source` se añaden al enviar.
 */
export const contactFormSchema = contactSchema
  .omit({ links: true, turnstileToken: true, utm: true, source: true })
  .extend({
    // Un grupo de radio sin marcar llega como null desde react-hook-form: el presupuesto es opcional.
    budget: z.string().max(60).nullish(),
    linksText: z
      .string()
      .max(1200, 'Demasiado texto en los enlaces')
      .optional()
      .refine((t) => parseLinks(t).length <= MAX_LINKS, { message: `Máximo ${MAX_LINKS} enlaces` })
      .refine((t) => parseLinks(t).every(isUrl), {
        message: 'Revisa los enlaces: uno por línea y con https://',
      }),
  });

export type ContactFormValues = z.input<typeof contactFormSchema>;
export type ContactFormField = keyof ContactFormValues;

/** Campos que valida cada paso del asistente (§8.10), en orden. */
export const STEP_FIELDS: readonly (readonly ContactFormField[])[] = [
  ['audience'],
  ['needs'],
  ['stage'],
  ['timeline', 'budget'],
  ['message', 'linksText'],
  ['name', 'email', 'company', 'phone', 'consent'],
];

export const STEP_COUNT = STEP_FIELDS.length;

/** Paso (0-index) al que pertenece un campo; -1 si no es de ningún paso. */
export function stepOfField(field: string): number {
  return STEP_FIELDS.findIndex((fields) => (fields as readonly string[]).includes(field));
}

/** Construye el payload de `POST /api/contact` a partir de los valores del formulario. */
export function toContactInput(
  values: ContactFormValues,
  extra: { turnstileToken: string; utm?: Record<string, string>; source?: string },
): ContactInput {
  const clean = (s: string | undefined) => {
    const t = s?.trim();
    return t ? t : undefined;
  };
  const links = parseLinks(values.linksText);
  return {
    audience: values.audience,
    needs: values.needs,
    stage: values.stage,
    timeline: values.timeline,
    budget: clean(values.budget ?? undefined),
    message: clean(values.message),
    links: links.length ? links : undefined,
    name: values.name.trim(),
    email: values.email.trim(),
    company: clean(values.company),
    phone: clean(values.phone),
    consent: values.consent,
    website: values.website ?? '',
    turnstileToken: extra.turnstileToken,
    utm: extra.utm,
    source: extra.source,
  };
}
