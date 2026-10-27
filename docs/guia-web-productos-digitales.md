# Guía maestra · Web de desarrollo de productos digitales a medida

> **Versión 1.0 · 26 de octubre de 2026**
> Documento de instrucciones completo para diseñar, producir y construir el sitio: arquitectura, diseño, contenidos, animación, código, SEO, rendimiento, accesibilidad, QA y lanzamiento.
> Idioma del sitio: español (`es`). Marca: `{{MARCA}}` (nombre pendiente, ver §1.3).

---

## Índice

0. Cómo usar este documento
1. [Visión y objetivos](#1-visión-y-objetivos)
2. [Dirección creativa](#2-dirección-creativa)
3. [Arquitectura de información](#3-arquitectura-de-información)
4. [Stack técnico y puesta en marcha](#4-stack-técnico-y-puesta-en-marcha)
5. [Sistema de diseño](#5-sistema-de-diseño)
6. [Home: la página estrella](#6-home-la-página-estrella)
7. [Producción de los assets del hero](#7-producción-de-los-assets-del-hero)
8. [Páginas interiores](#8-páginas-interiores)
9. [Formulario de contacto y backend](#9-formulario-de-contacto-y-backend)
10. [SEO](#10-seo)
11. [Rendimiento](#11-rendimiento)
12. [Accesibilidad](#12-accesibilidad)
13. [Analítica, privacidad y legal](#13-analítica-privacidad-y-legal)
14. [QA y pruebas](#14-qa-y-pruebas)
15. [Despliegue](#15-despliegue)
16. [Plan por fases](#16-plan-por-fases)
17. [Prompts para un agente de código](#17-prompts-para-un-agente-de-código)
18. [Riesgos y mitigaciones](#18-riesgos-y-mitigaciones)
19. [Checklist de lanzamiento](#19-checklist-de-lanzamiento)

---

## 0. Cómo usar este documento

- Está escrito para que lo pueda seguir **una persona o un agente de código sin contexto previo**. Cada decisión importante está resuelta; lo que no puede resolverse desde aquí está marcado como pendiente.
- **Convenciones**
  - `{{LLAVES}}` = dato que hay que rellenar antes de publicar.
  - ✅ obligatorio · ⚠️ validar con negocio/legal antes de publicar · 🔧 opcional o fase 2.
  - Los textos en español son **propuesta de copy lista para usar**. Cualquier cifra, plazo, precio o promesa comercial debe confirmarse (⚠️). **No se inventan métricas ni clientes.**
  - Los bloques de código son **implementación de referencia**. Están pensados para funcionar, pero hay que verificar cada API contra la versión instalada del paquete (`npm view <paquete> version`).
- **Orden de lectura recomendado:** §1–§5 (fundamentos) → §6–§7 (home y hero) → §8 (resto de páginas) → §9–§15 (técnica) → §16–§19 (ejecución).
- **Regla de oro del proyecto:** *un solo gesto espectacular por pantalla; todo lo demás, silencio y precisión.* Lo espectacular es el hero; el resto de la web es elegante, rápida y clara.

---

## 1. Visión y objetivos

### 1.1 Qué es

Una nueva línea de negocio que **diseña y construye productos digitales a medida** para dos públicos:

- **Emprendedores** con una idea que necesitan convertir en un MVP real (app, plataforma, herramienta).
- **Empresas** que necesitan software a medida, herramientas internas, automatizaciones o experiencias digitales creativas/operativas.

La propuesta de valor: *de la idea a un producto que funciona, con diseño de alto nivel, desarrollo eficiente y automatización/IA donde aporta valor.*

### 1.2 Objetivos de la web

| # | Objetivo | Cómo se mide |
|---|---|---|
| 1 | Generar conversaciones cualificadas | Envíos del formulario + llamadas agendadas |
| 2 | Posicionar la marca como estudio de producto de alto nivel | Tiempo en home, scroll hasta el final del hero, retorno de visitas |
| 3 | **Demostrar capacidad técnica con el propio sitio** (el hero es el mejor portfolio) | Calidad percibida, menciones, feedback de clientes |
| 4 | Captar tráfico orgánico cualificado | Posiciones y clics en Search Console para servicios y blog |

### 1.3 Decisiones previas (rellenar antes de empezar)

| Decisión | Valor propuesto | Estado |
|---|---|---|
| Nombre de marca | `{{MARCA}}` (se centraliza en `site.config.ts`) | ⚠️ pendiente |
| Dominio | `{{DOMINIO}}` | ⚠️ pendiente |
| Razón social y jurisdicción legal | `{{RAZÓN_SOCIAL}}` | ⚠️ pendiente |
| Herramienta de agenda | Cal.com o Calendly (embed) | elegir |
| Casos de estudio | 3 reales, con permiso del cliente | ⚠️ pendiente |
| Logos de clientes | Solo con autorización escrita | ⚠️ |
| Producción del vídeo/3D del hero | Ruta híbrida Blender + IA (ver §7) | decidir presupuesto |
| Analítica | Plausible o Umami (sin cookies) | elegir |
| Email de contacto | `hola@{{DOMINIO}}` | crear |
| Tono de voz | Cercano, preciso, sin jerga innecesaria; tuteo | fijado |

### 1.4 Referencia: cometalabs.io

Se toma como **referencia de estructura**, no de contenido ni de estética.

- **Adoptamos (como patrón):** orden narrativo de la home (propuesta de valor → prueba social → impacto → servicios → trabajos → proceso → FAQ → laboratorio → llamada), navegación flotante en píldora, proceso explicado en pocos pasos, FAQ clara, sección de laboratorio/blog técnico.
- **No copiamos:** textos, imágenes, logos, tarjetas, nombre, composición exacta ni identidad visual. Todo el copy, los visuales y los assets de esta guía son originales.
- **Superamos:** hero inmersivo con storytelling controlado por scroll (su hero es estático), páginas dedicadas por audiencia, casos de estudio en profundidad y un laboratorio con demos reales.

### 1.5 Métricas de éxito (primeros 90 días)

- Core Web Vitals en verde (p75): LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1.
- ≥ 60 % de visitantes de escritorio que superan el capítulo 02 del hero (evento `hero_chapter`).
- Tasa visita → formulario o llamada: objetivo inicial `{{X}} %` ⚠️ (fijarlo con datos de las primeras semanas).

---

## 2. Dirección creativa

### 2.1 Sensación buscada

**"Elegancia silenciosa con un momento de asombro."** Un lienzo blanco, tipografía grande y segura, mucho aire, líneas finas, y un hero donde una idea (un boceto) se transforma en un producto real mientras el usuario hace scroll.

### 2.2 Principios

1. **El blanco es el lienzo.** Fondo `#FFFFFF` real, sin degradados sucios. El objeto 3D flota sobre blanco puro con sombras suaves.
2. **Un gesto espectacular por pantalla.** Si hay animación grande, el resto está quieto.
3. **Movimiento con intención.** Cada animación explica algo (transformación, jerarquía, causa-efecto). Nada de movimiento decorativo gratuito.
4. **Precisión técnica visible.** Alineaciones exactas, microdetalles (etiquetas mono, líneas hairline, números de capítulo), tipografía cuidada.
5. **Contraste de voces tipográficas.** Sans moderna para estructura y una serif cursiva solo para 1–2 palabras clave por titular.
6. **El rendimiento es parte del diseño.** Si un efecto compromete la velocidad en móvil, se simplifica.

### 2.3 Haz / No hagas

| ✅ Haz | ❌ No hagas |
|---|---|
| Titulares enormes, con 1–2 palabras en serif cursiva | Más de una cursiva por titular |
| Un único color de acento (ultramar) y un punto de señal naranja minúsculo | Paletas multicolor o gradientes protagonistas |
| Hairlines de 1 px, radios grandes (24 px), sombras largas y muy suaves | Sombras duras, bordes gruesos, neumorfismo |
| Texto real en HTML sobre el vídeo (SEO, accesibilidad) | Texto "quemado" dentro de los frames |
| Animaciones con easing expo/quart y duraciones medidas | Rebotes, elásticos, giros bruscos |
| Respetar `prefers-reduced-motion` con una versión estática completa | Secuestrar el scroll o bloquear al usuario |
| Mostrar proyectos y cifras **reales** | Cifras, logos o testimonios inventados |

### 2.4 Referencias de técnica (no de estética)

- **Secuencias de frames controladas por scroll en canvas**, como las páginas de producto de Apple: el patrón técnico de referencia para el hero.
- **Estudios de producto/diseño con mezcla sans + serif cursiva**: referencia para la jerarquía tipográfica.
- Montar un **moodboard** (Figma/Miro) con 12–20 referencias antes de producir el hero: composición de objeto sobre blanco, sombras, vidrio esmerilado, líneas de boceto a lápiz. Validarlo antes de gastar en producción.

---

## 3. Arquitectura de información

### 3.1 Mapa del sitio

| Ruta | Página | Propósito | CTA principal | Prioridad |
|---|---|---|---|---|
| `/` | Home | Impacto + propuesta de valor + conversión | Cuéntanos tu idea | P0 |
| `/servicios` | Servicios (índice) | Visión general de la oferta | Cuéntanos tu idea | P0 |
| `/servicios/mvp` | MVP para emprendedores | Captar ideas en fase inicial | Cuéntanos tu idea | P0 |
| `/servicios/software-a-medida` | Software a medida para empresas | Captar proyectos B2B | Agenda una llamada | P0 |
| `/servicios/automatizacion-ia` | Automatización e IA | Captar procesos operativos | Agenda una llamada | P1 |
| `/servicios/productos-creativos` | Productos creativos e interactivos | Captar proyectos de marca/experiencia | Cuéntanos tu idea | P1 |
| `/proyectos` | Proyectos (índice con filtros) | Prueba de trabajo | Ver caso | P0 |
| `/proyectos/[slug]` | Caso de estudio | Profundidad y confianza | Hablemos de tu proyecto | P0 |
| `/proceso` | Cómo trabajamos | Reducir fricción y miedo | Agenda una llamada | P1 |
| `/emprendedores` | Landing para emprendedores | Convertir fundadores | Cuéntanos tu idea | P1 |
| `/empresas` | Landing para empresas | Convertir equipos/directivos | Agenda una llamada | P1 |
| `/nosotros` | Nosotros | Confianza y criterio | Hablemos | P1 |
| `/blog` + `/blog/[slug]` | Laboratorio / blog | SEO y autoridad técnica | Suscribirse / Contacto | P1 |
| `/contacto` | Contacto (asistente + agenda) | Conversión | Enviar | P0 |
| `/legal/privacidad` · `/legal/cookies` · `/legal/aviso-legal` | Legales | Cumplimiento | — | P0 |
| `/404` | Error | Recuperar al usuario | Volver al inicio | P2 |
| `/sitemap.xml` · `/robots.txt` · `/feed.xml` | Técnicas | SEO | — | P0 |

### 3.2 Navegación

- **Header (píldora flotante):** logo · Servicios (menú desplegable con los 4 servicios y una línea descriptiva cada uno) · Proyectos · Proceso · Nosotros · Blog · botón **Cuéntanos tu idea**.
- **Footer:** 4 columnas — (1) marca + frase + email, (2) Servicios, (3) Compañía (Proyectos, Proceso, Nosotros, Blog, Contacto), (4) Legal + redes. Franja inferior: © año, razón social, selector de idioma 🔧 (fase 2).
- **Migas de pan** en páginas internas (también como JSON-LD `BreadcrumbList`).
- **Enlazado interno:** cada servicio enlaza a 2 casos relacionados y a 2 artículos del blog; cada artículo enlaza a su servicio.

---

## 4. Stack técnico y puesta en marcha

### 4.1 Stack

| Capa | Elección | Motivo |
|---|---|---|
| Framework | **Next.js** (App Router, última estable) + React + **TypeScript estricto** | SSG/SSR, Metadata API, optimización de imágenes, despliegue directo en Vercel |
| Estilos | **Tailwind CSS** + variables CSS (tokens) | Velocidad y consistencia |
| Animación | **GSAP** (core + ScrollTrigger + SplitText) + `@gsap/react` | Estándar para animación por scroll; hoy todo el conjunto es gratuito, incluso para uso comercial |
| Scroll suave | **Lenis** | Inercia suave sincronizada con ScrollTrigger |
| Contenido | Datos TS tipados + **MDX** para blog y casos | Contenido versionado en el repo |
| Formularios | `react-hook-form` + `zod` | Validación compartida cliente/servidor |
| Backend | Route Handlers de Next.js + **Supabase** (Postgres) + **Resend** (email) | Mínimo, barato, fiable |
| Antispam | **Cloudflare Turnstile** + honeypot | Privacidad y baja fricción |
| Primitivas UI | **Radix UI** (accordion, dialog, navigation-menu) | Accesibilidad resuelta |
| Iconos | Lucide o Phosphor (trazo fino, 1,5 px) | Coherencia con hairlines |
| Analítica | Plausible o Umami | Sin cookies, ligero |
| Hosting | **Vercel** | CDN global, previews por rama |
| Calidad | ESLint, Prettier, Playwright, Lighthouse CI | Regresiones controladas |
| 3D en tiempo real 🔧 | `three` + `@react-three/fiber` + `@react-three/drei` | Solo fase 2 (ver §7.8) |

### 4.2 Puesta en marcha

```bash
npx create-next-app@latest {{slug}} --ts --tailwind --eslint --app --import-alias "@/*"
cd {{slug}}

# Animación, scroll y UI
npm i gsap @gsap/react lenis lucide-react clsx
npm i @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-navigation-menu

# Formularios y backend
npm i zod react-hook-form @hookform/resolvers
npm i @supabase/supabase-js resend

# Contenido MDX
npm i next-mdx-remote gray-matter reading-time

# Desarrollo y calidad
npm i -D sharp prettier prettier-plugin-tailwindcss @playwright/test @lhci/cli
npx playwright install --with-deps chromium webkit
```

### 4.3 Variables de entorno (`.env.local`; nunca al repo)

```bash
NEXT_PUBLIC_SITE_URL=https://{{DOMINIO}}
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=     # SOLO servidor
RESEND_API_KEY=
CONTACT_TO_EMAIL=hola@{{DOMINIO}}
CONTACT_FROM_EMAIL="{{MARCA}} <no-reply@{{DOMINIO}}>"
NEXT_PUBLIC_CAL_URL={{URL_AGENDA}}
NEXT_PUBLIC_ANALYTICS_DOMAIN={{DOMINIO}}
```

Añadir `.env.example` con las mismas claves vacías.

### 4.4 Configuración central (`site.config.ts`)

```ts
export const site = {
  name: '{{MARCA}}',
  legalName: '{{RAZÓN_SOCIAL}}',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://{{DOMINIO}}',
  locale: 'es',
  email: 'hola@{{DOMINIO}}',
  calendarUrl: process.env.NEXT_PUBLIC_CAL_URL ?? '',
  tagline: 'Productos digitales a medida, de la idea al lanzamiento.',
  social: { linkedin: '', x: '', github: '' },
} as const;
```

### 4.5 Estructura de carpetas

```
.
├─ app/
│  ├─ (marketing)/
│  │  ├─ layout.tsx                  # Header, Footer, SmoothScrollProvider
│  │  ├─ template.tsx                # transición de página ligera
│  │  ├─ page.tsx                    # Home
│  │  ├─ servicios/
│  │  │  ├─ page.tsx
│  │  │  └─ [slug]/page.tsx
│  │  ├─ proyectos/
│  │  │  ├─ page.tsx
│  │  │  └─ [slug]/page.tsx
│  │  ├─ proceso/page.tsx
│  │  ├─ emprendedores/page.tsx
│  │  ├─ empresas/page.tsx
│  │  ├─ nosotros/page.tsx
│  │  ├─ blog/
│  │  │  ├─ page.tsx
│  │  │  └─ [slug]/page.tsx
│  │  ├─ contacto/page.tsx
│  │  └─ legal/[slug]/page.tsx
│  ├─ api/contact/route.ts
│  ├─ feed.xml/route.ts
│  ├─ layout.tsx                     # <html lang="es">, fuentes, metadata base
│  ├─ globals.css                    # tokens + base
│  ├─ not-found.tsx
│  ├─ opengraph-image.tsx
│  ├─ robots.ts
│  └─ sitemap.ts
├─ components/
│  ├─ layout/        (Header, Footer, MegaMenu, MobileMenu)
│  ├─ hero/          (HeroStory, hero.config.ts, HeroOverlays, HeroStatic)
│  ├─ sections/      (Manifesto, Services, ProjectsRail, Process, Stack, Faq, CtaBand ...)
│  ├─ ui/            (Button, LinkArrow, Chip, SectionLabel, Marquee, Reveal, SplitReveal, ImageReveal)
│  ├─ forms/         (ContactWizard, steps/*)
│  └─ providers/     (SmoothScrollProvider)
├─ content/
│  ├─ services.ts
│  ├─ projects/*.mdx
│  ├─ blog/*.mdx
│  ├─ faq.ts
│  └─ legal/*.mdx
├─ lib/
│  ├─ frame-sequence.ts              # motor de la secuencia en canvas
│  ├─ gsap.ts                        # registro único de plugins
│  ├─ seo.ts                         # helpers de metadata y JSON-LD
│  ├─ validators.ts                  # esquemas zod
│  └─ analytics.ts
├─ public/
│  ├─ sequence/v1/desktop/f_0001.webp ...
│  ├─ sequence/v1/mobile/f_0001.webp ...
│  ├─ sequence/v1/poster-first.webp
│  ├─ sequence/v1/poster-last.webp
│  └─ og/
├─ scripts/
│  ├─ build-sequence.mjs
│  └─ check-white.mjs
├─ tests/e2e/*.spec.ts
├─ site.config.ts
└─ next.config.ts
```

### 4.6 Convenciones de código

- TypeScript `strict: true`; sin `any` salvo casos documentados.
- Componentes **de servidor por defecto**; `'use client'` solo en animación, formularios y menús interactivos.
- Contenido separado de la presentación (`/content`), tipado.
- Archivos en `kebab-case`, componentes en `PascalCase`.
- Un único módulo registra los plugins de GSAP (`lib/gsap.ts`) para evitar registros duplicados.
- Imágenes siempre con `next/image` (excepto los frames de la secuencia, que van por `fetch`).
- Commits convencionales (`feat:`, `fix:`, `perf:`, `docs:`); ramas cortas con preview en Vercel.

---

## 5. Sistema de diseño

### 5.1 Color (tokens)

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#FFFFFF` | Fondo base (**blanco puro**, coincide con el fondo de los frames) |
| `--paper-2` | `#F6F6F3` | Secciones alternas, tarjetas suaves |
| `--ink` | `#0B0B0F` | Texto principal, botón primario |
| `--ink-2` | `#3A3A42` | Texto secundario |
| `--ink-3` | `#6B6B76` | Texto terciario, metadatos (≈ 5,2:1 sobre blanco) |
| `--line` | `#E8E8E3` | Hairlines y bordes |
| `--accent` | `#2B3BFF` | Ultramar: enlaces, estados activos, detalles de UI (≈ 6,6:1 sobre blanco) |
| `--accent-soft` | `#EEF0FF` | Fondos de chips y resaltados |
| `--signal` | `#FF5A1F` | **Solo decorativo** (punto "live", cursor). Contraste ≈ 3,1:1: nunca para texto pequeño |

### 5.2 `app/globals.css` (Tailwind v4; si se usa v3, mapear los mismos tokens en `tailwind.config`)

```css
@import "tailwindcss";

:root {
  --paper: #ffffff;
  --paper-2: #f6f6f3;
  --ink: #0b0b0f;
  --ink-2: #3a3a42;
  --ink-3: #6b6b76;
  --line: #e8e8e3;
  --accent: #2b3bff;
  --accent-soft: #eef0ff;
  --signal: #ff5a1f;

  --radius-card: 24px;
  --radius-pill: 999px;

  --shadow-card:
    0 1px 0 rgba(11, 11, 15, 0.04),
    0 12px 32px -12px rgba(11, 11, 15, 0.12),
    0 2px 6px rgba(11, 11, 15, 0.04);
  --shadow-float:
    0 30px 60px -24px rgba(11, 11, 15, 0.22),
    0 8px 20px -8px rgba(11, 11, 15, 0.08);

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);

  --section-y: clamp(5rem, 10vw, 10rem);
  --gutter: clamp(1rem, 3vw, 2rem);
}

@theme inline {
  --color-paper: var(--paper);
  --color-paper-2: var(--paper-2);
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-ink-3: var(--ink-3);
  --color-line: var(--line);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-signal: var(--signal);

  --font-sans: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-instrument), Georgia, serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
}

html { background: var(--paper); color: var(--ink); -webkit-text-size-adjust: 100%; }
body { font-family: var(--font-sans); font-size: 1.0625rem; line-height: 1.6; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }

/* Lenis */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }

/* Foco visible, accesible y elegante */
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }
}
```

### 5.3 Tipografía

Cargar con `next/font` (sin parpadeo ni saltos de layout) en `app/layout.tsx`:

```tsx
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap' });

// <html lang="es" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
```

| Estilo | Fuente | Tamaño (clamp) | Interlineado | Tracking |
|---|---|---|---|---|
| `display-xl` (H1 hero) | Geist 500 | `clamp(3rem, 7.5vw + 1rem, 8rem)` | 0.95 | -0.04em |
| `display-l` (H1 interiores) | Geist 500 | `clamp(2.5rem, 5vw + 1rem, 5.5rem)` | 1.0 | -0.035em |
| `h2` | Geist 500 | `clamp(2rem, 3.4vw + .5rem, 3.75rem)` | 1.05 | -0.03em |
| `h3` | Geist 500 | `clamp(1.5rem, 1.6vw + .8rem, 2rem)` | 1.15 | -0.02em |
| `body-l` | Geist 400 | `1.25rem` | 1.55 | -0.01em |
| `body` | Geist 400 | `1.0625rem` | 1.6 | 0 |
| `label` | Geist Mono 400 | `.75rem` MAYÚSCULAS | 1.3 | +0.12em |
| `accent` | Instrument Serif *cursiva* | hereda | hereda | -0.01em |

**Regla del acento:** en cada titular, **una o dos palabras** (máximo) en `accent` (serif cursiva), a veces en color `--accent`. Ejemplo: `Convertimos ideas en <em class="font-serif italic">productos digitales</em> a medida.`

### 5.4 Layout, espaciado y forma

- **Contenedor:** máx. 1280 px (texto y secciones) · 1440 px (hero y galerías) · gutters `--gutter`.
- **Rejilla:** 12 columnas en ≥ 1024 px, 8 en tablet, 4 en móvil.
- **Espaciado vertical entre secciones:** `--section-y`.
- **Escala de espaciado:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- **Radios:** tarjetas 24 px · botones y chips píldora · imágenes 20–28 px.
- **Bordes:** 1 px `--line`. **Sombras:** solo `--shadow-card` y `--shadow-float`.
- **Etiqueta de sección:** línea mono pequeña tipo `01 — Servicios`, siempre encima del H2.

### 5.5 Movimiento (tokens)

| Token | Valor | Uso |
|---|---|---|
| `dur-micro` | 160 ms | Hover, foco |
| `dur-ui` | 320 ms | Menús, acordeones |
| `dur-reveal` | 700 ms | Revelados de contenido |
| `dur-hero-in` | 1100 ms | Entrada del H1 del hero |
| Easing UI | `cubic-bezier(.16,1,.3,1)` | Entradas |
| Easing GSAP | `expo.out` / `power3.out` / `none` (scrub) | Entradas / salidas / scroll-scrub |
| Stagger texto | 0.06 s por línea | `SplitReveal` |
| Desplazamiento de entrada | 24 px (nunca más de 40) | Revelados |

### 5.6 Componentes

| Componente | Descripción y reglas |
|---|---|
| `Header` / `NavPill` | Píldora flotante: `top: 16px`, ancho máx. 920 px, fondo blanco 80 % + `backdrop-blur`, borde hairline y `--shadow-card`. Se oculta al bajar y reaparece al subir (excepto durante el hero fijado, donde permanece visible). En móvil: píldora con logo + botón que abre una hoja a pantalla completa con enlaces grandes y stagger. |
| `MegaMenu` (Servicios) | Radix NavigationMenu. 4 tarjetas con icono, título y una línea. Cierre con Esc, navegable por teclado. |
| `Button` | Variantes `primary` (fondo `--ink`, texto blanco), `secondary` (blanco + borde hairline), `ghost`. Alto 52 px, píldora. Hover: la flecha desliza y el botón se desplaza magnéticamente ≤ 6 px (solo con puntero fino). Foco: anillo `--accent`. |
| `LinkArrow` | Enlace con subrayado que se dibuja de izquierda a derecha y flecha ↗. |
| `SectionLabel` | `01 — Servicios` en mono, color `--ink-3`. |
| `Chip` | Píldora pequeña (`--accent-soft` + texto `--accent`) para etiquetas de capítulo y tecnologías. |
| `Reveal` | Fade + `y: 24` → 0, 700 ms, se dispara al 85 % del viewport. Una sola vez. |
| `SplitReveal` | Titulares por líneas con máscara (SplitText), stagger 0.06 s. |
| `ImageReveal` | `clip-path: inset(8% round 28px)` → `inset(0)` + escala 1.06 → 1. |
| `Marquee` | Desplazamiento infinito CSS, pausa en hover, duplicado de contenido con `aria-hidden` en la copia. |
| `StatCounter` | Contador animado **solo con datos reales**. Si no hay datos, se omite la sección. |
| `ServiceCard` | Tarjeta con icono de línea, título, descripción y `LinkArrow`. Hover: elevación sutil y borde `--accent`. |
| `ProjectCard` | Imagen 4:3 con `ImageReveal`, etiquetas, título, año. Hover: cursor con etiqueta "Ver". |
| `ProcessTimeline` | Línea vertical que se rellena con el scroll; 5 pasos con número grande en serif cursiva. |
| `FaqAccordion` | Radix Accordion; icono + que rota a ×; contenido animado en altura. |
| `LayersExploded` | Pila de 4 capas en CSS 3D que se separan con el scroll (ver §8.2). |
| `CtaBand` | Banda final: H2 enorme, botón primario y secundario, eco del último frame del hero. |
| `ContactWizard` | Asistente de 6 pasos (ver §8.10 y §9). |
| `HeroStory` | Hero fijado con secuencia en canvas y capítulos (ver §6). |
| `SmoothScrollProvider` | Lenis + ScrollTrigger sincronizados (ver §6.6). |
| `CursorDot` 🔧 | Punto + anillo que sigue al puntero; solo con `(pointer: fine)`. |
| `ScrollProgress` 🔧 | Barra fina de progreso de lectura en artículos. |

### 5.7 Imágenes e iconografía

- Formatos: AVIF/WebP vía `next/image`; `sizes` siempre definido; `priority` solo en la imagen LCP de cada página.
- Capturas de proyectos: en marcos de dispositivo limpios (sin marcas de terceros), sombra `--shadow-float`.
- Iconos de trazo 1,5 px, esquinas redondeadas, tamaño 20/24 px. Sin rellenos.
- Ilustración de apoyo: líneas de boceto a lápiz (coherentes con el hero) en SVG.

---

## 6. Home: la página estrella

**SEO de la home**
- `title`: `{{MARCA}} · Productos digitales a medida para emprendedores y empresas`
- `description` (≤ 155 car.): `Diseñamos y construimos MVPs, software a medida y automatizaciones con IA. De la idea al lanzamiento, con diseño de alto nivel y desarrollo eficiente.`
- Un único `<h1>` en toda la página: el del hero (siempre presente en el DOM, nunca dentro del canvas).

### 6.1 Estructura de la home

| # | Sección | Alto aprox. | Movimiento principal |
|---|---|---|---|
| 0 | Header píldora | fijo | Entra con fade + y desde -16 px |
| 1 | **Hero con storytelling 3D** | 100 svh fijado + 450 % de scroll (móvil 320 %) | Secuencia de frames en canvas controlada por scroll (§6.2–§6.8) |
| 2 | Para quién construimos | ~100 vh | Dos tarjetas grandes con revelado por máscara |
| 3 | Manifiesto | ~100 vh | Texto que se "enciende" palabra a palabra con el scroll |
| 4 | Servicios | ~4 × 80 vh | Tarjetas sticky apiladas |
| 5 | Proyectos | rail horizontal fijado (escritorio) | Scroll vertical → desplazamiento horizontal |
| 6 | Proceso | ~150 vh | Línea de progreso que se rellena + números en serif |
| 7 | Tecnología con criterio | ~60 vh | Marquesina de tecnologías |
| 8 | Prueba social (solo si hay datos reales) | ~80 vh | Contadores y testimonios |
| 9 | Laboratorio | ~80 vh | 3 últimos artículos |
| 10 | FAQ | ~100 vh | Acordeón |
| 11 | Banda CTA + Footer | ~100 vh | Eco del último frame del hero |

### 6.2 El concepto del hero: "Del boceto al producto"

**Idea en una frase:** el usuario hace scroll y ve cómo **un boceto a lápiz se convierte en una aplicación real**, se abre en capas (interfaz, lógica, datos, automatización) y termina como producto lanzado. Es exactamente lo que vendemos, contado sin una sola palabra de más.

**Por qué funciona**
- Metáfora directa del servicio (idea → MVP → producto).
- Fondo blanco real: el objeto flota en un vacío limpio; las sombras dan volumen.
- Storytelling en 4 capítulos con texto HTML real, accesible e indexable.
- Técnica robusta: secuencia de frames en canvas (funciona igual en Chrome, Safari e iOS, a diferencia del scrub de `<video>`).

**Narrativa por capítulos**

| Capítulo | Mensaje | Imagen |
|---|---|---|
| Intro | Qué hacemos | Un lápiz termina de dibujar el wireframe de una app sobre una hoja |
| 01 Idea | Empezamos escuchando | El boceto queda completo con anotaciones a lápiz |
| 02 Diseño | Interfaz clara y validada | Las líneas se pasan a limpio y se rellenan de UI; la pantalla se eleva como una losa |
| 03 Desarrollo | Construcción por capas | La losa se abre en 4 capas de vidrio esmerilado: interfaz, lógica, datos, automatización |
| 04 Lanzamiento | En producción y midiendo | Las capas se reensamblan en un móvil y un portátil que orbitan hasta una composición final de reposo con un punto "live" |

### 6.3 Layout del hero

**Escritorio (≥ 900 px)**
- Sección `100svh` fijada (`pin`) durante `+450%` de scroll.
- Lienzo (canvas) cuadrado centrado: `width: min(78vh, 78vw, 920px)`; frames cuadrados de 1200 × 1200.
- **Zona segura de texto:** en los primeros ~25 frames, el objeto ocupa el tercio inferior del encuadre; el 40 % superior queda libre para el H1 (la producción debe respetarlo, ver §7).
- Los **capítulos** aparecen alternando izquierda/derecha del lienzo (columnas 1–4 / 9–12), con una línea hairline que apunta al objeto.
- **Indicador de progreso** vertical a la derecha: barra fina + 4 marcas con número (`01`–`04`) en mono.
- **Chips flotantes** (UX/UI, Interfaz, Lógica, Datos, Automatización, En producción) anclados a posiciones relativas del lienzo (se calibran con los frames reales).
- Parallax sutil con el puntero (±14 px / ±10 px) solo con `(pointer: fine)`.

**Móvil (< 900 px)**
- Frames **retratos 4:5** (720 × 900) con una cámara propia; `width: min(92vw, calc(70svh * 0.8))`.
- Pin de `+320%`. Capítulos en la parte inferior (sin alternar). Se muestran solo 2 chips por capítulo.
- Sin parallax. Scroll nativo (Lenis no sincroniza el táctil).

### 6.4 Coreografía detallada (escritorio, 150 frames, 1-based)

`p` = progreso de scroll del hero (0–1).

| Fase | `p` | Frames | Qué ocurre en el objeto | Texto en pantalla |
|---|---|---|---|---|
| Intro | 0.00–0.12 | 1–14 | Un lápiz dibuja el wireframe de la app sobre una hoja (grafito, perspectiva 3/4) | H1 + subtítulo + 2 CTAs; el bloque se aparta (`yPercent -18`, `scale .9`, fade) hacia `p 0.11` |
| **01 Idea** (reposo) | 0.12–0.20 | 14–19 | El boceto queda completo; pequeñas anotaciones a lápiz | Capítulo 01 visible (`p 0.04–0.20`) |
| Transición A | 0.20–0.36 | 19–56 | Las líneas se pasan a limpio y se rellenan de UI (ultramar + neutros); la hoja se desvanece; la pantalla se eleva como una losa | Chip **UX / UI** en `p 0.30` |
| **02 Diseño** (reposo) | 0.36–0.43 | 56–61 | Losa completa y nítida, flotando con sombra suave | Capítulo 02 (`p 0.26–0.44`) |
| Transición B | 0.43–0.62 | 61–96 | La losa se divide en 4 capas de vidrio esmerilado; la cámara orbita ≈ 25° | — |
| **03 Desarrollo** (reposo) | 0.62–0.69 | 96–99 | Capas separadas; un borde fino ultramar se ilumina capa a capa | Capítulo 03 (`p 0.50–0.70`); chips Interfaz, Lógica, Datos, Automatización |
| Transición C | 0.69–0.88 | 99–135 | Las capas se reensamblan; aparecen móvil y portátil; órbita lenta de ≈ 90° | — |
| **04 Lanzamiento** (reposo) | 0.88–1.00 | 135–150 | Composición frontal final, flotación mínima, punto "live" pulsando en la pantalla | Capítulo 04 (`p 0.76–0.96`); chip **En producción**; CTA final desde `p 0.90` |

**Textos de los capítulos (copy final)**

- **01 · Idea** — *Todo empieza con una conversación.* "Entendemos el problema antes de dibujar la primera pantalla."
- **02 · Diseño** — *De boceto a interfaz.* "Una experiencia clara, validada con usuarios reales antes de escribir código."
- **03 · Desarrollo** — *Construido por capas.* "Interfaz, lógica, datos y automatizaciones, listos para crecer contigo."
- **04 · Lanzamiento** — *En producción, y seguimos.* "Todo conectado, medido y funcionando. Y no desaparecemos después del lanzamiento."

**Intro (H1 y subtítulo)**
- Eyebrow (mono): `{{MARCA}} — Estudio de producto digital`
- H1: **Convertimos ideas en *productos digitales* a medida.**
- Subtítulo: "Diseñamos y construimos MVPs, software a medida y automatizaciones para emprendedores y empresas que necesitan algo que funcione de verdad."
- Botón primario: **Cuéntanos tu idea** → `/contacto` · Botón secundario: **Cómo trabajamos** → `/proceso`
- Indicio de scroll (mono, abajo): `Desliza para ver cómo`

**CTA final del hero (aparece en `p 0.90`):** "¿Tienes una idea? **Hablemos.**" + botón **Cuéntanos tu idea** + enlace **Ver proyectos**.

### 6.5 Mapeo scroll → frames

El progreso de scroll **no** se mapea linealmente a los frames: se usan claves con *pendientes bajas* en los reposos de cada capítulo (para dar tiempo de lectura) y pendientes altas en las transformaciones. Las claves se expresan como fracción de frames, así sirven igual para 150 frames (escritorio) y 90 (móvil).

Importante: **el vídeo debe producirse siguiendo estas fracciones** (hoja de escenas en §7.3). Si se cambia la producción, se recalibran `FRAME_KEYS` y `CHAPTERS`.

### 6.6 Implementación (código de referencia)

#### a) `lib/gsap.ts` — registro único

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  // Evita recalcular el pin cuando la barra de URL de iOS/Android cambia el viewport
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
```

#### b) `components/providers/smooth-scroll-provider.tsx`

```tsx
'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';

declare global {
  interface Window { __lenis?: Lenis }
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false, // en táctil se usa scroll nativo (más fiable con pin)
    });
    window.__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  // Al cambiar de ruta: volver arriba y recalcular triggers
  useEffect(() => {
    window.__lenis?.scrollTo(0, { immediate: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}
```

Montarlo en `app/(marketing)/layout.tsx` envolviendo `{children}`. Con Lenis activo, el `scrub` del hero en escritorio es `true` (sin segundo suavizado).

#### c) `components/hero/hero.config.ts` — todo lo ajustable en un solo sitio

```ts
export const SEQUENCE_VERSION = 'v1';

export const HERO_SEQUENCE = {
  desktop: {
    base: `/sequence/${SEQUENCE_VERSION}/desktop/f_`,
    ext: 'webp', count: 150, pad: 4,
    maxPx: 1200, pinLength: '+=450%', windowSize: 8, concurrency: 6,
  },
  mobile: {
    base: `/sequence/${SEQUENCE_VERSION}/mobile/f_`,
    ext: 'webp', count: 90, pad: 4,
    maxPx: 720, pinLength: '+=320%', windowSize: 6, concurrency: 4,
  },
} as const;

/**
 * [progresoDeScroll 0..1, fracciónDeFrames 0..1]
 * Pendiente baja = "reposo" (se lee el capítulo). Pendiente alta = transformación.
 */
export const FRAME_KEYS: ReadonlyArray<readonly [number, number]> = [
  [0.00, 0.000],
  [0.12, 0.090], // fin del dibujo a lápiz
  [0.20, 0.120], // reposo 01 · boceto completo
  [0.36, 0.370], // losa de UI formada
  [0.43, 0.400], // reposo 02 · UI completa
  [0.62, 0.640], // capas separadas
  [0.69, 0.660], // reposo 03 · capas
  [0.88, 0.900], // reensamblaje + órbita
  [0.95, 0.985],
  [1.00, 1.000], // composición final
];

export function progressToFrame(p: number, count: number): number {
  const k = FRAME_KEYS;
  let f = k[k.length - 1][1];
  if (p <= k[0][0]) f = k[0][1];
  else {
    for (let i = 1; i < k.length; i++) {
      if (p <= k[i][0]) {
        const [p0, f0] = k[i - 1];
        const [p1, f1] = k[i];
        f = f0 + ((p - p0) / (p1 - p0)) * (f1 - f0);
        break;
      }
    }
  }
  return f * (count - 1);
}

export const CHAPTERS = [
  { id: 'idea',        n: '01', title: 'Idea',        lead: 'Todo empieza con una conversación.', text: 'Entendemos el problema antes de dibujar la primera pantalla.',            from: 0.04, to: 0.20, side: 'left'  },
  { id: 'diseno',      n: '02', title: 'Diseño',      lead: 'De boceto a interfaz.',               text: 'Una experiencia clara, validada con usuarios reales antes de escribir código.', from: 0.26, to: 0.44, side: 'right' },
  { id: 'desarrollo',  n: '03', title: 'Desarrollo',  lead: 'Construido por capas.',               text: 'Interfaz, lógica, datos y automatizaciones, listos para crecer contigo.',  from: 0.50, to: 0.70, side: 'left'  },
  { id: 'lanzamiento', n: '04', title: 'Lanzamiento', lead: 'En producción, y seguimos.',          text: 'Todo conectado, medido y funcionando. Y no desaparecemos tras el lanzamiento.', from: 0.76, to: 0.96, side: 'right' },
] as const;

/** Posiciones (% del lienzo) PROVISIONALES: calibrar con los frames reales. */
export const CHIPS = [
  { id: 'ux',    label: 'UX / UI',         at: 0.30, until: 0.46, x: '8%',  y: '30%' },
  { id: 'front', label: 'Interfaz',        at: 0.52, until: 0.70, x: '2%',  y: '24%' },
  { id: 'logic', label: 'Lógica',          at: 0.54, until: 0.70, x: '88%', y: '40%' },
  { id: 'data',  label: 'Datos',           at: 0.56, until: 0.70, x: '4%',  y: '58%' },
  { id: 'auto',  label: 'Automatización',  at: 0.58, until: 0.70, x: '84%', y: '70%' },
  { id: 'live',  label: 'En producción',   at: 0.90, until: 1.00, x: '68%', y: '22%' },
] as const;
```

#### d) `lib/frame-sequence.ts` — el motor de la secuencia

Reglas de diseño del motor (importan más que el código):
- **Nunca** mantener todos los frames decodificados: `ancho × alto × 4` bytes por frame (un frame de 1200² ≈ 5,8 MB decodificado; 150 frames ≈ 860 MB).
- Se descargan los **blobs comprimidos** (ligeros) y se decodifican solo los frames cercanos al actual (ventana) + unos pocos **anclas** permanentes para saltos rápidos.
- Orden de descarga **progresivo** (0, último, cada 16, 8, 4, 2, 1): el scrub funciona con baja resolución temporal desde el principio.

```ts
export type SequenceConfig = {
  canvas: HTMLCanvasElement;
  count: number;
  urlFor: (index: number) => string; // índice 0-based
  windowSize?: number;               // frames decodificados a cada lado del actual
  keyStride?: number;                // cada N frames se conserva un bitmap ancla
  maxPixelWidth?: number;            // tope de resolución interna del canvas
  onFirstDraw?: () => void;
};

export class FrameSequence {
  private blobs: (Blob | undefined)[];
  private bitmaps = new Map<number, ImageBitmap>();
  private decoding = new Set<number>();
  private ctx: CanvasRenderingContext2D;
  private target = 0;
  private drawn = -1;
  private rafId = 0;
  private destroyed = false;
  private firstDrawDone = false;
  private abort = new AbortController();

  constructor(private cfg: SequenceConfig) {
    this.blobs = new Array(cfg.count).fill(undefined);
    const ctx = cfg.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    this.ctx = ctx;
    this.resize();
  }

  private get win() { return this.cfg.windowSize ?? 8; }

  private isAnchor(i: number) {
    const s = this.cfg.keyStride ?? 30;
    return i % s === 0 || i === this.cfg.count - 1;
  }

  private loadOrder(): number[] {
    const n = this.cfg.count;
    const seen = new Set<number>([0, n - 1]);
    const order = [0, n - 1];
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < n; i += step) {
        if (!seen.has(i)) { seen.add(i); order.push(i); }
      }
    }
    return order;
  }

  /** Descarga progresiva con concurrencia limitada. */
  async preload(concurrency = 6) {
    const queue = this.loadOrder();
    const worker = async () => {
      while (queue.length && !this.destroyed) {
        const i = queue.shift()!;
        try {
          const res = await fetch(this.cfg.urlFor(i), { signal: this.abort.signal });
          if (!res.ok) continue;
          this.blobs[i] = await res.blob();
          if (Math.abs(i - this.target) <= this.win || this.isAnchor(i)) void this.ensureBitmap(i);
        } catch {
          /* red caída o abortado: se ignora, el motor usa el frame más cercano */
        }
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  private async ensureBitmap(i: number) {
    if (this.bitmaps.has(i) || this.decoding.has(i)) return;
    const blob = this.blobs[i];
    if (!blob) return;
    this.decoding.add(i);
    try {
      const bmp = await createImageBitmap(blob);
      if (this.destroyed) { bmp.close(); return; }
      this.bitmaps.set(i, bmp);
    } finally {
      this.decoding.delete(i);
    }
    this.requestDraw();
  }

  private updateWindow() {
    const lo = this.target - this.win;
    const hi = this.target + this.win;
    for (let i = Math.max(0, lo); i <= Math.min(this.cfg.count - 1, hi); i++) void this.ensureBitmap(i);
    for (const [i, bmp] of this.bitmaps) {
      if (!this.isAnchor(i) && (i < lo - 4 || i > hi + 4)) { bmp.close(); this.bitmaps.delete(i); }
    }
  }

  /** Fija el frame objetivo (admite decimales; se redondea). */
  setFrame(frame: number) {
    this.target = Math.min(this.cfg.count - 1, Math.max(0, Math.round(frame)));
    this.updateWindow();
    this.requestDraw();
  }

  private nearest(): number | null {
    if (this.bitmaps.has(this.target)) return this.target;
    for (let d = 1; d < this.cfg.count; d++) {
      if (this.bitmaps.has(this.target - d)) return this.target - d;
      if (this.bitmaps.has(this.target + d)) return this.target + d;
    }
    return null;
  }

  private requestDraw() {
    if (this.rafId || this.destroyed) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      const i = this.nearest();
      if (i === null || i === this.drawn) return;
      const { canvas } = this.cfg;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.drawImage(this.bitmaps.get(i)!, 0, 0, canvas.width, canvas.height);
      this.drawn = i;
      if (!this.firstDrawDone) { this.firstDrawDone = true; this.cfg.onFirstDraw?.(); }
    });
  }

  /** Llamar al cambiar el tamaño del canvas (ResizeObserver). */
  resize() {
    const { canvas, maxPixelWidth } = this.cfg;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth; // layout, no afectado por transform
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const w = Math.round(Math.min(cw * dpr, maxPixelWidth ?? Infinity));
    const h = Math.round(w * (ch / cw));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    this.drawn = -1;
    this.requestDraw();
  }

  destroy() {
    this.destroyed = true;
    this.abort.abort();
    cancelAnimationFrame(this.rafId);
    this.bitmaps.forEach((b) => b.close());
    this.bitmaps.clear();
    this.blobs.fill(undefined);
  }
}
```

#### e) `components/hero/hero-story.tsx` — el componente

```tsx
'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { gsap, useGSAP, SplitText } from '@/lib/gsap';
import { FrameSequence } from '@/lib/frame-sequence';
import { track } from '@/lib/analytics';
import { site } from '@/site.config';
import {
  HERO_SEQUENCE, CHAPTERS, CHIPS, SEQUENCE_VERSION, progressToFrame,
} from './hero.config';

const whenIdle = (fn: () => void) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(fn) : window.setTimeout(fn, 250);

/** Conexión lenta o ahorro de datos → versión estática (misma que reduce-motion). */
function isLiteConnection() {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!c && (c.saveData === true || ['slow-2g', '2g', '3g'].includes(c.effectiveType ?? ''));
}

export function HeroStory() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLPictureElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();

      // ── Versión animada ─────────────────────────────────────────────
      mm.add(
        {
          desktop: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
          mobile: '(max-width: 899px) and (prefers-reduced-motion: no-preference)',
        },
        (ctx) => {
          if (isLiteConnection()) {
            el.dataset.static = 'true';
            return () => { delete el.dataset.static; };
          }

          const isDesktop = !!ctx.conditions?.desktop;
          const cfg = isDesktop ? HERO_SEQUENCE.desktop : HERO_SEQUENCE.mobile;
          const canvas = canvasRef.current!;
          el.dataset.live = 'true';

          // 1) Titular: entrada por líneas con máscara (SplitText)
          const split = SplitText.create('[data-hero-h1]', {
            type: 'lines',
            mask: 'lines',
            autoSplit: true, // re-divide al cargar fuentes o cambiar el ancho
            onSplit: (self) =>
              gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.1 }),
          });

          // 2) Motor de frames
          const seq = new FrameSequence({
            canvas,
            count: cfg.count,
            urlFor: (i) => `${cfg.base}${String(i + 1).padStart(cfg.pad, '0')}.${cfg.ext}`,
            windowSize: cfg.windowSize,
            keyStride: 30,
            maxPixelWidth: cfg.maxPx,
            onFirstDraw: () => {
              canvas.dataset.ready = 'true';
              posterRef.current?.setAttribute('hidden', ''); // el frame 0 del canvas = póster
            },
          });
          seq.setFrame(0);
          whenIdle(() => void seq.preload(cfg.concurrency)); // tras el LCP, sin competir con él

          const ro = new ResizeObserver(() => seq.resize());
          ro.observe(canvas);

          // 3) Línea de tiempo maestra: duración 1 → tiempo = progreso
          let seen = -1;
          const state = { p: 0 };
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: cfg.pinLength,
              pin: true,
              scrub: isDesktop ? true : 0.4,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const idx = CHAPTERS.reduce((acc, c, i) => (self.progress >= c.from ? i : acc), -1);
                if (idx > seen) { seen = idx; track('hero_chapter', { chapter: CHAPTERS[idx].n }); }
              },
            },
          });

          tl.to(state, { p: 1, duration: 1, onUpdate: () => seq.setFrame(progressToFrame(state.p, cfg.count)) }, 0);

          // Titular inicial se aparta; el lienzo crece
          tl.to('[data-hero-intro]', { yPercent: -18, scale: 0.9, autoAlpha: 0, duration: 0.1 }, 0.01);
          tl.to('[data-scroll-cue]', { autoAlpha: 0, duration: 0.03 }, 0);
          tl.fromTo('[data-hero-stage]', { scale: 0.9, yPercent: 6 }, { scale: 1, yPercent: 0, duration: 0.16 }, 0);

          // Capítulos
          CHAPTERS.forEach((c) => {
            const node = `[data-chapter="${c.id}"]`;
            tl.fromTo(node, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: 'power3.out' }, c.from);
            tl.to(node, { autoAlpha: 0, y: -28, duration: 0.04, ease: 'power3.in' }, c.to - 0.04);
            tl.fromTo(`[data-tick="${c.id}"]`, { opacity: 0.25 }, { opacity: 1, duration: 0.03 }, c.from);
            tl.to(`[data-tick="${c.id}"]`, { opacity: 0.25, duration: 0.03 }, c.to - 0.03);
          });

          // Barra de progreso
          tl.fromTo('[data-hero-progress]', { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);

          // Chips ancladas al objeto
          CHIPS.forEach((c) => {
            const node = `[data-chip="${c.id}"]`;
            tl.fromTo(node, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.03, ease: 'expo.out' }, c.at);
            if (c.until < 1) tl.to(node, { autoAlpha: 0, duration: 0.03 }, c.until - 0.03);
          });

          // CTA final
          tl.fromTo('[data-hero-cta]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: 'expo.out' }, 0.9);

          // 4) Parallax con el puntero (solo escritorio y puntero fino)
          let removeParallax = () => {};
          if (isDesktop && window.matchMedia('(pointer: fine)').matches) {
            const qx = gsap.quickTo('[data-parallax]', 'x', { duration: 0.8, ease: 'power3.out' });
            const qy = gsap.quickTo('[data-parallax]', 'y', { duration: 0.8, ease: 'power3.out' });
            const onMove = (e: PointerEvent) => {
              qx((e.clientX / window.innerWidth - 0.5) * 14);
              qy((e.clientY / window.innerHeight - 0.5) * 10);
            };
            window.addEventListener('pointermove', onMove, { passive: true });
            removeParallax = () => window.removeEventListener('pointermove', onMove);
          }

          return () => {
            removeParallax();
            ro.disconnect();
            split.revert();
            seq.destroy();
            delete el.dataset.live;
          };
        },
      );

      // ── Versión estática (reduce-motion) ────────────────────────────
      mm.add('(prefers-reduced-motion: reduce)', () => {
        el.dataset.static = 'true';
        return () => { delete el.dataset.static; };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const v = SEQUENCE_VERSION;

  return (
    <section ref={root} className="hero" aria-label="Introducción">
      {/* TEXTO REAL (siempre en el DOM: SEO y accesibilidad) */}
      <div data-hero-intro className="hero__intro">
        <p className="label">{site.name} — Estudio de producto digital</p>
        <h1 data-hero-h1 className="display-xl">
          Convertimos ideas en <em className="font-serif italic text-accent">productos digitales</em> a medida.
        </h1>
        <p className="body-l hero__sub">
          Diseñamos y construimos MVPs, software a medida y automatizaciones para emprendedores y empresas que necesitan algo que funcione de verdad.
        </p>
        <div className="hero__actions">
          <Link href="/contacto" className="btn btn--primary">Cuéntanos tu idea</Link>
          <Link href="/proceso" className="btn btn--secondary">Cómo trabajamos</Link>
        </div>
      </div>

      {/* ESCENA */}
      <div data-hero-stage className="hero__stage">
        <div data-parallax className="hero__box">
          {/* Póster = frame 1 (es el elemento LCP). Debe precargarse en <head>, ver nota */}
          <picture ref={posterRef}>
            <source media="(max-width: 899px)" srcSet={`/sequence/${v}/poster-first-mobile.webp`} />
            <img
              src={`/sequence/${v}/poster-first.webp`}
              alt=""
              width={1200}
              height={1200}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Animación: un boceto a lápiz se transforma en una aplicación, se abre en capas de interfaz, lógica, datos y automatización, y termina como producto lanzado."
          />
          {CHIPS.map((c) => (
            <span key={c.id} data-chip={c.id} className="chip hero__chip" style={{ left: c.x, top: c.y }}>
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* CAPÍTULOS */}
      {CHAPTERS.map((c) => (
        <article key={c.id} data-chapter={c.id} data-side={c.side} className="hero__chapter">
          <p className="label">{c.n} — {c.title}</p>
          <h2 className="h3"><em className="font-serif italic">{c.lead}</em></h2>
          <p className="text-ink-2">{c.text}</p>
        </article>
      ))}

      {/* PROGRESO */}
      <div className="hero__progress" aria-hidden="true">
        <span data-hero-progress className="hero__progress-bar" />
        {CHAPTERS.map((c) => (
          <span key={c.id} data-tick={c.id} className="label hero__tick">{c.n}</span>
        ))}
      </div>

      {/* CTA FINAL + INDICIO DE SCROLL */}
      <div data-hero-cta className="hero__cta">
        <p className="h3">¿Tienes una idea? <em className="font-serif italic text-accent">Hablemos.</em></p>
        <div className="hero__actions">
          <Link href="/contacto" className="btn btn--primary">Cuéntanos tu idea</Link>
          <Link href="/proyectos" className="btn btn--ghost">Ver proyectos</Link>
        </div>
      </div>
      <p data-scroll-cue className="label hero__cue" aria-hidden="true">Desliza para ver cómo</p>

      {/* Sin JS: mostrar capítulos y composición final */}
      <noscript>
        <style>{`.hero__chapter,.hero__cta{opacity:1!important;visibility:visible!important}`}</style>
      </noscript>
    </section>
  );
}
```

**Precarga del póster (LCP)** — en `app/layout.tsx` (dentro de `<head>`):

```tsx
<link rel="preload" as="image" href="/sequence/v1/poster-first.webp" media="(min-width: 900px)" fetchPriority="high" />
<link rel="preload" as="image" href="/sequence/v1/poster-first-mobile.webp" media="(max-width: 899px)" fetchPriority="high" />
```

El poster tiene que ser **idéntico al frame 1** (mismo render) para que el cambio póster → canvas sea imperceptible.

#### f) CSS del hero (`components/hero/hero.css`, importado desde `globals.css`)

```css
.hero { position: relative; height: 100svh; overflow: clip; background: var(--paper); }

/* Texto de apertura */
.hero__intro { position: absolute; inset-inline: 0; top: clamp(5.5rem, 14vh, 9rem); z-index: 3;
  display: grid; justify-items: center; gap: 1.25rem; text-align: center; padding-inline: var(--gutter); }
.hero__intro h1 { max-width: 16ch; }
.hero__sub { max-width: 46ch; color: var(--ink-2); }
.hero__actions { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: center; }

/* Escena */
.hero__stage { position: absolute; inset: 0; display: grid; place-items: center; transform-origin: 50% 60%; will-change: transform; }
.hero__box { position: relative; width: min(78vh, 78vw, 920px); aspect-ratio: 1 / 1; }
.hero__box canvas, .hero__box picture, .hero__box img { position: absolute; inset: 0; width: 100%; height: 100%; }
.hero__box picture, .hero__box canvas { mix-blend-mode: multiply; } /* disuelve un blanco casi puro en el fondo */
.hero__box canvas { opacity: 0; }
.hero__box canvas[data-ready="true"] { opacity: 1; }
.hero__chip { position: absolute; transform: translate(-50%, -50%); opacity: 0; box-shadow: var(--shadow-card); background: #fff; }

/* Capítulos */
.hero__chapter { position: absolute; top: 50%; translate: 0 -50%; max-width: 22rem; z-index: 3; opacity: 0; visibility: hidden; display: grid; gap: .5rem; }
.hero__chapter[data-side="left"]  { left:  max(var(--gutter), calc((100vw - 1280px) / 2)); }
.hero__chapter[data-side="right"] { right: max(var(--gutter), calc((100vw - 1280px) / 2)); text-align: right; }

/* Progreso */
.hero__progress { position: absolute; right: var(--gutter); top: 50%; translate: 0 -50%; height: 40vh; width: 2px; background: var(--line); }
.hero__progress-bar { position: absolute; inset: 0; background: var(--ink); transform-origin: top; transform: scaleY(0); }
.hero__tick { position: absolute; right: 14px; opacity: .25; }
.hero__tick:nth-of-type(2) { top: 0; } .hero__tick:nth-of-type(3) { top: 33%; }
.hero__tick:nth-of-type(4) { top: 66%; } .hero__tick:nth-of-type(5) { top: 100%; }

/* CTA y cue */
.hero__cta { position: absolute; inset-inline: 0; bottom: 8svh; z-index: 4; display: grid; justify-items: center; gap: 1rem; text-align: center; opacity: 0; visibility: hidden; }
.hero__cue { position: absolute; bottom: 3svh; inset-inline: 0; text-align: center; color: var(--ink-3); }

/* Móvil */
@media (max-width: 899px) {
  .hero__box { width: min(92vw, calc(70svh * 0.8)); aspect-ratio: 4 / 5; }
  .hero__chapter { top: auto; bottom: 8svh; translate: 0 0; left: var(--gutter) !important; right: var(--gutter) !important; max-width: none; text-align: left !important; }
  .hero__progress { display: none; }
}

/* Versión estática (reduce-motion o conexión lenta): composición final + capítulos apilados */
.hero[data-static="true"] { height: auto; padding-block: var(--section-y); }
.hero[data-static="true"] > * { position: static; }
.hero[data-static="true"] .hero__stage { display: grid; margin-block: 3rem; }
.hero[data-static="true"] .hero__chapter,
.hero[data-static="true"] .hero__cta { opacity: 1; visibility: visible; translate: none; max-width: 40rem; margin: 2rem auto; text-align: left; }
.hero[data-static="true"] .hero__progress,
.hero[data-static="true"] .hero__cue,
.hero[data-static="true"] .hero__chip { display: none; }
```

> En la versión estática el póster debe mostrar la **composición final** (`poster-last.webp`). Cambia el `src`/`srcSet` del `<picture>` en la rama `data-static` o sirve un segundo `<picture>` oculto con `loading="lazy"` y muéstralo con CSS cuando `data-static="true"`.

### 6.7 Estados alternativos (todos obligatorios)

| Estado | Comportamiento |
|---|---|
| **Carga inicial** | H1 + póster (frame 1) visibles sin esperar a JS pesado; la secuencia se descarga tras el LCP en segundo plano. Sin pantalla de carga bloqueante. |
| **Scroll antes de que carguen todos los frames** | Se dibuja el frame disponible más cercano (descarga progresiva); nunca se muestra un hueco. |
| **Sin JavaScript** | Póster + H1 + capítulos y CTA visibles (bloque `noscript`). |
| **`prefers-reduced-motion`** | Hero estático (no se crea ScrollTrigger ni Lenis): composición final + capítulos apilados. |
| **Conexión lenta / ahorro de datos** | Misma versión estática (no se descargan los frames). |
| **Móvil** | Frames retratos propios, menos frames, pin más corto, scroll nativo. |
| **Cambio de orientación / resize** | `ResizeObserver` reajusta el canvas; `ScrollTrigger` recalcula (`invalidateOnRefresh`). |
| **Volver con el botón Atrás** | El scroll se restaura; el hero debe reanudarse en el frame correcto (probar). |
| **Pestaña en segundo plano** | La sincronización se pausa sola (rAF); al volver no hay saltos. |

### 6.8 Afinado (checklist de calibración con el material real)

1. Reproducir la timeline con los frames reales y **ajustar `FRAME_KEYS`** para que los reposos coincidan con las poses de cada capítulo.
2. **Calibrar `CHIPS` (x, y)** sobre el objeto real en cada capítulo (escritorio y móvil por separado).
3. Verificar que ningún texto de capítulo **tapa el objeto** en 1280×720, 1440×900, 1920×1080, 2560×1440, 390×844, 360×640 y móvil apaisado.
4. Probar scroll **lento, rápido y por teclado** (barra espaciadora, PgDn, flechas, Home/End).
5. Probar con **CPU ×6 más lenta** (DevTools) y un móvil Android de gama media real.
6. Comprobar el pin en **iOS Safari** (barra de URL que sube y baja).
7. Medir memoria en el administrador de tareas del navegador: objetivo < 300 MB en escritorio y < 150 MB en móvil durante todo el recorrido.
8. Confirmar que el último frame se conecta **visualmente** con la sección siguiente (transición sin salto de color blanco).

### 6.9 Resto de secciones de la home (copy y movimiento)

#### Sección 2 · Para quién construimos
- **H2:** "Para quien *tiene una idea* y para quien tiene un *negocio* que mover."
- **Tarjeta 1 — Emprendedores:** "Validamos tu idea y construimos el MVP que necesitas para salir al mercado." → `/emprendedores`
- **Tarjeta 2 — Empresas:** "Software, herramientas internas y automatizaciones que encajan con cómo trabaja tu equipo." → `/empresas`
- **Movimiento:** `ImageReveal` por tarjeta, ilustración de línea que se dibuja (stroke-dashoffset) al entrar.

#### Sección 3 · Manifiesto
- **Texto (display-l):** "No vendemos horas de desarrollo. Construimos productos digitales que funcionan el día del lanzamiento, y siguen funcionando después."
- **Movimiento:** SplitText por palabras; `opacity` de 0.15 → 1 con `scrub`:

```ts
const split = SplitText.create('[data-manifesto]', { type: 'words' });
gsap.fromTo(split.words, { opacity: 0.15 }, {
  opacity: 1, stagger: 0.05, ease: 'none',
  scrollTrigger: { trigger: '[data-manifesto]', start: 'top 75%', end: 'bottom 55%', scrub: true },
});
```

#### Sección 4 · Servicios (`01 — Servicios`)
- **H2:** "Todo lo que hace falta para *lanzar* un producto."
- **Tarjetas** (contenido en `content/services.ts`, textos completos en §8.2–§8.5):
  1. **MVP para emprendedores** — "De la idea a un producto real en semanas. Validamos lo esencial y construimos lo mínimo que importa."
  2. **Software a medida** — "Portales, paneles y herramientas internas que encajan con tu forma de trabajar, no al revés."
  3. **Automatización e IA** — "Flujos que eliminan trabajo manual: integraciones, agentes y procesos conectados entre tus herramientas."
  4. **Productos creativos e interactivos** — "Experiencias web y herramientas con identidad propia, donde el diseño es parte del producto."
- **Movimiento (escritorio):** tarjetas `position: sticky` con `top: calc(96px + var(--i) * 24px)`; al apilarse, la anterior baja a `scale .96` y `opacity .85` con `scrub`. **Móvil:** lista vertical normal.

#### Sección 5 · Proyectos (`02 — Proyectos`)
- **H2:** "Producto real, *resultados* reales."
- 4–6 `ProjectCard` + enlace "Ver todos los proyectos".
- **Movimiento (escritorio):** rail horizontal fijado; **móvil:** `overflow-x: auto` con `scroll-snap-type: x mandatory`.

```ts
const rail = document.querySelector<HTMLElement>('[data-rail]')!;
const dist = () => rail.scrollWidth - window.innerWidth + 2 * 32;
gsap.to(rail, {
  x: () => -dist(), ease: 'none',
  scrollTrigger: { trigger: '[data-rail-wrap]', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: true, invalidateOnRefresh: true },
});
```

#### Sección 6 · Proceso (`03 — Proceso`)
- **H2:** "Un camino *claro*, de la primera llamada al lanzamiento."
- **Pasos** (5; números grandes en serif cursiva):
  1. **Hablamos** — "Una llamada de 15–30 minutos para entender tu idea, tu contexto y qué significa éxito para ti."
  2. **Propuesta clara** — "Alcance, entregables, plazos y presupuesto por escrito. Sin letra pequeña." ⚠️
  3. **Diseño y prototipo** — "Flujos, interfaz y un prototipo navegable que validas antes de escribir código."
  4. **Desarrollo por sprints** — "Entregas cortas y visibles cada una o dos semanas. Ves avances reales y ajustamos el rumbo." ⚠️
  5. **Lanzamiento y evolución** — "Publicamos, medimos y seguimos mejorando contigo con mantenimiento y nuevas versiones."
- **Movimiento:** línea vertical con `scaleY` ligada al scroll; cada paso se ilumina al cruzar el 55 % del viewport.

#### Sección 7 · Tecnología con criterio (`04 — Tecnología`)
- **H2:** "Herramientas elegidas por *criterio*, no por moda."
- **Texto:** "Usamos la tecnología que mejor encaja con tu producto: código a medida cuando hace falta, plataformas no-code o low-code cuando aceleran sin atarte."
- **Marquesina (editable según el stack real):** Next.js · React · TypeScript · Supabase · PostgreSQL · Webflow · n8n · Make · Power Automate · Vercel — en monocromo `--ink-3`.

#### Sección 8 · Prueba social (solo con datos reales)
- Testimonios reales (cita, nombre, cargo, empresa, foto con permiso) y/o `StatCounter` con cifras verificables.
- **Si no hay datos reales todavía, la sección se omite.** Nunca placeholders con números inventados.

#### Sección 9 · Laboratorio (`05 — Laboratorio`)
- **H2:** "Lo que *probamos* y aprendemos."
- **Texto:** "Experimentos, demos y notas técnicas de lo que construimos."
- 3 últimas entradas del blog (imagen, etiqueta, título, fecha, tiempo de lectura).

#### Sección 10 · FAQ (`06 — Preguntas`)
- **H2:** "Antes de escribirnos, *quizá* te ayude esto."
- Contenido en `content/faq.ts` (8 preguntas, ver §8.11). Con JSON-LD `FAQPage`.

#### Sección 11 · Banda CTA + Footer
- **H2 enorme:** "Cuéntanos qué quieres *construir*."
- **Botones:** **Cuéntanos tu idea** (primario) · **Agenda una llamada de 15 min** (secundario).
- **Eco visual:** el último frame del hero (`poster-last.webp`) a tamaño medio con `ImageReveal`, para cerrar el círculo narrativo.

---

## 7. Producción de los assets del hero

El hero vale lo que valga su material. Esta sección define **qué producir, cómo y con qué especificaciones** para que el código de §6 funcione a la primera.

### 7.1 Estrategia: tres rutas

| Ruta | Qué es | Ventajas | Inconvenientes | Recomendación |
|---|---|---|---|---|
| **A · 3D en Blender** | Todo el vídeo se renderiza desde una escena 3D propia | Control total, fondo blanco exacto, sombras perfectas, repetible | Requiere modelar y animar; más tiempo | Ideal si hay un/a 3D artist |
| **B · Vídeo con IA** | Clips generados con herramientas de vídeo por IA y postproducidos | Muy rápido y visualmente rico | Inconsistencia entre clips, geometría que "se derrite", sin control fino, términos de uso | Solo como apoyo o prototipo |
| **C · Híbrida (recomendada)** | Blender para dispositivos, capas, cámara y sombras; UI diseñada en Figma; boceto a lápiz con Grease Pencil o After Effects; IA solo para explorar ideas/keyframes | Calidad consistente + velocidad razonable | Requiere coordinar 3 disciplinas | **Ruta por defecto** |

### 7.2 Especificaciones técnicas del material (obligatorias)

| Parámetro | Escritorio | Móvil |
|---|---|---|
| Relación de aspecto | 1:1 | 4:5 (retrato) |
| Resolución de render (maestro) | 2400 × 2400 | 1440 × 1800 |
| Resolución final de los frames | **1200 × 1200** | **720 × 900** |
| Nº de frames | **150** | **90** (submuestreados de un render de 150 con cámara retrato) |
| Formato final | WebP (calidad ≈ 70–72) | WebP (calidad ≈ 70) |
| Peso objetivo | ≤ 60 KB/frame · ≤ 7 MB total | ≤ 35 KB/frame · ≤ 2,5 MB total |
| Fondo | **`#FFFFFF` exacto** en todo el borde del encuadre | igual |

Reglas de imagen:

1. **Fondo blanco puro**: en las 8 muestras de borde (esquinas y puntos medios) de cada frame, los valores RGB deben ser ≥ 252 tras la compresión (se verifica con `check-white.mjs`, §7.7). El objeto **nunca toca el borde**: margen de seguridad ≥ 8 % por lado.
2. **Zona segura de texto:** en los frames 1–25 (escritorio) el 40 % superior del encuadre debe estar **vacío** (ahí va el H1). El boceto ocupa el tercio inferior y asciende hacia el centro durante la transición.
3. **Cámara continua**: sin cortes ni zooms bruscos. Movimiento suave con interpolación Bézier; orbitas máximas de ≈ 90 °.
4. **Iluminación de estudio**: softbox grande arriba-izquierda, relleno suave, sombras de radio amplio. **Sin suelo visible** ni reflejos: el objeto flota en un vacío blanco, con sombra de contacto muy suave.
5. **Paleta limitada**: blancos, grises cálidos, negro tinta (`#0B0B0F`), ultramar (`#2B3BFF`). El naranja `#FF5A1F` solo en el punto "live" final.
6. **Sin texto legible ni logos de terceros** en pantallas. UI **abstracta** (bloques, líneas, gráficos, nodos). Así no envejece, no hay problemas de propiedad intelectual y no se rompe con la compresión.
7. **Dispositivos genéricos**: rectángulos redondeados sin marcas (no replicar el diseño reconocible de un fabricante).
8. **Frame 1 y frame final** se usan como pósters (`poster-first`, `poster-last`) y el último, además, para OG image y banda CTA final: deben ser **composiciones bellas por sí mismas**.

### 7.3 Hoja de escenas (la "partitura" del hero)

La producción debe respetar estos **rangos de frames** (coinciden con `FRAME_KEYS` y `CHAPTERS` de §6). Los frames móviles usan las mismas fracciones.

| Escena | Frames escritorio (de 150) | Frames móvil (de 90) | Qué debe verse | Notas de cámara y luz |
|---|---|---|---|---|
| **S1 · Dibujo** | 1–14 | 1–9 | Un lápiz dibuja el wireframe de una app (cajas, líneas, un gráfico, un botón) sobre una hoja blanca | Plano 3/4 cenital, fijo; objeto en el tercio inferior |
| **S2 · Boceto completo** (reposo 01) | 14–19 | 9–11 | Boceto terminado, con flechas y anotaciones abstractas a lápiz | Casi estático; leve respiración de luz |
| **S3 · Boceto → UI** | 19–56 | 11–34 | Las líneas se pasan a limpio (tinta) y se rellenan de UI ultramar + neutros; la hoja se desvanece; la pantalla se eleva como losa fina | Cámara sube y se centra; sombra aparece bajo la losa |
| **S4 · Losa completa** (reposo 02) | 56–61 | 34–37 | UI nítida y completa, flotando, con micro-detalles (tarjetas, gráfico, botón primario) | Plano casi frontal con ligera inclinación |
| **S5 · Apertura en capas** | 61–96 | 37–58 | La losa se divide en 4 capas de vidrio esmerilado separadas en vertical | Cámara orbita ≈ 25 ° hacia vista isométrica |
| **S6 · Capas separadas** (reposo 03) | 96–99 | 58–60 | Capas: **Interfaz** (UI), **Lógica** (líneas de código abstractas), **Datos** (bloques/tabla), **Automatización** (nodos conectados); borde ultramar fino iluminado | Isométrica estable |
| **S7 · Reensamblaje** | 99–135 | 60–81 | Las capas se recomponen; emergen un móvil y un portátil genéricos mostrando la UI; órbita lenta ≈ 90 ° | Movimiento fluido, sin saltos |
| **S8 · Composición final** (reposo 04) | 135–150 | 81–90 | Móvil + portátil frontales, flotación mínima; punto "live" naranja pulsando en la pantalla | Plano frontal elegante, el más "fotografiable" |

> **Cada reposo debe ser una pose limpia y legible** (el usuario se detiene ahí a leer el capítulo). Las transiciones pueden ser dinámicas porque el usuario las recorre rápido.

### 7.4 Ruta A/C · Blender paso a paso

*(Los nombres de menús pueden variar según la versión de Blender; los conceptos son estables.)*

**1. Escena y unidades.** Unidades métricas. Crear:
- Hoja (plano ≈ 0,21 × 0,297 m) con un leve relieve de papel (bump muy sutil).
- Losa de UI (rectángulo redondeado, grosor 4–6 mm).
- 4 capas de vidrio (rectángulos redondeados, grosor 3–4 mm) con el mismo tamaño que la losa.
- Móvil y portátil **genéricos**: carcasa con bisel fino, pantalla plana, aluminio satinado. Sin marcas.
- **Shadow catcher:** un plano grande bajo el objeto con *Object → Visibility → Shadow Catcher* activado (Cycles). Recibe solo la sombra.

**2. Materiales.**
- Vidrio esmerilado: Principled BSDF con *Transmission* = 1, *Roughness* ≈ 0,3–0,4, *IOR* ≈ 1,45.
- Aluminio: *Metallic* alto, *Roughness* ≈ 0,3.
- Pantallas: texturas de imagen (los 3 estados de la UI, §7.6) mezcladas con un *Mix Shader* cuyo factor se anima por keyframes (wireframe → UI final).
- Líneas del boceto: **Grease Pencil** con modificador *Build* (se dibuja en el tiempo) o textura de líneas con máscara animada.

**3. Luz.**
- Un *Area Light* grande (≈ 3 × 3 m) arriba-izquierda como key + un relleno suave opuesto.
- *World:* color `#FFFFFF`, intensidad ≈ 0,8–1.

**4. Cámara.** Lente 50–70 mm, perspectiva suave. Keyframes con interpolación Bézier suavizada: encuadre inicial bajo (zona segura de texto) → centrado → órbita → frontal final. **Segunda cámara retrato 4:5** con el mismo recorrido, reencuadrada.

**5. Ajustes de render (Cycles).**
- *Film → Transparent* **activado** (las sombras del shadow catcher quedan como alfa semitransparente).
- Muestras 128–256 con denoise (OpenImageDenoise).
- *Color Management → View Transform:* **Standard** (evita que los tonemappers cambien el blanco); *Look:* None.
- Resolución maestra: 2400 × 2400 (escritorio) · 1440 × 1800 (móvil), 100 %.
- Salida: **PNG RGBA 8-bit**, rango de frames 1–150, ruta `assets/frames_src/desktop/####.png` (y `.../mobile/####.png` con la cámara retrato; **150 frames también para móvil**, se submuestrean a 90 en el script).

**6. Del PNG con alfa al blanco puro.** El script `build-sequence.mjs` (§7.7) aplica `flatten({ background: '#ffffff' })`: las sombras semitransparentes se componen sobre blanco exacto.

**7. Render.** Con GPU, 150 frames × 2 cámaras. Considerar un servicio de render si el tiempo es crítico.

### 7.5 Ruta B · Vídeo con IA (apoyo o prototipo)

**Proceso recomendado**
1. **Keyframes primero:** generar imágenes fijas de cada pose clave (boceto, losa, capas, composición final) con un estilo coherente (referencia de estilo/seed).
2. **Transiciones:** generar cada tramo entre keyframes con un modelo de imagen-a-vídeo que admita fotograma inicial y final.
3. **Estabilizar y retimear:** unificar velocidad (optical flow), estabilizar cámara, eliminar parpadeos.
4. **Blanco puro:** corregir con curvas/niveles hasta que el fondo sea `#FFFFFF`; eliminar marcas de agua según la licencia.
5. **Escalar y limpiar:** reescalar a 2400 px y reducir ruido ligeramente.
6. **Exportar** a secuencia PNG y respetar la hoja de escenas (§7.3).

**Prompts base** (en inglés; adaptarlos a cada herramienta y a su guía de prompts):

- **S1/S2 · Dibujo:** `Slow three-quarter top-down view of a clean white paper sheet on a pure white seamless surface. A graphite pencil draws a rough wireframe of a mobile app screen: boxes, lines, a chart placeholder, a button. Soft studio light, minimal, static camera, no text, no letters, no logos, no hands, pure white background #FFFFFF.`
- **S3/S4 · Boceto → UI:** `The pencil wireframe cleans up into precise ink lines and fills with a modern abstract mobile app interface in ultramarine blue #2B3BFF and soft grays. The paper fades away and the screen lifts into a thin floating slab with a soft shadow beneath. Pure white seamless background, premium product render look, no readable text, no logos.`
- **S5/S6 · Capas:** `A thin floating app screen slab separates into four frosted glass layers stacked with generous spacing, exploded isometric view, each layer with a thin ultramarine edge light. Abstract UI blocks, code lines, data blocks and a node graph on the layers. Slow 25-degree camera orbit, soft shadows, pure white background, no text.`
- **S7/S8 · Ensamblaje final:** `The four glass layers slide back together and become a generic smartphone and a generic laptop floating in space, slow orbit, ending on a clean front-facing composition with a soft contact shadow, pure white seamless studio, premium minimal product render, no brand logos.`
- **Negativo (si la herramienta lo admite):** `text, watermark, logo, hands, people, gradient background, color cast, floor reflections, noise, flicker, deformed geometry`.

**Riesgos de la IA y mitigación**

| Riesgo | Mitigación |
|---|---|
| Geometría inconsistente entre clips | Usar keyframes fijos y generar tramos cortos; reparar a mano |
| Texto basura en pantallas | UI **abstracta** (sin texto) o sustituir la pantalla en postproducción |
| Fondo no blanco / viñeteado | Niveles/curvas + comprobación con `check-white.mjs`; `mix-blend-mode: multiply` como red de seguridad |
| Términos de uso / marca de agua | ⚠️ Confirmar licencia comercial del plan elegido antes de publicar |
| Falta de repetibilidad | Para la versión final, preferir Blender en las escenas S5–S8 |

### 7.6 Las pantallas (UI) — diseño en Figma

Diseñar con el **mismo sistema visual de la web** (§5) **tres estados** de la UI del producto, abstractos y sin texto legible:

1. **Wireframe:** líneas y cajas en grafito (para S1/S2).
2. **UI final:** tarjetas, gráfico de línea/barras, lista, botón primario ultramar, cabecera (para S3/S4 y para las pantallas de S7/S8).
3. **Capas:** cuatro láminas independientes — *Interfaz* (UI), *Lógica* (líneas de código estilizadas), *Datos* (tabla/bloques apilados), *Automatización* (grafo de nodos) — para S5/S6.

Exportar cada estado como PNG a 2048 px (o como secuencia si se anima en After Effects/Rive). **Variante móvil** del estado 2 en formato vertical.

### 7.7 Postproducción y empaquetado

**Estructura de trabajo**

```
assets/
├─ frames_src/
│  ├─ desktop/0001.png … 0150.png     # render maestro 2400², RGBA
│  └─ mobile/0001.png … 0150.png      # render retrato 1440×1800, RGBA
├─ figma-exports/
└─ blender/hero.blend
```

**`scripts/build-sequence.mjs`** — convierte los PNG en WebP optimizados, submuestrea el móvil a 90 y genera los pósters (idénticos al primer/último frame):

```js
// uso: node scripts/build-sequence.mjs
import sharp from 'sharp';
import { readdir, mkdir, rm, copyFile } from 'node:fs/promises';
import path from 'node:path';

const VERSION = 'v1';
const BASE = `public/sequence/${VERSION}`;

const targets = [
  { name: 'desktop', src: 'assets/frames_src/desktop', out: `${BASE}/desktop`, width: 1200, height: 1200, count: 150, quality: 72 },
  { name: 'mobile',  src: 'assets/frames_src/mobile',  out: `${BASE}/mobile`,  width: 720,  height: 900,  count: 90,  quality: 70 },
];

for (const t of targets) {
  const files = (await readdir(t.src)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  if (!files.length) throw new Error(`Sin frames en ${t.src}`);

  await rm(t.out, { recursive: true, force: true });
  await mkdir(t.out, { recursive: true });

  for (let i = 0; i < t.count; i++) {
    // Submuestreo: toma el frame de origen más cercano a la fracción i/(count-1)
    const srcIndex = Math.round((i * (files.length - 1)) / (t.count - 1));
    const name = `f_${String(i + 1).padStart(4, '0')}.webp`;
    await sharp(path.join(t.src, files[srcIndex]))
      .flatten({ background: '#ffffff' })           // sombras con alfa → sobre blanco puro
      .resize(t.width, t.height, { fit: 'cover' })
      .webp({ quality: t.quality, effort: 6, smartSubsample: true })
      .toFile(path.join(t.out, name));
  }
  console.log(`${t.name}: ${t.count} frames → ${t.out}`);
}

// Pósters = copias exactas de frames (cambio póster → canvas imperceptible)
await copyFile(`${BASE}/desktop/f_0001.webp`, `${BASE}/poster-first.webp`);
await copyFile(`${BASE}/mobile/f_0001.webp`,  `${BASE}/poster-first-mobile.webp`);
await copyFile(`${BASE}/desktop/f_0150.webp`, `${BASE}/poster-last.webp`);
console.log('Pósters generados.');
```

**`scripts/check-white.mjs`** — falla si algún borde no es blanco puro:

```js
// uso: node scripts/check-white.mjs public/sequence/v1/desktop
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('Uso: node scripts/check-white.mjs <carpeta>');

const MIN = 252; // tolerancia por compresión con pérdida
let bad = 0;

for (const f of (await readdir(dir)).filter((x) => x.endsWith('.webp')).sort()) {
  const { data, info } = await sharp(path.join(dir, f)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const px = (x, y) => [0, 1, 2].map((k) => data[(y * w + x) * c + k]);
  const points = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
    [w >> 1, 0], [w >> 1, h - 1], [0, h >> 1], [w - 1, h >> 1],
  ];
  const worst = Math.min(...points.flatMap(([x, y]) => px(x, y)));
  if (worst < MIN) { console.log(`✗ ${f}: valor mínimo ${worst}`); bad++; }
}

console.log(bad ? `${bad} frames fuera de tolerancia` : 'OK: todos los bordes son blanco puro (±3)');
process.exit(bad ? 1 : 0);
```

**`package.json` (scripts)**

```json
{
  "scripts": {
    "sequence:build": "node scripts/build-sequence.mjs",
    "sequence:check": "node scripts/check-white.mjs public/sequence/v1/desktop && node scripts/check-white.mjs public/sequence/v1/mobile"
  }
}
```

**Si se parte de un vídeo (ruta B)** — extraer a PNG antes del script:

```bash
mkdir -p assets/frames_src/desktop
ffmpeg -i hero_desktop.mp4 -vf "fps=25,scale=2400:2400:flags=lanczos" -frames:v 150 assets/frames_src/desktop/%04d.png
```

Ajustar `fps` para obtener ≥ 150 frames de la duración total (el script submuestrea el exceso). Para quitar un fondo casi blanco con luminosidad, retocar con niveles antes de exportar.

**Caché inmutable** — `next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/sequence/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
```

Para publicar una nueva versión del material: cambiar `SEQUENCE_VERSION` a `v2` (y la carpeta), nunca sobrescribir `v1`.

### 7.8 🔧 Fase 2 · 3D en tiempo real (React Three Fiber)

Cuándo: cuando se quiera interacción real (arrastrar/rotar), poder **cambiar las pantallas por las de cada proyecto**, o sustituir el capítulo 03 por un modelo vivo. Aumenta el coste de desarrollo y de rendimiento; la secuencia de frames sigue siendo el **fallback** para móviles modestos.

- **Modelo:** exportar desde Blender a **GLB**, con compresión Draco o meshopt, **< 2 MB**. Nombrar los objetos (`layer_ui`, `layer_logic`, `layer_data`, `layer_auto`, `phone`, `laptop`).
- **Escena:** `<Canvas dpr={[1, 2]}>`, `<Environment preset="studio" />` (o un HDRI pequeño), `<ContactShadows>` para las sombras sobre blanco, fondo transparente.
- **Sincronía con el scroll:** ScrollTrigger actualiza un `ref` con el progreso; `useFrame` lo lee. No usar estado de React por frame.
- **Carga diferida:** `next/dynamic` con `ssr: false`, `Suspense` y detección de GPU (`detect-gpu`) para decidir entre 3D real y secuencia.

```tsx
'use client';

import { useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, useGLTF } from '@react-three/drei';
import type { Group } from 'three';

function Product({ progress }: { progress: MutableRefObject<number> }) {
  const { scene } = useGLTF('/models/product.glb');
  const group = useRef<Group>(null);

  useFrame(() => {
    const p = progress.current;
    if (!group.current) return;
    group.current.rotation.y = p * Math.PI * 1.5;
    // Capas: separar en Y según p
    ['layer_ui', 'layer_logic', 'layer_data', 'layer_auto'].forEach((name, i) => {
      const layer = scene.getObjectByName(name);
      if (layer) layer.position.y = Math.sin(Math.min(p / 0.7, 1) * Math.PI * 0.5) * i * 0.35;
    });
  });

  return <primitive ref={group} object={scene} />;
}

export function Hero3D({ progress }: { progress: MutableRefObject<number> }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 1.2, 4], fov: 35 }} gl={{ alpha: true }}>
      <ambientLight intensity={0.6} />
      <Environment preset="studio" />
      <Product progress={progress} />
      <ContactShadows position={[0, -1, 0]} opacity={0.35} blur={2.8} far={4} />
    </Canvas>
  );
}
```

### 7.9 Checklist de aceptación del material

- [ ] 150 frames escritorio + 150 frames móvil (render) y se generan 90 móviles finales.
- [ ] `npm run sequence:check` pasa en ambas carpetas.
- [ ] El objeto no toca el borde (margen ≥ 8 %) en ningún frame.
- [ ] El 40 % superior está libre en los frames 1–25 (escritorio) y su equivalente en móvil.
- [ ] Cada reposo (S2, S4, S6, S8) es una pose limpia y legible.
- [ ] Sin texto legible, sin logos de terceros, sin marcas de agua.
- [ ] Peso total ≤ 7 MB (escritorio) y ≤ 2,5 MB (móvil).
- [ ] `poster-first`, `poster-first-mobile` y `poster-last` generados y bellos por sí solos.
- [ ] Revisión en escritorio y móvil con la timeline real (§6.8).

---

## 8. Páginas interiores

### 8.1 Patrones comunes

- **Estructura base:** hero interior (etiqueta mono + H1 `display-l` + intro + CTA) → contenido → banda CTA → footer.
- **Hero interior:** sin pin. H1 con `SplitReveal`; un elemento visual propio de cada página (ilustración de línea, `LayersExploded`, mosaico de casos).
- **Metadata:** helper `buildMetadata({ title, description, path, image })` en `lib/seo.ts` que devuelve `title` (con sufijo ` | {{MARCA}}`), `description`, `canonical`, `openGraph` y `twitter`.
- **Migas de pan** + JSON-LD `BreadcrumbList` en toda página que no sea la home.
- **Cada página** termina con la `CtaBand` (§6.9, sección 11) adaptada a su contexto.

### 8.2 `/servicios` — Índice de servicios

- **Title:** `Servicios · Productos digitales a medida | {{MARCA}}`
- **Description:** `MVPs, software a medida, automatización con IA y productos creativos. Descubre cómo diseñamos y construimos productos digitales de la idea al lanzamiento.`
- **H1:** "Todo lo necesario para *construir* tu producto digital."
- **Intro:** "Cuatro formas de trabajar contigo, un mismo estándar: diseño cuidado, código sólido y entrega por fases."

**Secciones**
1. **Hero + `LayersExploded`:** pila de 4 capas en CSS 3D (Interfaz, Lógica, Datos, Automatización) que se separan con el scroll.
2. **Las 4 líneas:** tarjetas grandes, alternando imagen a izquierda/derecha, cada una con descripción, 3 puntos y enlace a su página.
3. **Transversal a todo:** UX/UI · Calidad y rendimiento · Analítica · Mantenimiento (4 mini-tarjetas).
4. **Cómo elegir** (tabla "Si tu situación es… → te conviene…"):
   - "Tengo una idea y nada construido" → **MVP**.
   - "Mi equipo pierde horas en tareas manuales" → **Automatización e IA**.
   - "Necesito un portal, panel o herramienta para mi empresa" → **Software a medida**.
   - "Quiero una experiencia digital con identidad propia" → **Productos creativos**.
5. **Proceso resumido** (5 pasos) con enlace a `/proceso`.
6. **FAQ breve** (3 preguntas) + **CTA**.

**`LayersExploded` (CSS 3D + GSAP)**

```tsx
<div className="layers" data-layers>
  <div className="layers__stack">
    {['Interfaz', 'Lógica', 'Datos', 'Automatización'].map((label) => (
      <div key={label} className="layers__layer"><span className="label">{label}</span></div>
    ))}
  </div>
</div>
```

```css
.layers { perspective: 1400px; height: 520px; display: grid; place-items: center; }
.layers__stack { position: relative; width: min(70vw, 460px); aspect-ratio: 1.2; transform-style: preserve-3d; }
.layers__layer {
  position: absolute; inset: 0; padding: 1.25rem; border-radius: 28px;
  background: rgb(255 255 255 / .62); border: 1px solid var(--line); box-shadow: var(--shadow-float);
  backdrop-filter: blur(10px);
}
.layers__layer:last-child { border-color: var(--accent); }
/* Safari: si backdrop-filter rompe el 3D, usar fondo sólido semitransparente sin blur */
```

```ts
gsap.set('.layers__stack', { rotateX: 58, rotateZ: -32 });
gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: { trigger: '[data-layers]', start: 'top 75%', end: 'bottom 35%', scrub: true },
})
  .fromTo('.layers__layer', { z: 0 }, { z: (i) => (3 - i) * 84 }, 0)
  .to('.layers__stack', { rotateZ: -22 }, 0);
```

### 8.3 Plantilla de página de servicio (`/servicios/[slug]`)

Contenido en `content/services.ts` (un objeto por servicio), render único con `generateStaticParams`.

**Secciones:** (1) Hero interior · (2) Para quién es · (3) Qué entregamos (6 puntos con icono) · (4) Cómo lo hacemos (4–5 pasos específicos) · (5) Casos de uso · (6) Tecnología (marquesina propia) · (7) Casos relacionados (2) · (8) FAQ (4, con JSON-LD) · (9) CTA.

**JSON-LD `Service`** por página (nombre, descripción, `provider` = Organization, `areaServed`, `serviceType`).

#### 8.3.1 `/servicios/mvp` — contenido completo

- **Title:** `Desarrollo de MVP a medida para emprendedores | {{MARCA}}`
- **Description:** `Convierte tu idea en un MVP real: diseño, desarrollo y lanzamiento de tu primera versión, con foco en validar y aprender rápido.`
- **H1:** "De la idea a un *MVP* que puedes enseñar a usuarios reales."
- **Intro:** "Un MVP no es un producto a medias: es la versión más pequeña que te permite validar lo importante. Te ayudamos a decidir qué entra y qué no, y lo construimos bien."
- **Para quién es:** Fundadores/as con una idea y sin equipo técnico · Equipos que quieren validar antes de invertir más · Startups que preparan una ronda y necesitan un producto que enseñar.
- **Qué entregamos:**
  1. Definición del alcance del MVP (qué sí, qué no, qué después).
  2. Prototipo navegable en Figma.
  3. Diseño de interfaz listo para desarrollo.
  4. Producto funcional en producción (web o móvil).
  5. Analítica básica para medir el uso real.
  6. Documentación y traspaso del código ⚠️ (según contrato).
- **Cómo lo hacemos:**
  1. **Descubrimiento** — una sesión de trabajo y un mapa de funcionalidades.
  2. **Alcance del MVP** — matriz esencial / deseable / futuro.
  3. **Prototipo validado** — pruebas con usuarios reales antes de programar ⚠️ (nº de usuarios).
  4. **Construcción por sprints** — entregas cortas y visibles.
  5. **Lanzamiento y medición** — publicación y primeras métricas.
- **Casos de uso:** marketplace sencillo · SaaS vertical · app de reservas · herramienta para comunidades · panel con suscripciones y pagos.
- **Tecnología (editable):** Next.js · React · TypeScript · Supabase · pasarela de pago (p. ej. Stripe) · Vercel.
- **FAQ:** ¿Qué diferencia hay entre MVP y prototipo? · ¿Cuánto tarda? ⚠️ · ¿Puedo ampliar el MVP después? · ¿Necesito saber de tecnología?
- **CTA:** "Cuéntanos tu idea".

#### 8.3.2 `/servicios/software-a-medida`

- **Title:** `Software a medida para empresas: portales, paneles y herramientas internas | {{MARCA}}`
- **Description:** `Diseñamos y desarrollamos software a medida que encaja con tus procesos: portales de clientes, paneles de operaciones, herramientas internas e integraciones.`
- **H1:** "Software que *encaja* con tu empresa, no al revés."
- **Intro:** "Portales, paneles de control, herramientas internas y plataformas diseñadas alrededor de tus procesos reales."
- **Para quién:** pymes con procesos en hojas de cálculo y correo · equipos de operaciones · empresas que han superado una herramienta genérica.
- **Entregables:** análisis de procesos · diseño UX de flujos · aplicación web a medida · integraciones (ERP, CRM, facturación) · roles y permisos · formación y documentación.
- **Casos de uso:** portal de clientes · panel de operaciones · gestión de pedidos y stock · CRM a medida · herramienta de presupuestos.
- **Tecnología:** Next.js · TypeScript · PostgreSQL / Supabase · APIs e integraciones.
- **FAQ:** ¿Software a medida o herramienta existente? · ¿Se integra con lo que ya usamos? · ¿Quién lo mantiene? · ¿Cómo se gestionan seguridad y datos?

#### 8.3.3 `/servicios/automatizacion-ia`

- **Title:** `Automatización de procesos e IA para empresas | {{MARCA}}`
- **Description:** `Conectamos tus herramientas y automatizamos tareas repetitivas con n8n, Make, Power Automate y asistentes de IA, solo donde aportan valor real.`
- **H1:** "Procesos que *se hacen solos*, con IA donde de verdad aporta."
- **Intro:** "Conectamos tus herramientas, eliminamos trabajo manual y añadimos IA solo donde mejora el resultado."
- **Para quién:** equipos que copian datos entre herramientas · operaciones, ventas y atención al cliente saturadas · negocios que quieren usar IA sin perderse.
- **Entregables:** mapa de procesos priorizado por impacto · automatizaciones (n8n, Make, Power Automate según el caso) · integraciones por API · asistentes y agentes de IA con tus datos · monitorización y alertas · documentación y formación.
- **Casos de uso:** alta de clientes automatizada · facturación y cobros · clasificación y respuesta de emails o tickets · informes automáticos · extracción de datos de documentos.
- **FAQ:** ¿Qué procesos merece la pena automatizar? · ¿Es seguro usar IA con datos de mi empresa? ⚠️ · ¿Qué pasa si falla una automatización? · ¿No-code o código?

#### 8.3.4 `/servicios/productos-creativos`

- **Title:** `Webs inmersivas y productos creativos interactivos | {{MARCA}}`
- **Description:** `Experiencias web con animación, 3D y storytelling por scroll: lanzamientos, herramientas interactivas y formatos digitales con identidad propia.`
- **H1:** "Experiencias digitales con *identidad propia*."
- **Intro:** "Webs inmersivas, herramientas interactivas y formatos digitales donde el diseño y la animación forman parte del producto."
- **Para quién:** marcas que lanzan algo nuevo · creadores y estudios · proyectos culturales y educativos.
- **Entregables:** dirección creativa y prototipo · diseño de interacción y motion · desarrollo front-end avanzado (animación, 3D si procede) · producción de assets 3D/vídeo ⚠️ · optimización de rendimiento y accesibilidad · publicación y mantenimiento.
- **Casos de uso:** web de lanzamiento con storytelling por scroll · configurador de producto · herramienta interactiva educativa · experiencia para un evento.
- **Tecnología:** Next.js · GSAP · Three.js / React Three Fiber · Rive / Lottie · Blender.
- **FAQ:** ¿Funcionará bien en móvil? · ¿Puede ser accesible y espectacular a la vez? · ¿Quién produce el 3D o el vídeo? · ¿Cuánto pesa?
- **Nota:** esta página debe **demostrar** el servicio: incluir un mini-ejemplo interactivo (p. ej. un objeto que reacciona al scroll) o un enlace al hero de la home.

### 8.4 `/proyectos` y `/proyectos/[slug]`

**Índice**
- **Title:** `Proyectos · Casos de estudio | {{MARCA}}` · **H1:** "Proyectos que *funcionan*."
- **Intro:** "Productos reales para emprendedores y empresas. Cada caso cuenta el reto, lo que hicimos y lo que cambió."
- **Filtros** (chips): Todos · MVP · Empresa · Automatización · Creativo. Reordenación animada con **GSAP Flip**.
- **Rejilla** asimétrica de 2 columnas con alturas alternas; `ProjectCard` con cursor "Ver".

**Tipo de datos**

```ts
export type Project = {
  slug: string;
  title: string;
  client: string;
  year: number;
  categories: Array<'mvp' | 'empresa' | 'automatizacion' | 'creativo'>;
  services: string[];
  stack: string[];
  summary: string;                                    // 1–2 frases
  cover: { src: string; alt: string };
  results?: Array<{ label: string; value: string }>;  // SOLO datos reales y verificables
  testimonial?: { quote: string; author: string; role: string };
  isConcept?: boolean;                                // caso de concepto: etiquetar claramente
};
```

**Plantilla de caso**
1. **Hero:** título, cliente, año, servicios, stack y portada grande con `ImageReveal`.
2. **Resumen en 3 bloques:** *El reto · Lo que hicimos · El resultado*.
3. **Galería:** capturas en marcos de dispositivo limpios; columnas sticky alternas.
4. **Decisiones clave:** 2–3 decisiones de producto o técnicas explicadas (profundidad = confianza).
5. **Resultados:** `StatCounter` **solo si hay datos reales**.
6. **Testimonio** (con permiso).
7. **Siguiente proyecto** (enlace grande) + CTA.

> **Regla:** usar proyectos **reales** del portfolio con permiso del cliente. Si aún no hay tres, publicar solo los reales y, como máximo, casos de concepto **claramente etiquetados** como tales (`isConcept: true`).

### 8.5 `/proceso`

- **Title:** `Cómo trabajamos · Proceso de desarrollo de producto | {{MARCA}}` · **H1:** "Cómo trabajamos, *sin sorpresas*."
- **Intro:** "Un proceso corto, visible y por fases. Sabes qué pasa en cada momento, qué recibes y cuándo."
- **Secciones**
  1. **Timeline ampliada (5 fases)** — para cada una: objetivo · qué hacemos · qué recibes · qué necesitamos de ti · duración orientativa ⚠️. Layout: título fijo a la izquierda y fases que se desplazan a la derecha, con línea de progreso.
  2. **Cómo colaboramos:** canal de comunicación, reuniones de seguimiento, tablero compartido, entregas semanales o quincenales ⚠️.
  3. **Principios (4):** Transparencia · Entregas pequeñas y frecuentes · Decisiones con datos · Código que se puede heredar.
  4. **Qué esperamos de ti:** feedback a tiempo, un interlocutor con capacidad de decisión, acceso a los materiales necesarios.
  5. **Garantías y soporte** ⚠️ (revisión incluida, periodo de soporte post-lanzamiento) — solo con lo que realmente se pueda cumplir.
  6. **FAQ + CTA** ("Agenda una llamada").

### 8.6 `/emprendedores`

- **Title:** `Desarrollo de MVP y apps para emprendedores | {{MARCA}}`
- **H1:** "Tu idea, *lista para probarse* con usuarios reales."
- **Hero:** intro + CTA "Cuéntanos tu idea".
- **Lo que solemos ver (4 dolores):** "No sé por dónde empezar" · "Me da miedo gastar en algo que no funcione" · "No tengo equipo técnico" · "Necesito algo que enseñar a inversores o clientes".
- **Cómo te ayudamos — rutas de trabajo** ⚠️ (validar nombres y duraciones):
  1. **Sprint de validación** — alcance + prototipo navegable.
  2. **MVP** — diseño, desarrollo y lanzamiento de la primera versión.
  3. **Evolución** — mejoras, nuevas funcionalidades y mantenimiento.
- **Casos** (2) · **FAQ específica** · **CTA** "Cuéntanos tu idea".

### 8.7 `/empresas`

- **Title:** `Software a medida y automatización para empresas | {{MARCA}}`
- **H1:** "Herramientas digitales que *tu equipo* realmente usa."
- **Problemas que resolvemos:** datos dispersos · procesos manuales · herramientas que no encajan · integraciones que fallan.
- **Cómo trabajamos con equipos de empresa:** alineación con stakeholders · coordinación con IT · seguridad y protección de datos · formación al equipo · soporte ⚠️.
- **Entregables típicos:** portales, paneles, integraciones, automatizaciones, asistentes de IA.
- **Seguridad y cumplimiento** ⚠️: accesos y roles, cifrado, copias de seguridad, tratamiento de datos conforme a la normativa aplicable (validar cada afirmación con la práctica real antes de publicar).
- **Casos** (2) · **FAQ específica** · **CTA** "Agenda una llamada".

### 8.8 `/nosotros`

- **Title:** `Sobre nosotros · Estudio de producto digital | {{MARCA}}` · **H1:** "Un estudio *pequeño* con estándares altos." ⚠️ (ajustar si no es cierto)
- **Manifiesto:** "Creemos que un buen producto digital es el resultado de decisiones claras: qué construir, qué no, y por qué. Nuestro trabajo es ayudarte a tomarlas y llevarlas a producción."
- **Principios (4):** Claridad antes que complejidad · Producto antes que pantallas · Entrega continua · Honestidad técnica.
- **Equipo:** fichas con foto, nombre, rol y una frase (`{{EQUIPO}}`). Si es una sola persona, contarlo con orgullo: "Estudio liderado por {{NOMBRE}}, con una red de especialistas de confianza".
- **Cómo nos apoyamos en otros:** colaboradores de confianza (3D, motion, copy, legal) ⚠️.
- **Stack y herramientas** (marquesina) · **CTA**.

### 8.9 `/blog` (Laboratorio)

- **Title:** `Laboratorio · Notas de producto, diseño y automatización | {{MARCA}}` · **H1:** "Laboratorio: *notas* de producto, diseño y automatización."
- **Listado:** artículo destacado + rejilla; filtros por etiqueta; paginación o "cargar más".
- **Newsletter** (doble opt-in; proveedor `{{PROVEEDOR}}`) ⚠️ RGPD.
- **Plantilla de artículo:** cabecera (título, fecha, autor, tiempo de lectura) · índice lateral sticky · contenido MDX con componentes (`Callout`, `CodeBlock`, `Figure`, `Demo`) · artículos relacionados · CTA contextual al servicio relacionado · barra de progreso de lectura 🔧.
- **Frontmatter:**

```yaml
---
title: "Cómo validar un MVP en 6 semanas"
description: "Un método práctico para decidir qué construir primero y cómo comprobar que funciona."
date: 2026-11-10
updated: 2026-11-10
author: "{{AUTOR}}"
tags: ["mvp", "producto"]
service: "mvp"
cover: "/blog/validar-mvp.jpg"
draft: false
---
```

- **Seis primeros artículos propuestos (con intención de búsqueda):**
  1. Cómo validar un MVP en 6 semanas.
  2. Qué incluye (y qué no) un MVP.
  3. Software a medida vs. herramientas no-code: cuándo elegir cada uno.
  4. Automatizar procesos con n8n o Make: cuándo merece la pena.
  5. Checklist antes de contratar un estudio de producto digital.
  6. Cómo hicimos nuestro hero con scroll storytelling (making of técnico: es el mejor contenido de autoridad).

### 8.10 `/contacto`

- **Title:** `Contacto · Cuéntanos tu idea | {{MARCA}}` · **H1:** "Cuéntanos tu *idea*."
- **Intro:** "En dos minutos nos cuentas lo esencial. Te respondemos en menos de un día laborable." ⚠️ (solo si es un compromiso real)
- **Layout:** izquierda, `ContactWizard`; derecha (sticky): **"¿Prefieres hablar?"** con botón a la agenda (embed Cal.com/Calendly), email directo y **"Qué pasa después"** en 3 pasos (1. Leemos tu brief · 2. Te escribimos con preguntas o proponemos llamada · 3. Recibes una propuesta clara).
- **Asistente de 6 pasos:**
  1. **¿Quién eres?** — Emprendedor/a · Empresa.
  2. **¿Qué necesitas?** (multi) — MVP · App web · App móvil · Herramienta interna · Automatización e IA · Diseño UX/UI · Web creativa · Aún no lo sé.
  3. **¿En qué punto estás?** — Solo una idea · Tengo diseño o prototipo · Ya existe un producto · Necesito rehacer o mejorar algo.
  4. **¿Plazos y presupuesto?** — Plazo (Lo antes posible · 1–3 meses · 3–6 meses · Sin fecha) y presupuesto (rangos `{{RANGOS}}` ⚠️ + "Prefiero comentarlo").
  5. **Cuéntanos más** — texto libre (máx. 1500 car.) + enlaces de referencia (opcional).
  6. **¿Cómo te contactamos?** — nombre, email, empresa (si aplica), teléfono (opcional), **casilla de consentimiento** (obligatoria, con enlace a privacidad).
- **Comportamiento:** barra de progreso, navegación por teclado, validación en línea, botón Atrás, **autoguardado en `sessionStorage`**, estados de carga/error claros, foco gestionado en cada paso (`aria-live` para el título del paso).
- **Éxito:** "¡Recibido! Te escribiremos en breve." + botón para agendar llamada + 2 artículos recomendados.
- **Eventos de analítica:** `form_start`, `form_step` (n), `form_submit`, `form_error`.

### 8.11 FAQ (contenido global, `content/faq.ts`)

> ⚠️ Todas las respuestas comerciales (precios, plazos, propiedad, soporte) deben confirmarse antes de publicar.

1. **¿Cuánto cuesta un proyecto?** — "Depende del alcance. Tras una primera llamada te enviamos una propuesta cerrada con entregables, plazos y presupuesto. Si hay que ajustar el alcance, lo hablamos antes, no después."
2. **¿Cuánto tarda un MVP?** — "Normalmente entre 4 y 10 semanas, según la complejidad."
3. **¿Necesito tener todo definido para empezar?** — "No. Si solo tienes una idea, empezamos por una fase corta de definición."
4. **¿De quién es el código y el diseño?** — "Tuyo. Al terminar recibes el código fuente, los diseños y la documentación, según lo acordado en el contrato."
5. **¿Trabajáis con equipos técnicos que ya tenemos?** — "Sí. Podemos encargarnos de una parte (diseño, front-end, automatización) y coordinarnos con tu equipo."
6. **¿Qué pasa después del lanzamiento?** — "Seguimos contigo: mantenimiento, mejoras y nuevas funcionalidades, con un plan acordado."
7. **¿Qué tecnologías usáis?** — "Elegimos según el proyecto: Next.js y React, Supabase o PostgreSQL, y plataformas como Webflow, n8n o Make cuando aceleran sin atarte."
8. **¿Hacéis solo diseño o solo desarrollo?** — "Podemos encargarnos del producto completo o únicamente de una fase."

### 8.12 Páginas legales (`/legal/[slug]`, MDX)

> ⚠️ Redactar o revisar con asesoría legal según la jurisdicción de `{{RAZÓN_SOCIAL}}`. Estructura mínima:

- **Política de privacidad:** responsable y contacto · finalidades (responder consultas, enviar propuestas, newsletter si aplica) · base jurídica · destinatarios/encargados (hosting, base de datos, email transaccional, antispam, analítica) · transferencias internacionales si las hay · plazos de conservación · derechos y cómo ejercerlos · reclamación ante la autoridad de control.
- **Política de cookies:** qué se usa y para qué. Si solo hay analítica sin cookies, explicarlo con claridad; si se añade cualquier cookie no esencial, implementar banner de consentimiento antes de cargar el script.
- **Aviso legal:** identificación del titular, condiciones de uso, propiedad intelectual, limitación de responsabilidad, ley y jurisdicción aplicables.

### 8.13 `/404`

- **H1:** "Esta página no existe (todavía)." Texto: "Quizá el enlace cambió o nunca estuvo. Prueba por aquí:"
- **Visual:** una línea de lápiz que se dibuja y queda incompleta (animación con `stroke-dashoffset`), coherente con el hero.
- **Enlaces:** Inicio · Servicios · Proyectos · Contacto. `noindex`.

---

## 9. Formulario de contacto y backend

Flujo: **ContactWizard (cliente) → `POST /api/contact` → verificación Turnstile → validación zod → inserción en Supabase → email de aviso (Resend)**. La inserción es lo crítico; el email es *best effort* (si falla, el lead ya está guardado).

### 9.1 Validación compartida (`lib/validators.ts`)

```ts
import { z } from 'zod';

export const NEEDS = [
  'mvp', 'app-web', 'app-movil', 'herramienta-interna',
  'automatizacion-ia', 'ux-ui', 'web-creativa', 'no-se',
] as const;

export const contactSchema = z.object({
  audience: z.enum(['emprendedor', 'empresa']),
  needs: z.array(z.enum(NEEDS)).min(1, 'Elige al menos una opción').max(8),
  stage: z.enum(['idea', 'prototipo', 'producto-existente', 'rehacer']),
  timeline: z.enum(['lo-antes-posible', '1-3-meses', '3-6-meses', 'sin-fecha']),
  budget: z.string().max(60).optional(),
  message: z.string().trim().max(1500).optional(),
  links: z.array(z.string().url()).max(5).optional(),
  name: z.string().trim().min(2, 'Escribe tu nombre').max(120),
  email: z.string().trim().toLowerCase().email('Email no válido').max(200),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  consent: z.boolean().refine((v) => v === true, { message: 'Debes aceptar la política de privacidad' }),
  website: z.string().max(0).optional(), // honeypot: debe llegar vacío
  turnstileToken: z.string().min(1),
  utm: z.record(z.string(), z.string()).optional(),
  source: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
```

### 9.2 Base de datos (Supabase · SQL)

```sql
create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  audience    text not null check (audience in ('emprendedor','empresa')),
  needs       text[] not null default '{}',
  stage       text,
  timeline    text,
  budget      text,
  message     text,
  links       text[],
  name        text not null,
  email       text not null,
  company     text,
  phone       text,
  consent     boolean not null,
  source      text,
  utm         jsonb,
  status      text not null default 'nuevo'   -- nuevo | contactado | propuesta | ganado | perdido
);

create index leads_created_at_idx on public.leads (created_at desc);

-- Seguridad: RLS activada y SIN políticas públicas.
-- Solo el service role (servidor) puede leer/escribir.
alter table public.leads enable row level security;
```

⚠️ Elegir región **UE** del proyecto si se tratan datos de residentes en la UE y firmar el acuerdo de encargado de tratamiento con cada proveedor.

### 9.3 Route Handler (`app/api/contact/route.ts`)

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { contactSchema } from '@/lib/validators';

export const runtime = 'nodejs';

async function verifyTurnstile(token: string, ip?: string) {
  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
  if (ip) body.set('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'validation', issues: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;

  // Honeypot: si viene relleno, simulamos éxito y no hacemos nada
  if (d.website) return NextResponse.json({ ok: true });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (!(await verifyTurnstile(d.turnstileToken, ip))) {
    return NextResponse.json({ ok: false, error: 'captcha' }, { status: 400 });
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from('leads').insert({
    audience: d.audience, needs: d.needs, stage: d.stage, timeline: d.timeline,
    budget: d.budget ?? null, message: d.message ?? null, links: d.links ?? null,
    name: d.name, email: d.email, company: d.company ?? null, phone: d.phone ?? null,
    consent: d.consent, source: d.source ?? null, utm: d.utm ?? null,
  });

  if (error) {
    console.error('lead_insert_failed', error.code); // sin datos personales en logs
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 });
  }

  // Aviso por email: best effort
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: d.email, // verificar el nombre del campo en la versión instalada del SDK
      subject: `Nuevo lead: ${d.name} (${d.audience})`,
      text: [
        `Nombre: ${d.name}`, `Email: ${d.email}`, d.company ? `Empresa: ${d.company}` : '', d.phone ? `Teléfono: ${d.phone}` : '',
        `Perfil: ${d.audience}`, `Necesita: ${d.needs.join(', ')}`, `Etapa: ${d.stage}`,
        `Plazo: ${d.timeline}`, d.budget ? `Presupuesto: ${d.budget}` : '',
        '', d.message ?? '', d.links?.length ? `\nEnlaces:\n${d.links.join('\n')}` : '',
      ].filter(Boolean).join('\n'),
    });
  } catch {
    console.error('lead_email_failed');
  }

  return NextResponse.json({ ok: true });
}
```

### 9.4 Cliente y antispam

- **Turnstile** se carga **solo en `/contacto`** (script con `next/script`, estrategia `afterInteractive`) y el token se envía en el paso 6.
- **Honeypot:** campo `website` oculto con CSS (`position:absolute; left:-9999px`), `tabindex="-1"`, `autocomplete="off"`, `aria-hidden`.
- **UTM y origen:** al aterrizar, guardar `utm_*` y `document.referrer` en `sessionStorage`; enviarlos en `utm` y `source`.
- **Rate limiting** 🔧: añadir `@upstash/ratelimit` (p. ej. 5 envíos/hora/IP) si aparece spam.
- **Errores:** mensaje humano y accionable ("No hemos podido enviarlo. Inténtalo de nuevo o escríbenos a hola@…"); nunca perder lo ya escrito (autoguardado).

### 9.5 Pruebas de este módulo

- Validación: cada campo y cada mensaje de error.
- Honeypot relleno → `ok: true` sin insertar.
- Turnstile inválido → `400 captcha`.
- Inserción fallida → `500` y mensaje de error en UI.
- Email caído → el lead se guarda y el usuario ve éxito.

---

## 10. SEO

### 10.1 Metadata

`app/layout.tsx` define `metadataBase: new URL(site.url)`, `lang="es"`, plantilla de título e icono. Helper común (`lib/seo.ts`):

```ts
import type { Metadata } from 'next';
import { site } from '@/site.config';

export function buildMetadata(opts: { title: string; description: string; path?: string; image?: string }): Metadata {
  const { title, description, path = '/', image } = opts;
  const url = new URL(path, site.url).toString();
  // Los títulos de §6–§8 ya incluyen "| {{MARCA}}": no duplicar el sufijo
  const fullTitle = title.includes(site.name) ? title : `${title} | ${site.name}`;
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website', url, title: fullTitle, description,
      siteName: site.name, locale: 'es_ES',
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description },
  };
}
```

Reglas de contenido: **un solo H1** por página · title ≤ 60 caracteres y description ≤ 155 · URL cortas en minúsculas y sin acentos · `alt` descriptivo en imágenes informativas (vacío en decorativas) · enlazado interno servicio ↔ casos ↔ blog.

### 10.2 Datos estructurados (JSON-LD)

```tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

| Página | Tipos |
|---|---|
| Home | `Organization` (nombre, url, logo, `sameAs` redes, `contactPoint`) + `WebSite` |
| Servicios | `Service` (nombre, descripción, `provider`, `areaServed`) |
| Proyectos / casos | `CreativeWork` o `Article` |
| Blog | `Article` (`headline`, `datePublished`, `dateModified`, `author`, `image`) |
| FAQ (home, servicios, proceso) | `FAQPage` |
| Páginas internas | `BreadcrumbList` |

Validar con el test de resultados enriquecidos de Google.

### 10.3 `sitemap.ts`, `robots.ts` y feed

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { site } from '@/site.config';
import { services } from '@/content/services';
import { getAllPosts, getAllProjects } from '@/lib/content'; // implementar lectura de MDX

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ['', '/servicios', '/proyectos', '/proceso', '/emprendedores', '/empresas', '/nosotros', '/blog', '/contacto'];
  const urls = [
    ...fixed,
    ...services.map((s) => `/servicios/${s.slug}`),
    ...(await getAllProjects()).map((p) => `/proyectos/${p.slug}`),
    ...(await getAllPosts()).map((p) => `/blog/${p.slug}`),
    '/legal/privacidad', '/legal/cookies', '/legal/aviso-legal',
  ];
  return urls.map((path) => ({ url: `${site.url}${path}`, lastModified: new Date() }));
}
```

```ts
// app/robots.ts
import type { MetadataRoute } from 'next';
import { site } from '@/site.config';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/' }], sitemap: `${site.url}/sitemap.xml` };
}
```

`/feed.xml`: RSS con las últimas 20 entradas del blog.

### 10.4 Imágenes OG

`app/opengraph-image.tsx` con `next/og` (`ImageResponse`): fondo blanco, titular y el **último frame** del hero. *(El generador de OG no admite WebP de forma fiable: exportar `public/og/poster-last.png`.)* Para blog y casos, `opengraph-image.tsx` dinámico por ruta con el título.

### 10.5 Tareas fuera del código

Alta en **Google Search Console** y **Bing Webmaster Tools**, envío del sitemap, comprobación de indexación del H1 y de los capítulos del hero (texto real en HTML), y un calendario de publicación del blog (≥ 1 artículo/quincena durante los primeros 3 meses).

---

## 11. Rendimiento

### 11.1 Presupuestos

| Métrica / recurso | Objetivo |
|---|---|
| LCP (p75, móvil 4G) | ≤ 2,5 s (elemento LCP = póster del hero o H1) |
| INP | ≤ 200 ms |
| CLS | ≤ 0,1 |
| JS inicial de la home (gzip, sin secuencia) | ≲ 200 KB |
| Secuencia escritorio | ≤ 7 MB, descargada **después** del LCP |
| Secuencia móvil | ≤ 2,5 MB |
| Memoria durante el hero | < 300 MB escritorio · < 150 MB móvil |
| Lighthouse móvil (home) | ≥ 85 · resto de páginas ≥ 95 |

### 11.2 Tácticas obligatorias

1. **LCP:** póster = frame 1 con `fetchpriority="high"`, `<link rel="preload" as="image">` con `media` (§6.6e), dimensiones explícitas.
2. **La secuencia no compite con el LCP:** `requestIdleCallback` y descarga progresiva (0, último, cada 16, 8, 4, 2, 1).
3. **Reservar espacio:** el `.hero__box` tiene `aspect-ratio` fijo → sin CLS.
4. **Fuentes:** `next/font` (autoalojado, `display: swap`), solo los pesos necesarios (Geist 400/500, Instrument Serif 400 normal + cursiva).
5. **JS:** `HeroStory`, `ScrollTrigger` y `SplitText` solo donde se usan; los componentes pesados con `next/dynamic`. Turnstile y el embed de agenda **solo en `/contacto`** (y el embed, cargado al pulsar).
6. **Animar solo `transform` y `opacity`.** `will-change` solo en el escenario del hero y solo durante el pin.
7. **Secciones bajo el pliegue:** `content-visibility: auto` con `contain-intrinsic-size`.
8. **Lenis solo con puntero** (no táctil) y desactivado con `prefers-reduced-motion`.
9. **Imágenes:** `next/image` con `sizes` correctos; `priority` solo en la LCP de cada página.
10. **Degradación automática 🔧:** medir fotogramas durante el primer segundo de scroll; si la media cae por debajo de ≈ 30 fps, cambiar a versión estática (`data-static`).

### 11.3 Medición

`lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/servicios", "http://localhost:3000/contacto"],
      "startServerCommand": "npm run start",
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["warn", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

Además: reporte de Web Vitals reales (`useReportWebVitals` → analítica) y prueba en **dispositivos reales** (un iPhone y un Android de gama media) con red 4G simulada.

---

## 12. Accesibilidad (WCAG 2.2 AA)

**Checklist**

- [ ] `lang="es"`, títulos de página únicos, un H1 por página, jerarquía de encabezados sin saltos.
- [ ] Contraste: texto ≥ 4,5:1 (`--ink-3` y `--accent` cumplen; `--signal` **nunca** para texto).
- [ ] Todo el sitio operable con teclado; `:focus-visible` siempre visible; orden de foco lógico.
- [ ] **Enlace "Saltar la animación"** al inicio del hero (visible al recibir foco) que lleva a `#inicio-contenido` (primera sección tras el hero). Con Lenis, resolver el ancla con `lenis.scrollTo`.
- [ ] Enlace "Saltar al contenido" global antes del header.
- [ ] **El hero no depende de la animación para comunicar:** H1, subtítulo y 4 capítulos existen como texto real.
- [ ] **Bloque `sr-only` con la narrativa completa** (los capítulos están ocultos con `visibility` hasta su momento, así que un lector de pantalla podría perderlos). Añadir dentro de `HeroStory`:

```tsx
<div className="sr-only">
  <h2>Cómo trabajamos, en cuatro pasos</h2>
  <ol>
    {CHAPTERS.map((c) => (<li key={c.id}><strong>{c.title}.</strong> {c.lead} {c.text}</li>))}
  </ol>
</div>
```

- [ ] `<canvas role="img" aria-label="…">` con descripción breve (ya incluida en §6.6e).
- [ ] `prefers-reduced-motion`: sin Lenis, sin ScrollTrigger, sin parallax, hero estático completo.
- [ ] Sin contenido parpadeante ni autoplay con sonido.
- [ ] Formularios: `label` asociado, errores vinculados con `aria-describedby`, mensajes con `aria-live`, foco al primer error, indicaciones de formato.
- [ ] Objetivos táctiles ≥ 44 × 44 px (mínimo absoluto 24 × 24).
- [ ] Zoom hasta 200 % y reflow a 320 px sin pérdida de contenido; espaciado de texto ajustable.
- [ ] Gestión del foco al navegar entre rutas (mover el foco al H1 de la nueva página).
- [ ] Menús, acordeones y diálogos con Radix (roles y teclado correctos).
- [ ] Probar con **VoiceOver** (macOS e iOS) y **NVDA**; automatizar con `@axe-core/playwright`.

---

## 13. Analítica, privacidad y legal

### 13.1 Eventos

| Evento | Cuándo | Propiedades |
|---|---|---|
| `hero_chapter` | Se cruza el inicio de un capítulo del hero (una vez por capítulo) | `chapter` (01–04) |
| `cta_click` | Clic en cualquier CTA principal | `location`, `label` |
| `form_start` | Primer foco en el asistente | — |
| `form_step` | Avance de paso | `step` |
| `form_submit` | Envío correcto | `audience` |
| `form_error` | Error de validación o de servidor | `type` |
| `calendar_open` | Se abre la agenda | `from` |
| `scroll_depth` 🔧 | 25 / 50 / 75 / 100 % de página | `percent` |

**Nunca** enviar datos personales (email, nombre, texto libre) como propiedades.

```ts
// lib/analytics.ts
type EventName =
  | 'hero_chapter' | 'cta_click' | 'form_start' | 'form_step'
  | 'form_submit' | 'form_error' | 'calendar_open';

declare global {
  interface Window {
    plausible?: (name: string, opts?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

export function track(name: EventName, props?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  window.plausible?.(name, props ? { props } : undefined);
}
```

### 13.2 Privacidad

- Analítica **sin cookies** (Plausible/Umami). Si en el futuro se añade cualquier cookie o script no esencial, implementar **banner de consentimiento** y cargar el script solo tras aceptar. ⚠️ Validar con asesoría legal.
- Embed de agenda y Turnstile **no se cargan fuera de `/contacto`**; la agenda, con **fachada** (se carga al pulsar).
- Newsletter con **doble opt-in**.
- Política de conservación de leads (p. ej. 24 meses sin actividad) ⚠️ y procedimiento para atender solicitudes de acceso, rectificación y supresión.
- Contratos de encargado de tratamiento con hosting, base de datos, email y antispam.

---

## 14. QA y pruebas

### 14.1 Matriz de navegadores y dispositivos

| Entorno | Obligatorio |
|---|---|
| Chrome (macOS/Windows), Edge | ✅ |
| Safari macOS | ✅ |
| Firefox | ✅ |
| Safari iOS (iPhone real) | ✅ |
| Chrome Android (gama media real) | ✅ |
| Tablet (iPad) | ✅ |
| Resoluciones | 360×640 · 390×844 · 768×1024 · 1280×720 · 1440×900 · 1920×1080 · 2560×1440 |

### 14.2 Escenarios específicos del hero

1. Scroll lento y rápido (rueda, trackpad, arrastre de barra, teclado).
2. Recarga a mitad del hero: restaura la posición y el frame correcto.
3. Botón Atrás desde otra página: vuelve al estado correcto.
4. Cambiar el tamaño de la ventana y la orientación del móvil durante el pin.
5. Cambiar de pestaña y volver.
6. Red lenta (3G simulada) → versión estática; red rápida → secuencia completa.
7. `prefers-reduced-motion: reduce` → hero estático completo.
8. Sin JS → póster + texto + CTA.
9. CPU ×6 más lenta → fluidez aceptable; si no, activar degradación (§11.2).
10. Comprobar que no hay saltos de color entre el último frame y la sección siguiente.

### 14.3 Pruebas automatizadas (Playwright)

```ts
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test('home: H1 visible y el capítulo 01 aparece al hacer scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('productos digitales');
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 900);
  await expect(page.locator('[data-chapter="idea"]')).toBeVisible({ timeout: 5000 });
});

test.describe('reduce motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('hero estático con capítulos visibles sin scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section.hero[data-static="true"]')).toBeVisible();
    await expect(page.locator('[data-chapter="lanzamiento"]')).toBeVisible();
  });
});
```

```ts
// tests/e2e/contact.spec.ts
import { test, expect } from '@playwright/test';

test('contacto: el asistente envía el lead (API simulada)', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({ json: { ok: true } }));
  await page.goto('/contacto');
  await page.getByRole('button', { name: /emprendedor/i }).click();
  // … completar pasos 2–6 …
  await expect(page.getByText(/recibido/i)).toBeVisible();
});
```

Más: `axe` en cada ruta principal · enlaces rotos (crawler simple) · `lhci autorun` en CI.

### 14.4 Checklist funcional

- [ ] Todos los enlaces internos y externos (`rel="noopener"` donde aplique).
- [ ] Formularios: caminos felices y de error.
- [ ] Menú móvil (abrir/cerrar, foco, Esc).
- [ ] Filtros de proyectos y blog.
- [ ] 404 real (estado HTTP 404).
- [ ] Redirecciones (`www` → apex, rutas antiguas si las hubiera).
- [ ] Metadatos y OG al compartir en LinkedIn/X/WhatsApp.

---

## 15. Despliegue

### 15.1 Vercel

- Proyecto conectado al repositorio; rama `main` = producción; **previews por PR**.
- Variables de entorno de §4.3 en *Production* y *Preview* (con claves de pruebas en Preview).
- Dominio `{{DOMINIO}}` + redirección `www` → apex, HTTPS forzado.
- `SEQUENCE_VERSION` versionado: los frames con caché inmutable (§7.7).

### 15.2 Cabeceras de seguridad (`next.config.ts`)

```ts
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
];

// dentro de async headers():
// { source: '/(.*)', headers: securityHeaders }
```

**CSP** (añadir y probar en modo *report-only* primero): `default-src 'self'`; `img-src 'self' data: blob:`; `script-src` con `'self'`, el dominio de analítica, `challenges.cloudflare.com` y el de la agenda; `frame-src` para Turnstile y la agenda; `connect-src 'self'` + analítica; `frame-ancestors 'self'`. Las imágenes de la secuencia se cargan con `fetch` desde el mismo origen (cubierto por `connect-src 'self'`) y se decodifican con `createImageBitmap` (no requiere `blob:` en `img-src`, pero conviene permitirlo).

### 15.3 Email y dominio

Configurar **SPF, DKIM y DMARC** del dominio de envío en Resend; comprobar la entrega a Gmail y Outlook.

### 15.4 Operación

- **Monitorización:** Vercel Analytics/Speed Insights 🔧 · Sentry 🔧 · chequeo de uptime del dominio y de `/api/contact` (con `OPTIONS` o un health endpoint).
- **Copias:** backups automáticos de Supabase; exportación semanal de `leads` a CSV 🔧.
- **Plan de lanzamiento:** *soft launch* a un círculo cercano → recoger feedback 48 h → corregir → anuncio público (LinkedIn, X, comunidades, contactos). Con una web anterior: mapa de redirecciones 301 antes del cambio de DNS.

---

## 16. Plan por fases

> Estimaciones **orientativas** para 1 desarrollador/a front-end + 1 artista 3D/motion (o IA) en paralelo ⚠️.

| Fase | Contenido | Entregable | Criterio de hecho | Estimación |
|---|---|---|---|---|
| **F0 · Preparación** | Decisiones §1.3, moodboard, brief 3D (§7), cuentas (Vercel, Supabase, Resend, Turnstile), repo | Brief aprobado + repo vacío | Decisiones tomadas y moodboard validado | 1–2 días |
| **F1 · Fundamentos** | Setup §4, tokens y tipografía §5, layout (Header/Footer/Providers), páginas vacías con metadata, CI | Sitio navegable con estructura final | `build` y `lint` OK; a11y ≥ 95 en páginas vacías | 3–4 días |
| **F2 · Producción del hero** (*en paralelo*) | Hoja de escenas, UI en Figma, render, scripts, pósters | `public/sequence/v1/*` | §7.9 completo | 5–10 días |
| **F3 · Hero + Home** | `HeroStory` con **frames de prueba** primero, luego material real; resto de secciones de la home | Home completa | §6.7 y §6.8 completos; LCP ≤ 2,5 s | 6–8 días |
| **F4 · Interiores** | Servicios (índice + 4), proyectos, proceso, emprendedores, empresas, nosotros, blog | Todas las páginas con contenido real | Copy final cargado; sin placeholders | 6–8 días |
| **F5 · Contacto y datos** | Wizard, API, Supabase, Resend, legales, analítica, JSON-LD, sitemap | Captación operativa | Lead de prueba llega a BD y email | 3–4 días |
| **F6 · QA y lanzamiento** | §14, rendimiento, accesibilidad, cabeceras, DNS, redirecciones | Producción en dominio final | Checklist §19 completo | 3–4 días |

**Total:** ≈ 4–6 semanas naturales con la producción del hero en paralelo.

**Hitos de demo:** M1 (fin F1) estructura navegable · M2 (mitad F3) hero con frames de prueba funcionando · M3 (fin F3) home con material real · M4 (fin F5) captación operativa · M5 lanzamiento.

### Frames de prueba (para no esperar al arte final)

`scripts/make-placeholders.mjs` genera 150 frames con un bloque que sube y crece y el número de frame impreso; sirve para desarrollar y calibrar toda la lógica del hero (§6) antes de tener el material real.

```js
// uso: node scripts/make-placeholders.mjs && cp -r assets/frames_src/desktop assets/frames_src/mobile
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'assets/frames_src/desktop';
await mkdir(OUT, { recursive: true });
const N = 150, S = 2400;

for (let i = 0; i < N; i++) {
  const t = i / (N - 1);
  const w = 500 + 900 * Math.sin(Math.PI * t);
  const cx = S / 2;
  const cy = S * (0.72 - 0.22 * Math.min(t * 3, 1));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <rect x="${cx - w / 2}" y="${cy - w / 2}" width="${w}" height="${w * 1.1}" rx="90" fill="#2b3bff" fill-opacity="${0.15 + 0.7 * t}"/>
    <text x="50%" y="${S - 160}" text-anchor="middle" font-family="monospace" font-size="120" fill="#6b6b76">${String(i + 1).padStart(3, '0')} / ${N}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/${String(i + 1).padStart(4, '0')}.png`);
}
console.log('Frames de prueba listos. Después: npm run sequence:build');
```

---

## 17. Prompts para un agente de código

Úsalos en orden. Pega la guía completa (o adjunta el archivo) como contexto en cada sesión. **Regla común a todos:** *no inventes datos, cifras, clientes ni copy comercial; usa los textos de la guía y deja los `{{PLACEHOLDERS}}` y los ⚠️ visibles en un `TODO.md`.*

**Prompt 1 · Fundamentos (F1)**
> Lee la guía. Implementa §4 y §5: proyecto Next.js (App Router, TypeScript estricto, Tailwind), tokens y tipografías (`next/font`), `site.config.ts`, estructura de carpetas, Header (píldora + menú de servicios + menú móvil), Footer, `SmoothScrollProvider` (§6.6b), componentes UI base (Button, LinkArrow, Chip, SectionLabel, Reveal, SplitReveal, ImageReveal, Marquee, FaqAccordion) y **todas las rutas de §3.1** con metadata y contenido provisional. No implementes el hero. Criterios: `npm run build` y `npm run lint` sin errores; Lighthouse accesibilidad ≥ 95 en las páginas vacías.

**Prompt 2 · Hero (F3, parte 1)**
> Implementa §6.2–§6.8: `lib/gsap.ts`, `hero.config.ts`, `lib/frame-sequence.ts`, `HeroStory` y el CSS del hero. Primero ejecuta `scripts/make-placeholders.mjs` y `npm run sequence:build` para tener frames de prueba. Respeta `FRAME_KEYS` y `CHAPTERS`. Incluye los estados de §6.7 (reduce-motion, conexión lenta, sin JS) y el bloque `sr-only` de §12. Añade los tests de `tests/e2e/home.spec.ts`. Criterios: scroll fluido a 60 fps en escritorio, LCP ≤ 2,5 s, sin CLS, memoria dentro del presupuesto.

**Prompt 3 · Resto de la home (F3, parte 2)**
> Implementa las secciones 2–11 de §6.9 con el copy exacto de la guía: Para quién, Manifiesto (scrub de palabras), Servicios (sticky apilado), Proyectos (rail horizontal fijado en escritorio, snap en móvil), Proceso (línea de progreso), Tecnología (marquesina), Laboratorio, FAQ (con JSON-LD) y banda CTA. Usa `matchMedia` para separar escritorio/móvil y respeta `prefers-reduced-motion`.

**Prompt 4 · Páginas interiores (F4)**
> Implementa §8 completo: datos tipados en `content/` (servicios, FAQ, proyectos), plantilla de servicio con `generateStaticParams`, índice y plantilla de casos, `/proceso`, `/emprendedores`, `/empresas`, `/nosotros`, blog en MDX con frontmatter de §8.9, `/404` y legales con estructura de §8.12. Incluye `LayersExploded` (§8.2), JSON-LD y migas de pan.

**Prompt 5 · Contacto y backend (F5)**
> Implementa §8.10 y §9: `ContactWizard` de 6 pasos (react-hook-form + zod, autoguardado, foco accesible, eventos de analítica), `POST /api/contact` con Turnstile, Supabase y Resend, el SQL de la tabla `leads` y los tests de §9.5 y §14.3. Variables según §4.3.

**Prompt 6 · SEO, rendimiento, accesibilidad y QA (F6)**
> Implementa §10–§15: `buildMetadata`, JSON-LD, `sitemap.ts`, `robots.ts`, `feed.xml`, `opengraph-image.tsx`, cabeceras de seguridad, `lighthouserc.json`, axe en Playwright y la degradación automática a hero estático. Ejecuta el checklist de §19 y devuelve un informe con lo que falta.

---

## 18. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| La producción del hero se retrasa | Alto | Desarrollar con frames de prueba (§16); fases independientes; el hero se sustituye sin tocar el código |
| Peso o memoria excesivos en móviles | Alto | Frames móviles propios y más ligeros, ventana de decodificación, versión estática en conexión lenta |
| Pin y barra de URL en iOS Safari | Medio | `ignoreMobileResize`, unidades `svh`, scroll nativo en táctil, pruebas en iPhone real |
| El fondo del vídeo no es blanco puro | Medio | `check-white.mjs` en CI + `mix-blend-mode: multiply` + `flatten` en el script |
| Accesibilidad frente a espectacularidad | Alto | Versión estática completa, bloque `sr-only`, enlace "Saltar la animación", texto real en HTML |
| Contenido inventado o sin verificar | Alto | Regla "solo datos reales"; ⚠️ visibles en `TODO.md`; revisión final del copy comercial |
| Dependencia de librerías (GSAP, Lenis) | Bajo | Encapsuladas en `lib/gsap.ts` y `SmoothScrollProvider`; revisar licencias antes del lanzamiento |
| RGPD y legales mal resueltos | Alto | Asesoría legal; analítica sin cookies; consentimiento explícito en el formulario |
| Parecido excesivo con la web de referencia | Medio | Copy, visuales, estructura de página y marca propios (§1.4) |
| SEO: contenido atrapado en el canvas | Medio | H1 y capítulos en HTML; JSON-LD; revisar indexación en Search Console |
| Rendimiento del scroll en gama baja | Medio | Degradación automática a hero estático (§11.2, punto 10) |

---

## 19. Checklist de lanzamiento

**Contenido**
- [ ] Nombre, dominio y razón social definitivos; `site.config.ts` sin `{{…}}`.
- [ ] Todo el copy revisado; **ningún ⚠️ pendiente** (precios, plazos, garantías, propiedad del código, soporte).
- [ ] Casos de estudio reales con permiso por escrito; logos solo autorizados.
- [ ] Equipo, fotos y bios completados.
- [ ] Al menos 3 artículos publicados en el blog.

**Hero**
- [ ] Material real cargado; `sequence:check` en verde en escritorio y móvil.
- [ ] `FRAME_KEYS` y `CHIPS` calibrados con el material real (§6.8).
- [ ] Versión estática, sin JS y conexión lenta verificadas.
- [ ] Póster = frame 1; transición póster → canvas imperceptible.

**Técnico**
- [ ] `build`, `lint`, tests e2e y axe en verde en CI.
- [ ] Variables de entorno de producción configuradas; claves de prueba fuera.
- [ ] Formulario probado de extremo a extremo en producción (lead en BD + email recibido).
- [ ] SPF/DKIM/DMARC válidos; entrega comprobada.
- [ ] Cabeceras de seguridad activas; CSP probada.
- [ ] 404 correcto y redirecciones aplicadas.

**SEO**
- [ ] Titles, descriptions, canonical y OG en todas las páginas; JSON-LD validado.
- [ ] `sitemap.xml` y `robots.txt` publicados y enviados a Search Console y Bing.
- [ ] Un solo H1 por página; alt en imágenes informativas.

**Rendimiento**
- [ ] LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 en móvil (laboratorio y dispositivo real).
- [ ] Memoria del hero dentro del presupuesto.

**Accesibilidad**
- [ ] Checklist §12 completo; prueba con VoiceOver y NVDA.
- [ ] Navegación por teclado completa, incluido el hero y los menús.

**Privacidad y legal**
- [ ] Política de privacidad, cookies y aviso legal revisadas por un profesional.
- [ ] Analítica sin cookies (o banner de consentimiento funcionando).
- [ ] Contratos de encargado de tratamiento firmados con los proveedores.

**Operación**
- [ ] Analítica recibiendo eventos (§13.1).
- [ ] Monitorización y copias activadas.
- [ ] Plan de publicación de contenidos para los primeros 90 días.

---

## Apéndice · Resumen de decisiones clave

1. **Concepto del hero:** "Del boceto al producto", 4 capítulos con texto real sobre una secuencia de frames en canvas controlada por scroll, sobre blanco puro.
2. **Técnica:** secuencia de frames WebP + canvas + GSAP ScrollTrigger + Lenis (no `video.currentTime`, no 3D en tiempo real en la v1).
3. **Producción:** ruta híbrida (Blender + UI en Figma + IA de apoyo) siguiendo la hoja de escenas de §7.3.
4. **Rendimiento:** póster como LCP, descarga progresiva tras el LCP, decodificación por ventana, frames móviles propios, versión estática como degradación.
5. **Accesibilidad:** texto real, bloque `sr-only`, enlace para saltar la animación, `prefers-reduced-motion` con hero estático completo.
6. **Stack:** Next.js + TypeScript + Tailwind + GSAP + Lenis + Supabase + Resend + Turnstile + Vercel.
7. **Identidad:** blanco `#FFFFFF`, tinta `#0B0B0F`, acento ultramar `#2B3BFF`, Geist + Instrument Serif cursiva (1–2 palabras por titular).
8. **Contenido:** 4 servicios, 2 páginas por audiencia, casos reales, proceso en 5 pasos, FAQ y laboratorio.
9. **Conversión:** asistente de 6 pasos + agenda de 15 min.
10. **Honestidad:** ningún dato, cliente o métrica inventados; todo lo no verificado, marcado con ⚠️.
11. **Referencia:** estructura inspirada en cometalabs.io; copy, visuales y marca 100 % originales.
12. **Siguiente paso:** cerrar §1.3, validar el moodboard del hero y arrancar F1 y F2 en paralelo.
