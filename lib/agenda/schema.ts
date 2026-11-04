import { z } from 'zod';

/** Reserva de llamada desde la web. Mensajes de error en español: se muestran en el formulario. */
export const bookingSchema = z.object({
  start: z.iso.datetime({ error: 'Elige un hueco' }),
  name: z.string({ error: 'Escribe tu nombre' }).trim().min(2, 'Escribe tu nombre').max(120, 'Nombre demasiado largo'),
  email: z
    .string({ error: 'Escribe tu email' })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'Email no válido' }).max(200, 'Email demasiado largo')),
  company: z.string().trim().max(160, 'Nombre de empresa demasiado largo').optional(),
  phone: z.string().trim().max(40, 'Teléfono demasiado largo').optional(),
  message: z.string().trim().max(1000, 'Máximo 1000 caracteres').optional(),
  consent: z
    .boolean({ error: 'Debes aceptar la política de privacidad' })
    .refine((v) => v === true, { message: 'Debes aceptar la política de privacidad' }),
  website: z.string().max(0).optional(), // honeypot: debe llegar vacío
  turnstileToken: z.string().min(1),
  landing: z.string().max(40).optional(),
  source: z.string().max(200).optional(),
  utm: z.record(z.string(), z.string()).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

/** Respuesta de /api/agenda/disponibilidad */
export type AvailabilityResponse =
  | { ok: true; timeZone: string; slotMinutes: number; slots: string[]; mock?: boolean }
  | { ok: false; error: 'config' | 'calendar' };

/** Respuesta de /api/agenda/reservar */
export type BookingResponse =
  | { ok: true; start: string; end: string; meetUrl?: string; presentationUrl?: string; mock?: boolean }
  | { ok: false; error: 'invalid_json' | 'validation' | 'captcha' | 'slot_taken' | 'config' | 'calendar' };
