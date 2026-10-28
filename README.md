# Producto-Digital

Web de un estudio que diseña y construye productos digitales a medida (MVPs, software a medida, automatización e IA, productos creativos). Construida siguiendo `docs/guia-web-productos-digitales.md`.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind CSS v4 · GSAP (ScrollTrigger, SplitText, Flip) · Lenis · Radix UI · MDX (`next-mdx-remote`) · react-hook-form + zod · Supabase · Resend · Cloudflare Turnstile · Playwright.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local        # rellena lo que tengas; sin claves, el formulario funciona en modo desarrollo
npm run hero:render               # render del hero en Blender (≈ 40 min en un M4; requiere Blender ≥ 4.2)
npm run sequence:build            # PNG → WebP + pósters + imagen OG
npm run dev                       # http://localhost:3000 (o `npm run dev -- -p 3200`)
```

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` / `build` / `start` | Desarrollo, build de producción, servidor de producción |
| `npm run lint` · `npm run typecheck` | ESLint · `tsc --noEmit` |
| `npm run test:e2e` | Playwright (arranca el dev server en el puerto 3200 si no hay uno) |
| `npm run hero:textures` | Genera las texturas del hero (boceto a lápiz, UI, capas, pantallas) en `assets/hero/textures/` |
| `npm run hero:render [samples]` | Renderiza en Blender (Cycles, GPU Metal) los 150 frames de escritorio y los 150 de móvil en `assets/frames_src/` |
| `npm run hero:render:service -- <slug>` | Renderiza la escena de una página de servicio (`mvp`, `software-a-medida`, `automatizacion-ia`, `productos-creativos`) y la empaqueta en `public/sequence/<slug>/v1/` |
| `npm run sequence:placeholders` | Alternativa sin Blender: frames de prueba en SVG (sobrescribe `assets/frames_src/`) |
| `npm run sequence:build` | PNG → WebP optimizados en `public/sequence/v2/` + pósters + `public/og/poster-last.png` |
| `npm run sequence:check` | Verifica que los bordes de todos los frames son blanco puro |

## Despliegue en Vercel

1. Importa el repositorio en Vercel (framework: Next.js; comandos por defecto: `npm install` y `next build`).
2. Variables de entorno (ver `.env.example`), en *Production* y *Preview*:

| Variable | Obligatoria | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | No, hasta tener dominio | URL canónica, sitemap, OG y JSON-LD. Sin ella se usa el dominio de Vercel |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Sí, para el formulario | Guardar los leads (ejecuta antes `supabase/schema.sql`) |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Sí, para el formulario | Antispam |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Recomendadas | Aviso por email de cada lead |
| `NEXT_PUBLIC_CAL_URL` | No | Agenda embebida en `/contacto` |
| `NEXT_PUBLIC_ANALYTICS_DOMAIN` | No | Analítica sin cookies (Plausible) |

En producción, sin Supabase ni Turnstile, `/api/contact` responde con error de configuración en lugar de perder leads en silencio. El resto de la web funciona sin ninguna variable.

Los frames de las historias (`public/sequence/`) ya están en el repositorio: Vercel no necesita Blender. Se sirven con caché inmutable; si cambia el material, sube `SEQUENCE_VERSION` (§7.7).

## Estructura

```
app/            rutas (App Router), layout raíz, sitemap, robots, OG, API
components/     layout · hero · sections · ui · forms · providers
content/        datos tipados (servicios, FAQ, proceso) y MDX (blog, proyectos, legales)
lib/            gsap, seo, analytics, content loaders, validators
public/sequence frames del hero versionados (v1)
scripts/        hero (Blender + texturas), secuencia, portadas de proyectos, enlaces rotos
tests/e2e/      Playwright + axe
docs/           la guía maestra
```

Pendientes de negocio y validación: ver `TODO.md`.
