# TODO · Pendientes de negocio y validación antes de publicar

Convención: ⚠️ = validar con negocio/legal · 🔧 = opcional / fase 2. Nada pendiente se deja visible en la web: ni marcadores de plantilla ni avisos en el copy.

## Decisiones previas (§1.3)

- [x] `{{MARCA}}` → **AUTOMATO** (`site.name`). Isotipo: tomate cortado por la mitad visto desde el corte (`components/layout/brand-mark.tsx`, `app/icon.svg`, `app/apple-icon.png`; se regeneran con `npm run brand:icons`).
- [x] `{{DOMINIO}}` → **automatoagency.art** (canónica `https://www.automatoagency.art`, fijada en `site.config.ts`; `NEXT_PUBLIC_SITE_URL` solo hace falta para sobrescribirla). Email `hola@automatoagency.art` en `site.email`, legales y `.env.example`.
- [x] `hola@automatoagency.art` recibe correo desde el 5/11/2026 (alias en Google Workspace, con MX y SPF de Google en el DNS de Hostinger).
- [ ] `no-reply@` en Resend antes de activar el aviso por email del formulario y de la agenda.
- [x] `{{RAZÓN_SOCIAL}}` y jurisdicción → **Jesús Valenzuela Chuliá** (empresario individual, NIF 53759792Y, Torrent), legislación española y tribunales de Valencia, en `site.legalName` y páginas legales.
- [ ] Herramienta de agenda: las landings `/encaja/*` usan la agenda propia con Google Calendar (`docs/agenda-google.md`). `/contacto` sigue esperando `NEXT_PUBLIC_CAL_URL` (Cal.com o Calendly) o pasar a la agenda propia. Sus leads ya van a Valme OS (landing `web`).
- [x] Analítica → GTM-K3ZHSP9S (GA4 G-MHXH3R4RX3 y píxel de Meta 1826034535373102, con Modo de consentimiento v2 y aviso propio), instalado desde Valme OS. Plausible/Umami ya no se usa.
- [ ] ⚠️ `site.areaServed` en JSON-LD `Service` (hoy `ES`).
- [ ] Redes sociales → `site.social`.

## Contenido ⚠️

- [ ] Casos de estudio **reales** con permiso escrito. Hoy `content/projects/*.mdx` son **casos de concepto** etiquetados (`isConcept: true`), sin cliente ni métricas.
- [ ] FAQ (`content/faq.ts`): confirmar precios, plazos ("4 y 10 semanas"), propiedad del código y soporte.
- [ ] Proceso (`content/process.ts` y `/proceso`): duraciones orientativas, cadencia de entregas, garantías y soporte post-lanzamiento.
- [ ] Servicios: nº de usuarios en pruebas (MVP), traspaso de código según contrato, producción de assets 3D/vídeo, seguridad de datos con IA. Los avisos ⚠️ ya no aparecen en el copy.
- [ ] `/contacto`: "Te respondemos en menos de un día laborable" solo si es compromiso real; rangos de presupuesto (`BUDGET_RANGES` en `lib/validators.ts`).
- [x] `/nosotros`: Jesús Valenzuela como responsable del estudio (ficha única, sin foto). Pendiente: foto y, si el equipo crece, más fichas.
- [x] Blog: autor Jesús Valenzuela en los seis artículos.
- [ ] Blog: proveedor de newsletter (doble opt-in, RGPD).
- [ ] ⚠️ Páginas legales: placeholders rellenos y cookies/privacidad al día con GTM, GA4, el píxel de Meta y Valme OS (2-nov-2026). Plazo de conservación de contactos sin proyecto fijado en 12 meses. Falta la revisión con asesoría.
- [ ] ⚠️ Confirmar con cada proveedor el mecanismo de transferencia internacional (Vercel, Resend, Cloudflare), si Turnstile usa cookies y qué cookies pone la agenda (Cal.com/Calendly). La referencia a la AEPD asume jurisdicción española.

## Campaña «Encaja» (`/encaja/*`) ⚠️

Antes de poner anuncios hacia las landings:

- [x] **Agenda con Google Calendar** en producción desde el 5/11/2026: variables de Google en Vercel y reserva de prueba hecha (invitación con Meet, one pager y `generate_lead`). Pasos en `docs/agenda-google.md`.
- [x] **Turnstile en producción** desde el 5/11/2026 (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`).
- [x] Horario de llamadas confirmado el 5/11/2026: L-J 10-14 y 16-19, V 10-14, 15 min de margen, 12 h de antelación, 14 días (`lib/agenda/config.ts`).
- [x] Precio confirmado el 5/11/2026: «Desde 3.000 € en 6 meses» (`content/encaja.ts` y textos de Google Ads).
- [x] Caso real del equipo comercial (`encajaCase`) confirmado el 5/11/2026: se publica sin nombre, sector ni cifras.
- [x] Plazos («primer resultado en 2 a 4 semanas», «propuesta cerrada en pocos días») y la FAQ de propiedad («Tuyo») confirmados el 5/11/2026.
- [x] Conversión «Llamada reservada» en Google Ads con el evento `generate_lead` de GTM (5/11/2026). También llega a GA4.
- [ ] **Leads en Valme OS**: la reserva, «te escribimos nosotros» y `/contacto` envían el lead a Valme OS (CRM y correo con el one pager). Falta crear las cuatro landings en Valme OS (cliente AUTOMATO), con los orígenes de la web, y poner sus ids en Vercel como `VALME_OS_LANDINGS` (`docs/agenda-google.md`, «Leads en Valme OS»).
- [ ] Conversión «Contacto enviado» en Google Ads con `generate_lead` y `lead_type = contacto` (GTM, pendiente de publicar).
- [ ] Campaña de búsqueda según `docs/encaja/google-ads.md`. Mapa de todos los assets: `docs/encaja/README.md`.
- [ ] Marcar `generate_lead` como evento clave en GA4 cuando aparezca en la lista de eventos (tarda hasta 24 h).

## Hero (§7)

- [x] Material del hero (v2) renderizado en Blender (escena procedural `scripts/hero/scene.py`, Cycles + Metal): 150 frames escritorio (1200²) y 90 móvil (720×900) siguiendo la hoja de escenas §7.3. Regenerar con `npm run hero:render && npm run sequence:build && npm run sequence:check`.
- [ ] 🔧 Dirección de arte: las pantallas son UI abstracta generada (`scripts/hero/make-textures.mjs`); sustituir por exportaciones de Figma si se quiere la UI de un producto concreto.
- [ ] Revisar `CHIPS` (posiciones) en `components/hero/hero.config.ts` sobre el material final en escritorio y móvil (§6.8).

## Técnico

- [ ] Cuentas y claves: Supabase (ejecutar `supabase/schema.sql`, región UE), Resend (SPF/DKIM/DMARC), Cloudflare Turnstile. Sin ellas, `/api/contact` solo registra el lead en consola (desarrollo).
- [ ] CSP en modo report-only con los dominios finales (analítica, Turnstile, agenda) en `next.config.ts`.
- [ ] Vercel: proyecto, variables de entorno, dominio, redirección `www` → apex.
- [ ] Search Console y Bing: alta y envío de `sitemap.xml`.
- [ ] Lighthouse CI (`lighthouserc.json`) y pruebas en dispositivos reales (iPhone + Android gama media).
- [ ] 🔧 Rate limiting del formulario (`@upstash/ratelimit`) si aparece spam.
- [ ] 🔧 Degradación automática del hero a estático por fps bajos (§11.2 punto 10).
- [ ] 🔧 Fase 2: 3D en tiempo real (React Three Fiber, §7.8), selector de idioma, `CursorDot`, `ScrollProgress`.
