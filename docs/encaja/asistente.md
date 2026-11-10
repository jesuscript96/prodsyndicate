# Mr. Tomate, el asistente con IA de las landings de Encaja

**Mr. Tomate** es el chat de `/encaja/tiempo`, `/encaja/procesos` y `/encaja/crecer`. Se presenta como lo que es: AUTOMATO hace productos digitales a medida y Mr. Tomate es uno de ellos (lo dicen el pop-up, la cabecera del chat y su saludo: «Si tú también quieres tener tu producto digital, cuéntame de qué se trata»). Resuelve dudas, ayuda a quien visita a concretar qué necesita y, cuando tiene sentido, le propone huecos reales de la agenda. Responde con la API de DeepSeek.

## Dónde aparece

- **Pop-up de llegada** con la oferta «Llévate tu prototipo GRATIS»: «Cuéntale qué necesitas a Mr. Tomate y recibe tu prototipo en una videollamada». Su botón abre el chat en **modo oferta**. Sale una vez por sesión, 1,5 segundos después de contestar a las cookies; si no las contestan, sale igual a los 5 segundos, por encima del aviso (que sigue ahí al cerrarlo). No sale si ya se ha hablado con Mr. Tomate ni si se llega a `#contacto`. En móvil es una tarjeta abajo, no una pantalla completa. Textos en `encajaPromo` (`content/encaja.ts`).
- **Botón del hero** «Habla con Mr. Tomate» (cualquier enlace a `#mr-tomate` abre el chat).
- **Botón flotante** con el tomate, abajo a la derecha.

## Modo oferta: requisitos para el prototipo

Si el chat se abre desde el pop-up, Mr. Tomate sabe que viene de la oferta (`entry: 'promo'`) y cambia de papel. Saluda diciendo que preparará el prototipo con unas preguntas cortas y pregunta de una en una:

1. Qué problema quiere resolver y para quién.
2. Cómo lo hace hoy y qué falla.
3. Quién lo usaría, cuántas personas y desde dónde.
4. Las 3 cosas imprescindibles de la primera versión.
5. Qué información maneja y con qué programas conectarlo.
6. Para cuándo lo necesita y cómo sabrá que funciona.

Con los puntos 1 a 4 ya basta, y no alarga más de 6 u 8 preguntas. Cuando tiene suficiente, le resume lo entendido para que lo confirme y le propone huecos.

- **Qué se promete** (confirmado por el negocio el 10/11/2026): pantallas navegables preparadas antes de la llamada con lo que cuente, y enseñadas en una videollamada de 30 minutos, gratis y sin compromiso. No es un programa funcionando con sus datos ni incluye el desarrollo.
- **Sin llamada reservada no hay prototipo.** Mr. Tomate lo dice al proponer los huecos y si preguntan por recibirlo sin llamada, y en el chat sale siempre bajo los huecos: «Solo preparamos tu prototipo si reservas la llamada». Si prefiere que le escriban, se le escribe para buscar la llamada.
- **Agenda:** como el prototipo se prepara antes, la llamada de la oferta es como pronto a **3 días laborables** (`lib/agenda/promo.ts`). Lo cumplen los huecos que propone el chat, la agenda de la landing (que lo explica) y el servidor al reservar.
- **Al equipo:** el lead llega marcado «prototipo gratis» (asunto del aviso, tipo en Valme OS y título del evento) con una **ficha de requisitos**: problema, para quién, cómo lo hacen hoy, usuarios, imprescindibles, datos e integraciones, plazo y dudas abiertas. En Valme OS va en la respuesta `requisitos`.

## Qué hace y qué no

- Responde **solo con el contenido público de las landings** (`content/encaja.ts`). Si una landing cambia, el asistente cambia con ella. No conoce nada que no esté publicado en la web.
- Pregunta de una en una qué le quita tiempo al visitante, cuántas personas son y qué programas usan. Explica cómo se trabajaría y, cuando hay interés, ofrece la llamada de 30 minutos.
- **Propone huecos, pero no reserva.** Los huecos salen como botones; al pulsar uno, la agenda de la landing se abre con ese hueco elegido y la persona confirma con su nombre, su email, el consentimiento y Turnstile, como siempre.
- No pide nombre, email ni teléfono. Si alguien los escribe, le lleva al formulario.
- No inventa clientes, cifras ni horas ahorradas. El único precio que da es «Desde 3.000 € en 6 meses».
- Se presenta como asistente con IA: la etiqueta «IA» junto al nombre y la línea del pie, como exige el reglamento europeo de IA.
- El chat se descarga al pasar por encima del botón, al pulsarlo o al pulsar la oferta, para no pesar en la carga de la landing.

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
| Textos del chat (saludos, respuestas rápidas) y del pop-up | `encajaAssistant` y `encajaPromo` en `content/encaja.ts` |
| Pop-up de llegada | `components/encaja/assistant/promo-popup.tsx` |
| Regla de los 3 días laborables | `lib/agenda/promo.ts` |

- **Contexto:** en cada turno el navegador manda la conversación entera (como mucho 20 mensajes del visitante). Las instrucciones y el contenido se montan en el servidor; el navegador no puede cambiarlos. Si llega desde Google Ads, el asistente sabe la palabra clave del anuncio (`utm_term`).
- **Conversación:** se guarda solo en `sessionStorage` (se borra al cerrar el navegador). No se guarda en ningún servidor.
- **Al equipo:** si después de hablar con el asistente la persona reserva o deja sus datos, la conversación viaja con el lead y se resume en 3 a 5 líneas. El resumen aparece en Valme OS (respuesta `asistente`) y en el aviso por correo. Si DeepSeek no responde en 6 segundos, va lo que escribió el visitante, recortado: el lead nunca se pierde por esto.
- **Modelo:** `deepseek-flash` sin modo de razonamiento, para que responda rápido. Se cambia con `DEEPSEEK_MODEL` (por ejemplo, `deepseek-v4-pro`).
- **Abuso y coste:** Turnstile invisible en el primer mensaje, una sesión firmada de 45 minutos, 20 mensajes por conversación, 500 caracteres por mensaje y un límite por IP. El saldo de DeepSeek es prepago: nunca se gasta más de lo cargado. Con los precios publicados el 10-nov-2026, una conversación cuesta menos de un céntimo de dólar.

## Datos personales

DeepSeek procesa y guarda los datos en China, según su política de privacidad.

- Antes de enviar cada mensaje se quitan emails, teléfonos, DNI/NIE e IBAN (`redact.ts`).
- La política de privacidad (§2 a §7) y la de cookies recogen a Mr. Tomate y dicen que lo escrito en el chat se trata en China.

⚠️ El 10/11/2026 se quitó, por decisión del negocio, el aviso previo que había en el chat («lo que escribas se envía a DeepSeek, con servidores en China») y que servía de consentimiento explícito. Sin él, la transferencia a China no se apoya en ninguna base del capítulo V del RGPD. Conviene revisarlo con asesoría. Si se prefiere un proveedor que procese en la UE, el cambio está en `lib/assistant/deepseek.ts` y `config.ts`.

## Puesta en marcha

1. Clave de la API de DeepSeek con saldo (platform.deepseek.com). En Vercel, `DEEPSEEK_API_KEY`.
2. Secreto para las sesiones, `ASSISTANT_SECRET` (`openssl rand -base64 32`).
3. Redesplegar: las landings son estáticas y deciden en el build si enseñan el botón.

Sin las dos variables, el asistente no aparece en producción. En local, sin clave, responde en **modo de prueba** (respuestas fijas que sirven para probar la interfaz).

## Pruebas

- **Interfaz:** `npm run dev` y abrir `/encaja/tiempo` (modo de prueba sin clave).
- **Modelo:** con `DEEPSEEK_API_KEY` en `.env.local` y sin `TURNSTILE_SECRET_KEY`, `npm run dev` y después `npm run encaja:asistente-pruebas`. Lanza conversaciones de prueba (precio, fuera de tema, intentos de saltarse las reglas, datos personales, huecos y dos de la oferta del prototipo) y comprueba longitud, cifras, fugas de las instrucciones, preguntas de requisitos y huecos a 3 días laborables o más. Revisar también el tono a ojo.

## Medición

Eventos en GTM (la etiqueta de GA4 del embudo escucha `^web_`), nunca con el texto de la conversación:

- `web_promo_view`, `web_promo_click` y `web_promo_close` (`how`): el pop-up de la oferta.
- `web_chat_open` (`source`, `entry`): abre el chat (botón, hero o pop-up).
- `web_chat_message` (`n`): mensaje número n.
- `web_chat_slots` (`count`): le enseña huecos.
- `web_chat_handoff` (`mode`, `with_slot`): pasa a la agenda o al formulario.
- `web_chat_error` (`type`).

La conversión sigue siendo la reserva o el contacto (`generate_lead`). Para saber si el chat ayuda, comparar en GA4 la tasa de conversión de quien abre el chat con la de quien no.
