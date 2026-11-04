# Agenda de la web con Google Calendar y Google Meet

La web enseña los huecos libres de tu Google Calendar y, cuando alguien elige uno, crea el evento con enlace de Google Meet y le envía la invitación por email. La usan las landings de la campaña «Encaja».

- **Disponibilidad:** `GET /api/agenda/disponibilidad`. Cruza el horario de `lib/agenda/config.ts` con lo ocupado en tu calendario. Solo consulta ocupado o libre: nunca lee el contenido de tus eventos.
- **Reserva:** `POST /api/agenda/reservar`. Vuelve a comprobar el hueco en ese momento, crea el evento con Meet e invita al cliente. Si Supabase y Resend están configurados, también guarda el lead y te avisa por email.
- **Sin credenciales:** en desarrollo se simula todo y no se crea nada. En producción la agenda no aparece y la landing ofrece el email.

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

## Horario
El horario, la duración, el margen entre llamadas y la antelación mínima están en `lib/agenda/config.ts`. Los festivos y las ausencias se bloquean creando un evento ocupado en tu calendario.

## Comprobar que funciona
1. Abre una landing, por ejemplo `/encaja/tiempo`, y reserva un hueco con otro email tuyo.
2. A ese email llega la invitación con el enlace de Meet.
3. El evento aparece en tu calendario y el hueco desaparece de la web.

## Si algo falla
- **El log dice `token:invalid_grant`:** el permiso ha caducado o se ha revocado. Repite el paso 4 y actualiza `GOOGLE_REFRESH_TOKEN`.
- **El log dice `freebusy:notFound`:** un calendario de `GOOGLE_BUSY_CALENDARS` no existe o la cuenta no tiene acceso.
- **El evento se crea sin Meet:** comprueba que la cuenta tiene Google Meet activado.
