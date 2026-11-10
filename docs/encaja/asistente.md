# Asistente con IA de las landings de Encaja

Chat en `/encaja/tiempo`, `/encaja/procesos` y `/encaja/crecer` que resuelve dudas, ayuda a quien visita a concretar qué necesita y, cuando tiene sentido, le propone huecos reales de la agenda. Responde con la API de DeepSeek.

## Qué hace y qué no

- Responde **solo con el contenido público de las landings** (`content/encaja.ts`). Si una landing cambia, el asistente cambia con ella. No conoce nada que no esté publicado en la web.
- Pregunta de una en una qué le quita tiempo al visitante, cuántas personas son y qué programas usan. Explica cómo se trabajaría y, cuando hay interés, ofrece la llamada de 30 minutos.
- **Propone huecos, pero no reserva.** Los huecos salen como botones; al pulsar uno, la agenda de la landing se abre con ese hueco elegido y la persona confirma con su nombre, su email, el consentimiento y Turnstile, como siempre.
- No pide nombre, email ni teléfono. Si alguien los escribe, le lleva al formulario.
- No inventa clientes, cifras ni horas ahorradas. El único precio que da es «Desde 3.000 € en 6 meses».
- Se presenta como asistente con IA desde el principio, como exige el reglamento europeo de IA.
- No se abre solo: es un botón abajo a la derecha, y el chat se descarga al pasar por encima o al pulsarlo.

## Cómo funciona

| Pieza | Archivo |
|---|---|
| Interruptor, modelo, límites | `lib/assistant/config.ts` |
| Instrucciones (reglas, tono, herramientas) | `lib/assistant/prompt.ts` |
| Lo que sabe (contenido de las landings) | `lib/assistant/knowledge.ts` |
| Cliente de DeepSeek (streaming y herramientas) | `lib/assistant/deepseek.ts` |
| Herramientas: `proponer_huecos`, `mostrar_formulario` | `lib/assistant/tools.ts` |
| Sesión firmada tras Turnstile | `lib/assistant/session.ts` |
| Filtro de emails, teléfonos y documentos | `lib/assistant/redact.ts` |
| Resumen para el equipo al reservar o dejar datos | `lib/assistant/summary.ts` |
| Ruta del chat | `app/api/encaja/asistente/route.ts` |
| Botón y chat | `components/encaja/assistant/` |
| Textos del chat (aviso, preguntas de arranque) | `encajaAssistant` en `content/encaja.ts` |

- **Contexto:** en cada turno el navegador manda la conversación entera (como mucho 20 mensajes del visitante). Las instrucciones y el contenido se montan en el servidor; el navegador no puede cambiarlos. Si llega desde Google Ads, el asistente sabe la palabra clave del anuncio (`utm_term`).
- **Conversación:** se guarda solo en `sessionStorage` (se borra al cerrar el navegador). No se guarda en ningún servidor.
- **Al equipo:** si después de hablar con el asistente la persona reserva o deja sus datos, la conversación viaja con el lead y se resume en 3 a 5 líneas. El resumen aparece en Valme OS (respuesta `asistente`) y en el aviso por correo. Si DeepSeek no responde en 6 segundos, va lo que escribió el visitante, recortado: el lead nunca se pierde por esto.
- **Modelo:** `deepseek-flash` sin modo de razonamiento, para que responda rápido. Se cambia con `DEEPSEEK_MODEL` (por ejemplo, `deepseek-v4-pro`).
- **Abuso y coste:** Turnstile en el primer mensaje, una sesión firmada de 45 minutos, 20 mensajes por conversación, 500 caracteres por mensaje y un límite por IP. El saldo de DeepSeek es prepago: nunca se gasta más de lo cargado. Con los precios publicados el 10-nov-2026, una conversación cuesta menos de un céntimo de dólar.

## Datos personales

DeepSeek procesa y guarda los datos en China, según su política de privacidad. Por eso:

- Antes del primer mensaje, el chat avisa de que lo escrito va a DeepSeek, con servidores en China, y enlaza la política de privacidad. «Entendido, empezar» es el consentimiento. No quitar ni suavizar ese aviso.
- Antes de enviar cada mensaje se quitan emails, teléfonos, DNI/NIE e IBAN (`redact.ts`).
- La política de privacidad (§2, §3, §4, §5, §6 y §7) y la de cookies recogen el asistente.

⚠️ La transferencia a China se ampara en el consentimiento explícito del art. 49.1.a del RGPD. Es una excepción pensada para transferencias ocasionales: conviene que lo revise alguien de legal. Si se prefiere un proveedor que procese en la UE, el cambio está en `lib/assistant/deepseek.ts` y `config.ts`.

## Puesta en marcha

1. Clave de la API de DeepSeek con saldo (platform.deepseek.com). En Vercel, `DEEPSEEK_API_KEY`.
2. Secreto para las sesiones, `ASSISTANT_SECRET` (`openssl rand -base64 32`).
3. Redesplegar: las landings son estáticas y deciden en el build si enseñan el botón.

Sin las dos variables, el asistente no aparece en producción. En local, sin clave, responde en **modo de prueba** (respuestas fijas que sirven para probar la interfaz).

## Pruebas

- **Interfaz:** `npm run dev` y abrir `/encaja/tiempo` (modo de prueba sin clave).
- **Modelo:** con `DEEPSEEK_API_KEY` en `.env.local` y sin `TURNSTILE_SECRET_KEY`, `npm run dev` y después `npm run encaja:asistente-pruebas`. Lanza conversaciones de prueba (precio, fuera de tema, intentos de saltarse las reglas, datos personales, huecos) y comprueba longitud, cifras, fugas de las instrucciones y huecos. Revisar también el tono a ojo.

## Medición

Eventos en GTM (la etiqueta de GA4 del embudo escucha `^web_`), nunca con el texto de la conversación:

- `web_chat_open`: abre el chat.
- `web_chat_message` (`n`): mensaje número n.
- `web_chat_slots` (`count`): le enseña huecos.
- `web_chat_handoff` (`mode`, `with_slot`): pasa a la agenda o al formulario.
- `web_chat_error` (`type`).

La conversión sigue siendo la reserva o el contacto (`generate_lead`). Para saber si el chat ayuda, comparar en GA4 la tasa de conversión de quien abre el chat con la de quien no.
