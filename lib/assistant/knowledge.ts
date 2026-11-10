import type { TitleParts } from '@/content/company';
import {
  encajaCallNote,
  encajaCase,
  encajaLandings,
  encajaMeeting,
  encajaPrice,
  encajaSteps,
  encajaTimeNote,
  encajaWho,
  type EncajaLanding,
  type EncajaSlug,
} from '@/content/encaja';
import { site } from '@/site.config';

/**
 * Lo que sabe el asistente: el mismo contenido público de las landings (content/encaja.ts), en
 * texto plano. Nada más: ni presupuestos internos ni datos que no estén publicados en la web.
 * Así, si cambia una landing, el asistente cambia con ella.
 */

const title = (t: TitleParts) => `${t.before}${t.accent}${t.after}`.trim();
const bullets = (items: readonly string[]) => items.map((i) => `- ${i}`).join('\n');

function landingText(l: EncajaLanding): string {
  const parts: string[] = [
    `Titular: ${title(l.hero.title)}`,
    `Para quién: ${l.onePager.audience}`,
    `Mensaje: ${l.hero.intro}`,
    `${l.pains.label} ${title(l.pains.title)}\n${bullets(l.pains.items)}`,
  ];
  if (l.pains.chips?.length) parts.push(`Áreas típicas: ${l.pains.chips.join(', ')}.`);
  parts.push(
    `Lo que cambia (${title(l.outcomes.title)}):\n${bullets(l.outcomes.items.map((o) => `${o.title}: ${o.text}`))}`,
  );
  for (const b of l.blocks) {
    const lines = [`${b.label}: ${title(b.title)}`];
    if (b.text) lines.push(b.text);
    if (b.qa) lines.push(...b.qa.map((x) => `- ${x.q} ${x.a}`));
    if (b.steps) lines.push(...b.steps.map((s, i) => `${i + 1}. ${s}`));
    if (b.chips?.length) lines.push(`${b.chipsLabel ?? 'Ejemplos'}: ${b.chips.join(', ')}.`);
    parts.push(lines.join('\n'));
  }
  parts.push(`Preguntas frecuentes:\n${l.faq.map((f) => `- ${f.q} ${f.a}`).join('\n')}`);
  return parts.join('\n\n');
}

const common = (): string =>
  [
    `Precio: ${encajaPrice} Tras la llamada se envía una propuesta cerrada con lo que se hará, los plazos y el presupuesto.`,
    `Ahorro de tiempo: ${encajaTimeNote}`,
    `${encajaSteps.label}:\n${encajaSteps.items.map((s) => `${s.n}. ${s.title}: ${s.text}`).join('\n')}`,
    `${encajaMeeting.title}:\n${bullets(encajaMeeting.items)}`,
    `La llamada: ${encajaCallNote}`,
    `${encajaCase.label} (sin nombre, sector ni cifras; no des más detalles que estos):\n${encajaCase.parts
      .map((p) => `- ${p.title}: ${p.text}`)
      .join('\n')}`,
    `${encajaWho.label}:\n${encajaWho.paragraphs.join('\n')}`,
    `Contacto por correo: ${site.email}`,
  ].join('\n\n');

/** Conocimiento completo: la landing que está viendo, las otras dos y lo común. */
export function knowledgeFor(slug: EncajaSlug): string {
  const current = encajaLandings.find((l) => l.slug === slug);
  const others = encajaLandings.filter((l) => l.slug !== slug);
  return [
    current ? `# La página que está viendo («${current.meta.title}»)\n\n${landingText(current)}` : '',
    `# Lo común a todas las páginas de AUTOMATO\n\n${common()}`,
    ...others.map((l) => `# Otra página de AUTOMATO («${l.meta.title}»)\n\n${landingText(l)}`),
  ]
    .filter(Boolean)
    .join('\n\n');
}
