import type { AgendaConfig } from './slots';

/**
 * Horario de las llamadas de 30 minutos que se reservan desde la web.
 * ⚠️ Horario y antelación elegidos por defecto el 4/11/2026: confirmar con el negocio (TODO.md).
 * Los festivos y ausencias se bloquean creando un evento «ocupado» en el calendario.
 */
export const agendaConfig: AgendaConfig = {
  timeZone: 'Europe/Madrid',
  slotMinutes: 30,
  stepMinutes: 30,
  bufferMinutes: 15,
  minNoticeMinutes: 12 * 60,
  daysAhead: 14,
  hours: {
    1: [['10:00', '14:00'], ['16:00', '19:00']],
    2: [['10:00', '14:00'], ['16:00', '19:00']],
    3: [['10:00', '14:00'], ['16:00', '19:00']],
    4: [['10:00', '14:00'], ['16:00', '19:00']],
    5: [['10:00', '14:00']],
  },
};
