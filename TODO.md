# TODO · Pendientes de negocio y validación antes de publicar

Convención de la guía: `{{LLAVES}}` = dato que hay que rellenar · ⚠️ = validar con negocio/legal · 🔧 = opcional / fase 2.

## Decisiones previas (§1.3)

- [x] `{{MARCA}}` → **AUTOMATO** (`site.name`). Isotipo: tomate cortado por la mitad visto desde el corte (`components/layout/brand-mark.tsx`, `app/icon.svg`, `app/apple-icon.png`; se regeneran con `npm run brand:icons`).
- [x] `{{DOMINIO}}` → **automatoagency.art** (canónica `https://www.automatoagency.art`, fijada en `site.config.ts`; `NEXT_PUBLIC_SITE_URL` solo hace falta para sobrescribirla). Email `hola@automatoagency.art` en `site.email`, legales y `.env.example`.
- [ ] ⚠️ Confirmar que el buzón `hola@automatoagency.art` existe y recibe correo (y `no-reply@` en Resend) antes de activar el aviso por email del formulario.
- [x] `{{RAZÓN_SOCIAL}}` y jurisdicción → **Jesús Valenzuela Chuliá** (empresario individual, NIF 53759792Y, Torrent), legislación española y tribunales de Valencia, en `site.legalName` y páginas legales.
- [ ] Herramienta de agenda (Cal.com o Calendly) → `NEXT_PUBLIC_CAL_URL`.
- [x] Analítica → GTM-K3ZHSP9S (GA4 G-MHXH3R4RX3 y píxel de Meta 1826034535373102, con Modo de consentimiento v2 y aviso propio), instalado desde Valme OS. Plausible/Umami ya no se usa.
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
- [ ] ⚠️ Páginas legales: placeholders rellenos y cookies/privacidad al día con GTM, GA4, el píxel de Meta y Valme OS (2-nov-2026). Plazo de conservación de contactos sin proyecto fijado en 12 meses. Falta la revisión con asesoría.
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
