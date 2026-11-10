/**
 * Quita datos personales evidentes de lo que escribe el visitante antes de mandarlo a DeepSeek:
 * emails, teléfonos, IBAN y DNI/NIE. No es infalible (un nombre no se puede detectar así), por eso
 * el chat avisa de que no se compartan datos personales y el asistente remite al formulario.
 */

const PATTERNS: readonly [RegExp, string][] = [
  [/[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/gi, '[email retirado]'],
  [/\b[A-Z]{2}\d{2}(?:[ -]?[A-Z0-9]{4}){4,7}\b/gi, '[cuenta retirada]'],
  [/\b[XYZ]\d{7}[A-Z]\b/gi, '[documento retirado]'],
  [/\b\d{8}[A-Z]\b/gi, '[documento retirado]'],
  // Teléfonos: 9 o más dígitos, con prefijo, espacios, puntos o guiones opcionales.
  [/(?:\+|00)?\d(?:[\s.-]?\d){8,13}\b/g, '[teléfono retirado]'],
];

export function redact(text: string): string {
  return PATTERNS.reduce((t, [re, replacement]) => t.replace(re, replacement), text);
}
