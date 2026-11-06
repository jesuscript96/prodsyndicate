/**
 * Textos de consentimiento de la agenda, del contacto corto de las landings y del asistente de
 * /contacto. El formulario los enseña junto a la casilla y el servidor los guarda tal cual con el
 * lead en Valme OS, para que quede constancia de lo que se aceptó.
 */
export const consentCopy = {
  llamada: 'Usaremos tus datos solo para esta llamada.',
  contacto: 'Usaremos tus datos solo para responderte y enviarte el resumen.',
  formulario: 'Usaremos tus datos solo para responder a esta solicitud.',
} as const;

export const consentRecord = (kind: keyof typeof consentCopy) =>
  `He leído y acepto la política de privacidad (/legal/privacidad). ${consentCopy[kind]}`;
