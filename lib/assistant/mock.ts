/**
 * Respuestas simuladas para desarrollo sin clave de DeepSeek: sirven para probar la interfaz
 * (streaming, botones de huecos y del formulario), no el comportamiento del modelo.
 */

export type MockTurn = { text: string; tool?: { name: string; args: string } };

export function mockTurn(lastUserMessage: string): MockTurn {
  const m = lastUserMessage.toLowerCase();
  if (/hueco|llamada|reuni|cita|agenda|hablar|cuándo|cuando/.test(m)) {
    return {
      text: '(Modo de prueba) Te dejo algunos huecos para la llamada de 30 minutos: elige uno y lo confirmas abajo con tu nombre y tu email.',
      tool: { name: 'proponer_huecos', args: JSON.stringify({ franja: /tarde/.test(m) ? 'tarde' : 'cualquiera' }) },
    };
  }
  if (/escrib|contact|correo|email|mail/.test(m)) {
    return {
      text: '(Modo de prueba) Claro: deja tus datos en el formulario y te escribimos para ver tu caso.',
      tool: { name: 'mostrar_formulario', args: JSON.stringify({ modo: 'contacto' }) },
    };
  }
  if (/cuesta|precio|presupuesto|cuánto|cuanto/.test(m)) {
    return { text: '(Modo de prueba) Desde 3.000 € en 6 meses. Después de la llamada te enviamos una propuesta cerrada.' };
  }
  return {
    text: '(Modo de prueba) Sin clave de DeepSeek no hay modelo detrás: esta respuesta es fija. Prueba a pedir una llamada o a preguntar el precio.',
  };
}
