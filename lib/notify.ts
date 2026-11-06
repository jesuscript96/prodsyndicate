import { Resend } from 'resend';
import { VALME_OS_CRM_URL } from '@/lib/valme-os';

/**
 * Aviso por correo de cada lead (reserva, «te escribimos nosotros» y el asistente de /contacto),
 * para enterarse al momento sin abrir Valme OS. Sale por Resend desde el dominio verificado
 * (CONTACT_FROM_EMAIL) a CONTACT_TO_EMAIL, con «Responder» directo al cliente.
 *
 * Solo servidor. Best effort: nunca tumba el envío del formulario. Sin configurar, no hace nada.
 * Nunca se escriben datos personales en los logs.
 */

export type LeadKind = 'llamada' | 'contacto' | 'formulario';

export type LeadNotice = {
  kind: LeadKind;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  /** Página o landing de origen (`encaja-tiempo`, `contacto`…) */
  page?: string;
  source?: string;
  utm?: Record<string, string>;
  clicks?: Record<string, string>;
  /** Reserva: cuándo, ya formateado en hora peninsular */
  when?: string;
  meetUrl?: string;
  /** Respuestas sueltas del formulario, en el orden en que se enseñan */
  details?: ReadonlyArray<readonly [string, string | undefined]>;
};

export type NoticeResult = 'ok' | 'skipped' | 'error';

const KIND_LABEL: Record<LeadKind, string> = {
  llamada: 'Llamada reservada',
  contacto: 'Quiere que le escribamos',
  formulario: 'Formulario de contacto',
};

function subject(n: LeadNotice) {
  const who = n.company ? `${n.name} (${n.company})` : n.name;
  return n.kind === 'llamada' && n.when ? `Llamada reservada: ${who} · ${n.when}` : `${KIND_LABEL[n.kind]}: ${who}`;
}

function body(n: LeadNotice) {
  const utm = n.utm && Object.keys(n.utm).length ? Object.entries(n.utm).map(([k, v]) => `${k}=${v}`).join(' · ') : '';
  const clicks = n.clicks ? Object.keys(n.clicks).filter((k) => n.clicks![k]) : [];
  const line = (label: string, value?: string) => (value ? `${label}: ${value}` : '');
  // Bloques separados por una línea en blanco; dentro de cada uno, solo las líneas con dato.
  const sections: string[][] = [
    [
      line('Tipo', KIND_LABEL[n.kind]),
      line('Cuándo', n.when ? `${n.when} (hora peninsular)` : undefined),
      line('Google Meet', n.meetUrl),
    ],
    [
      line('Nombre', n.name),
      line('Email', n.email),
      line('Teléfono', n.phone),
      line('Empresa', n.company),
      ...(n.details ?? []).map(([label, value]) => line(label, value)),
    ],
    [n.message ? `Mensaje:\n${n.message}` : ''],
    [
      line('Página', n.page),
      line('Origen', n.source),
      line('UTM', utm),
      line('Clic de anuncio', clicks.length ? clicks.join(', ') : undefined),
    ],
    [`Responde a este correo para escribirle. Ficha en Valme OS: ${VALME_OS_CRM_URL}`],
  ];
  return sections
    .map((lines) => lines.filter(Boolean).join('\n'))
    .filter(Boolean)
    .join('\n\n');
}

export async function notifyNewLead(n: LeadNotice): Promise<NoticeResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to) return 'skipped';
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: to.split(',').map((s) => s.trim()).filter(Boolean),
      replyTo: n.email,
      subject: subject(n).slice(0, 180),
      text: body(n),
    });
    if (error) {
      console.error('lead_notice_failed', error.name);
      return 'error';
    }
    return 'ok';
  } catch (e) {
    console.error('lead_notice_failed', e instanceof Error ? e.name : 'unknown');
    return 'error';
  }
}
