# Agenda de la web con Google Calendar y Google Meet

La web enseña los huecos libres de tu Google Calendar y, cuando alguien elige uno, crea el evento con enlace de Google Meet y le envía la invitación por email. La usan las landings de la campaña «Encaja» y el lateral de `/contacto` (`/contacto#agenda`, destino de «Agenda una llamada» en toda la web); allí sin el modo «te escribimos nosotros», porque la página ya es el formulario.

- **Disponibilidad:** `GET /api/agenda/disponibilidad`. Cruza el horario de `lib/agenda/config.ts` con lo ocupado en tu calendario. Solo consulta ocupado o libre: nunca lee el contenido de tus eventos.
- **Reserva:** `POST /api/agenda/reservar`. Vuelve a comprobar el hueco en ese momento, crea el evento con Meet e invita al cliente. Después registra el lead en Valme OS (ver abajo). Si Supabase y Resend están configurados, también lo guarda allí y te avisa por email.
- **«Te escribimos nosotros»:** `POST /api/encaja/contacto`. La misma tarjeta permite dejar los datos sin elegir hueco; el lead va a Valme OS y la pantalla final enseña el one pager.
- **Sin credenciales:** en desarrollo se simula todo y no se crea nada. En producción, si la agenda no carga, la tarjeta pasa directamente al formulario de contacto.

La invitación sale de la cuenta de Google dueña del calendario. Si quieres que salga de `hola@automatoagency.art`, esa dirección tiene que ser una cuenta de Google Workspace.

## Configuración, una sola vez

### 1. Proyecto y API
1. Entra en [Google Cloud Console](https://console.cloud.google.com/) con la cuenta dueña del calendario y crea un proyecto, por ejemplo «AUTOMATO web».
2. En **APIs y servicios → Biblioteca**, activa **Google Calendar API**.

### 2. Pantalla de consentimiento
En **Google Auth Platform**, configura la app:
- **Si la cuenta es de Google Workspace:** tipo de usuario **Interno**.
- **Si es una cuenta de Gmail:** tipo **Externo**. Después pulsa **Publicar app** para pasarla a «En producción». En estado «Prueba», Google caduca el permiso a los 7 días y la agenda dejaría de funcionar.
- **Permisos:** `calendar.freebusy` y `calendar.events`.

Al autorizar una app externa sin verificar, Google te enseñará un aviso de «app no verificada». Solo lo ves tú, una vez: pulsa **Configuración avanzada** y continúa. Los clientes nunca inician sesión en Google.

### 3. Credenciales
En **Credenciales → Crear credenciales → ID de cliente de OAuth**, elige el tipo **App de escritorio**. Copia el ID de cliente y el secreto.

### 4. Permiso para la web
Desde la carpeta del proyecto:

```bash
GOOGLE_CLIENT_ID=tu-id GOOGLE_CLIENT_SECRET=tu-secreto npm run agenda:token
```

Se abre el navegador. Inicia sesión con la cuenta dueña del calendario y acepta. La terminal muestra la línea `GOOGLE_REFRESH_TOKEN=…`.

### 5. Variables en Vercel
En el proyecto de Vercel, **Settings → Environment Variables**, entorno Production:

| Variable | Valor |
|---|---|
| `GOOGLE_CLIENT_ID` | El ID del paso 3 |
| `GOOGLE_CLIENT_SECRET` | El secreto del paso 3 |
| `GOOGLE_REFRESH_TOKEN` | La línea del paso 4 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Clave de sitio de Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Clave secreta de Cloudflare Turnstile |

Turnstile es obligatorio en producción. Sin él, cualquier bot podría enviar invitaciones desde tu calendario, así que la reserva no se activa.

Opcionales:
- `GOOGLE_CALENDAR_ID`: calendario donde se crean las llamadas. Por defecto, el principal.
- `GOOGLE_BUSY_CALENDARS`: otros calendarios que también cuentan como ocupado, separados por comas.

Después, vuelve a desplegar.

## Leads en Valme OS

Cada reserva y cada «te escribimos nosotros» se envían a Valme OS (`lib/valme-os.ts`), que guarda el lead en el CRM de AUTOMATO, manda el correo de respuesta con el enlace al one pager de la landing y avisa al equipo en la app. El formulario de `/contacto` también envía allí sus leads.

En Valme OS, dentro del cliente AUTOMATO, hay una landing por destino:

| Destino | Página de la web | One pager del correo |
|---|---|---|
| `tiempo` | `/encaja/tiempo` | `/encaja/presentacion-tiempo.pdf` |
| `procesos` | `/encaja/procesos` | `/encaja/presentacion-procesos.pdf` |
| `crecer` | `/encaja/crecer` | `/encaja/presentacion-crecer.pdf` |
| `web` | `/contacto` | Ninguno |

En cada una:
- **Orígenes permitidos:** `https://www.automatoagency.art` y `https://automatoagency.art`. Valme OS rechaza los envíos de cualquier otro origen, también los de las previews de Vercel.
- **Plantilla de correo:** el asunto, sin `{{nombre}}`, y el enlace al one pager en el texto.

Sus ids van en Vercel (Production) como `VALME_OS_LANDINGS`, un JSON: `{"tiempo":"…","procesos":"…","crecer":"…","web":"…"}`. Sin esa variable, en producción la reserva sigue funcionando pero el lead no se registra (el log dice `valme_os_config_missing`), y el contacto responde con error y ofrece el email.

## Aviso por correo de cada lead

Cada reserva, cada «te escribimos nosotros» y cada envío de `/contacto` mandan además un correo de aviso (`lib/notify.ts`) con los datos del lead, la página, la campaña y, si es una reserva, la hora y el enlace de Meet. «Responder» le escribe directamente al cliente. Sale por Resend desde `automatoagency.art`, que está verificado en la cuenta de Resend de Valme.

Variables en Vercel (Production): `RESEND_API_KEY` (clave con permiso de envío), `CONTACT_FROM_EMAIL` (remitente del dominio) y `CONTACT_TO_EMAIL` (a quién llega; varios, separados por comas). Sin ellas no se avisa, pero los leads siguen llegando a Valme OS.

## Horario
El horario, la duración, el margen entre llamadas y la antelación mínima están en `lib/agenda/config.ts`. Los festivos y las ausencias se bloquean creando un evento ocupado en tu calendario.

## Comprobar que funciona
1. Abre una landing, por ejemplo `/encaja/tiempo`, y reserva un hueco con otro email tuyo.
2. A ese email llega la invitación con el enlace de Meet.
3. El evento aparece en tu calendario y el hueco desaparece de la web.
4. El lead aparece en Valme OS, en el CRM de AUTOMATO, y llega el correo con el one pager.
5. Repite con «Déjanos tus datos y te escribimos»: lead en Valme OS, correo y botón «Ver el resumen».

## Si algo falla
- **El log dice `token:invalid_grant`:** el permiso ha caducado o se ha revocado. Repite el paso 4 y actualiza `GOOGLE_REFRESH_TOKEN`.
- **El log dice `freebusy:notFound`:** un calendario de `GOOGLE_BUSY_CALENDARS` no existe o la cuenta no tiene acceso.
- **El evento se crea sin Meet:** comprueba que la cuenta tiene Google Meet activado.
- **El log dice `valme_os_lead_failed 403`:** el origen no está permitido en la landing de Valme OS. Con `400` o `404`, revisa el id de `VALME_OS_LANDINGS`.
