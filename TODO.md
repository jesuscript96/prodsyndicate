# TODO · Pendientes de negocio y validación antes de publicar

Convención de la guía: `{{LLAVES}}` = dato que hay que rellenar · ⚠️ = validar con negocio/legal · 🔧 = opcional / fase 2.

## Decisiones previas (§1.3)

- [ ] `{{MARCA}}` → nombre de marca en `site.config.ts` (`site.name`). Hoy se muestra literalmente en header, footer, títulos y metadatos.
- [ ] `{{DOMINIO}}` → `NEXT_PUBLIC_SITE_URL` en `.env.local` / Vercel y email `hola@{{DOMINIO}}` (`site.email`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`).
- [ ] `{{RAZÓN_SOCIAL}}` y jurisdicción → `site.legalName` y páginas legales.
- [ ] Herramienta de agenda (Cal.com o Calendly) → `NEXT_PUBLIC_CAL_URL`.
- [ ] Analítica (Plausible o Umami) → script en `app/layout.tsx` + `NEXT_PUBLIC_ANALYTICS_DOMAIN`.
- [ ] ⚠️ `site.areaServed` en JSON-LD `Service` (hoy `ES`).
- [ ] Redes sociales → `site.social`.

## Contenido ⚠️

- [ ] Casos de estudio **reales** con permiso escrito. Hoy `content/projects/*.mdx` son **casos de concepto** etiquetados (`isConcept: true`), sin cliente ni métricas.
- [ ] FAQ (`content/faq.ts`): confirmar precios, plazos ("4 y 10 semanas"), propiedad del código y soporte.
- [ ] Proceso (`content/process.ts` y `/proceso`): duraciones orientativas, cadencia de entregas, garantías y soporte post-lanzamiento.
- [ ] Servicios: nº de usuarios en pruebas (MVP), traspaso de código según contrato, producción de assets 3D/vídeo, seguridad de datos con IA.
- [ ] `/contacto`: "Te respondemos en menos de un día laborable" solo si es compromiso real; rangos de presupuesto `{{RANGOS}}`.
- [ ] `/nosotros`: equipo (`{{EQUIPO}}`, `{{NOMBRE}}`), fotos, bios, colaboradores; "estudio pequeño" si es cierto.
- [ ] Blog: autor `{{AUTOR}}`, proveedor de newsletter `{{PROVEEDOR}}` (doble opt-in, RGPD). Publicar ≥ 3 artículos reales.
- [ ] Páginas legales: redactar/revisar con asesoría según la jurisdicción. Las de `content/legal/` son borrador con placeholders `{{RAZÓN_SOCIAL}}`, `{{NIF}}`, `{{DOMICILIO}}`, `{{DATOS_REGISTRALES}}`, `{{JURISDICCIÓN}}`, `{{PLAZO}}` (conservación de leads).
- [ ] ⚠️ Confirmar con cada proveedor el mecanismo de transferencia internacional (Vercel, Resend, Cloudflare), si Turnstile usa cookies y qué cookies pone la agenda (Cal.com/Calendly). La referencia a la AEPD asume jurisdicción española.

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
