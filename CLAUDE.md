# Producto-Digital · Web de desarrollo de productos digitales a medida

Sitio estático en **Next.js 16 (App Router) + TypeScript estricto + Tailwind v4 + GSAP + Lenis**, en español (`es`).
La fuente de verdad del proyecto es la guía: `docs/guia-web-productos-digitales.md` (2 556 líneas, con índice por secciones §).
Léela por secciones con `sed -n 'A,Bp'`; la línea de cada sección: §5 → 318, §6 → 486, §6.9 → 1182, §7 → 1295, §8 → 1607, §9 → 1895, §10 → 2060, §11 → 2154, §12 → 2211, §13 → 2244, §14 → 2289.

## Reglas de oro

1. **No inventes datos.** Nada de métricas, clientes, logos, testimonios ni cifras. Usa el copy exacto de la guía. Lo pendiente de negocio se deja con `{{LLAVES}}` (p. ej. `site.name` es `{{MARCA}}`) y se anota en `TODO.md` con ⚠️.
2. **Un gesto espectacular por pantalla**; el resto, silencio y precisión. Blanco `#FFFFFF` real, hairlines 1 px, radios 24 px, sombras `--shadow-card` / `--shadow-float`. Un único acento ultramar; `--signal` naranja solo decorativo (nunca texto).
3. **Un solo `<h1>` por página.** Titulares con 1–2 palabras en serif cursiva: `<em className="accent-word text-accent">palabra</em>` (o sin `text-accent`).
4. **Accesibilidad AA:** texto real en HTML, foco visible, teclado, `prefers-reduced-motion` respetado (usa `gsap.matchMedia`), `aria-*` correctos, alt descriptivo (vacío si decorativo).
5. **Rendimiento:** componentes de servidor por defecto; `'use client'` solo en animación, formularios y menús. Anima solo `transform`/`opacity`. `next/image` con `sizes`; `priority` solo en la imagen LCP.
6. **Tono:** cercano, preciso, sin jerga innecesaria; tuteo. Todo en español.

## Comandos (Next 16: `next lint` ya no existe)

- Dev server en el puerto **3200** (`npm run dev -- -p 3200`; el 3000 y el 3100 los usan otros proyectos de esta máquina).

- `npm run typecheck` → `tsc --noEmit` · `npm run lint` → `eslint .` · `npx eslint <ruta>` para un archivo.
- **No ejecutes `next build` ni `next dev` mientras otros agentes trabajan** (comparten `.next/`). Valida con `npx tsc --noEmit` y `npx eslint <tus archivos>`.
- Si `tsc` falla por tipos ajenos a tus archivos, ignóralo y asegúrate de que los tuyos no tengan errores (`npx tsc --noEmit 2>&1 | grep <tu-carpeta>`).

## Convenciones Next 16 que debes respetar

- `params` y `searchParams` son **Promises**: `export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; }`. Tipa las props explícitamente (no uses los helpers globales `PageProps`/`LayoutProps`, pueden no estar generados).
- Rutas dinámicas: `generateStaticParams()` + `notFound()` si no existe. Metadata con `generateMetadata` usando `buildMetadata` de `@/lib/seo`.
- `cacheComponents` está **desactivado** a propósito; la lectura de contenido es sincrónica (`lib/content.ts`) y las páginas son estáticas sin más.
- Importa GSAP SIEMPRE desde `@/lib/gsap` (`gsap`, `ScrollTrigger`, `SplitText`, `Flip`, `useGSAP`); nunca directamente de `gsap`.
- CSS co-localizado permitido: `import './mi-componente.css'` desde un componente (App Router lo admite). Tokens y clases globales en `app/globals.css` (no lo edites; añade tu CSS en tu propio archivo).
- Alias `@/*` → raíz del proyecto. Archivos `kebab-case`, componentes `PascalCase`.

## Tokens y clases disponibles (`app/globals.css`)

- Colores Tailwind: `bg-paper`, `bg-paper-2`, `text-ink`, `text-ink-2`, `text-ink-3`, `border-line`, `text-accent`, `bg-accent-soft`, `bg-signal`. Variables CSS equivalentes: `--paper`, `--ink`, `--line`, `--accent`, …
- Fuentes: `font-sans` (Geist), `font-serif` (Instrument Serif), `font-mono` (Geist Mono). Clase `.accent-word` = serif cursiva.
- Tipografía: `.display-xl` (H1 hero) · `.display-l` (H1 interiores) · `.h2` · `.h3` · `.h4` · `.body-l` · `.body` · `.label` (mono mayúsculas, `--ink-3`).
- Layout: `.wrap` (máx. 1280) · `.wrap--wide` (1440) · `.wrap--narrow` (820) · `.section` (padding `--section-y`) · `.section--tight` · `.hairline` · `.card` · `.card--soft` · `.content-auto`.
- Botones: `.btn .btn--primary|--secondary|--ghost [.btn--sm]` (usa el componente `Button`). Chips: `.chip [.chip--neutral|--outline]`.
- Motion: `--ease-out-expo`, `--ease-in-out-quart`, `--dur-micro` 160 ms, `--dur-ui` 320 ms, `--dur-reveal` 700 ms. GSAP: `expo.out` / `power3.out` / `none` (scrub). Stagger texto 0.06 s. Desplazamiento de entrada 24 px (nunca > 40).
- Breakpoint del hero: 900 px (`hero:` en Tailwind, `(min-width: 900px)` en CSS/matchMedia).
- `.prose` para contenido MDX. `--header-h` = 56 px (la píldora flota a `top: 16px`; las páginas interiores empiezan con `PageHero`, que ya reserva ese espacio).

## Componentes compartidos (import desde `@/components/...`)

| Componente | Import | Uso |
|---|---|---|
| `Button` | `ui/button` | `<Button href="/contacto" arrow analytics={{location:'home-services', label:'…'}}>` · `variant="primary|secondary|ghost"` · `size="sm"` · `arrow` o `arrow="up"` · `external` · sin `href` renderiza `<button>` |
| `LinkArrow` | `ui/link-arrow` | `<LinkArrow href="/proyectos">Ver todos</LinkArrow>` (`accent`, `external`) |
| `Chip` | `ui/chip` | `<Chip>UX / UI</Chip>` · `tone="neutral|outline"` · `live` (punto naranja) |
| `SectionLabel` | `ui/section-label` | `<SectionLabel n="01">Servicios</SectionLabel>` → `01 — Servicios` |
| `Reveal` | `ui/reveal` | `<Reveal as="p" delay={0.1} className="…">` fade+y 24 → 0 al 85 % del viewport, una vez |
| `SplitReveal` | `ui/split-reveal` | `<SplitReveal as="h2" className="h2">Titular con <em className="accent-word">acento</em></SplitReveal>` · `trigger={false}` para entrar al montar |
| `ImageReveal` | `ui/image-reveal` | Envuelve una imagen (hijo directo = lo que escala): `<ImageReveal radius={24} className="relative aspect-[4/3]"><Image fill … /></ImageReveal>` |
| `Marquee` | `ui/marquee` | `<Marquee items={['Next.js','React']} label="Tecnologías" duration={40} />` |
| `FaqAccordion` | `ui/faq-accordion` | `<FaqAccordion items={faq} headingLevel={3} />` (añade `<JsonLd data={faqJsonLd(items)} />` aparte) |
| `JsonLd` | `ui/json-ld` | `<JsonLd data={…} />` |
| `Breadcrumbs` | `ui/breadcrumbs` | `<Breadcrumbs items={[{name:'Servicios', href:'/servicios'}, {name:'MVP', href:'/servicios/mvp'}]} />` (incluye JSON-LD; no pongas Inicio) |
| `ServiceIcon` | `ui/service-icon` | `<ServiceIcon name={service.icon} />` |
| `ServiceCard` | `ui/service-card` | `<ServiceCard service={summary} />` |
| `ProjectCard` | `ui/project-card` | `<ProjectCard project={meta} sizes="…" />` (muestra "Caso de concepto" si `isConcept`) |
| `StatCounter` | `ui/stat-counter` | Solo con datos reales |
| `PageHero` | `ui/page-hero` | Hero interior: `<PageHero label="Servicios" title={<>Todo lo necesario para <em className="accent-word text-accent">construir</em>…</>} intro="…" cta={{label, href}} secondary={…} visual={<Componente/>} />` |
| `CtaBand` | `ui/cta-band` | Banda final de TODA página: `<CtaBand />` (defaults de la guía) o con `title`, `text`, `primary`, `secondary`, `echo={false}` |

Layout ya montado en `app/layout.tsx`: skip-link, `SmoothScrollProvider` (Lenis), `RouteFocus`, `Header`, `<main id="contenido">`, `Footer`, JSON-LD Organization/WebSite. Las páginas solo devuelven su contenido (secciones).

## Contenido y datos (`content/`, `lib/content.ts`)

- `content/types.ts`: `ServiceSummary`, `FaqItem`, `PostMeta`, `ProjectMeta`, `LegalMeta`, `ProcessStep`, `Cta`, `ServiceSlug`, `ProjectCategory`.
- `content/services.ts`: `services` (4 resúmenes), `getServiceSummary(slug)`, `categoryLabels`, `getServiceByCategory`.
- `content/faq.ts` (`faq`, 8 preguntas) · `content/nav.ts` (`mainNav`, `companyNav`, `legalNav`, `audienceNav`, `primaryCta`, `secondaryCta`) · `content/process.ts` (`processSteps`, `techStack`).
- Loaders sincrónicos (solo servidor): `getAllPosts()`, `getPostBySlug(slug)` → `{meta, content}`, `getLatestPosts(n)`, `getPostsByService(slug, n)`, `getAllTags()`, `getAllProjects()`, `getProjectBySlug(slug)`, `getFeaturedProjects(n)`, `getProjectsForService(slug, n)`, `getNextProject(slug)`, `getAllLegal()`, `getLegalBySlug(slug)`.
- Frontmatter blog (`content/blog/*.mdx`): `title, description, date (YYYY-MM-DD), updated, author, tags[], service (slug de servicio), cover, draft`.
- Frontmatter proyecto (`content/projects/*.mdx`): `title, client, year, categories[] (mvp|empresa|automatizacion|creativo), services[], stack[], summary, cover {src, alt}, results[] (solo reales), testimonial {quote, author, role}, isConcept, order, featured`.
- Frontmatter legal (`content/legal/*.mdx`): `title, description, updated`.
- MDX se renderiza con `next-mdx-remote/rsc` (`compileMDX` / `MDXRemote`) desde el servidor.

## SEO y analítica

- `buildMetadata({ title, description, path, image?, type?, noIndex? })` de `@/lib/seo` (si el título ya incluye la marca no duplica el sufijo). Helpers JSON-LD: `organizationJsonLd`, `websiteJsonLd`, `breadcrumbJsonLd`, `faqJsonLd`, `serviceJsonLd`, `articleJsonLd`, `absoluteUrl`.
- `track(evento, props)` de `@/lib/analytics`: `hero_chapter`, `cta_click`, `form_start`, `form_step`, `form_submit`, `form_error`, `calendar_open`, `scroll_depth`. Nunca datos personales.

## Contratos entre módulos

- **Hero ↔ Header:** el hero pone `document.body.dataset.heroPinned = 'true'` mientras está fijado (y lo borra al salir); el header no se oculta mientras tanto.
- **Hero ↔ Home:** el hero incluye un enlace "Saltar la animación" a `#inicio-contenido`; la primera sección de la home tras el hero lleva `id="inicio-contenido"`.
- **Historias por scroll (motor común):** `components/story/scroll-story.tsx` + `lib/story.ts` (tipos, `DEFAULT_FRAME_KEYS`, `CHAPTER_WINDOWS`, `progressToFrame`, `serviceSequence`). La home la usa vía `components/hero/hero-story.tsx` (`HOME_STORY` en `hero.config.ts`); cada página de servicio vía `components/services/service-story.tsx` (`SERVICE_STORIES` en `content/service-stories.ts`). Para cambiar textos, etiquetas o tiempos de una historia, edita su configuración, no el motor.
- **Escenas 3D (Blender):** `scripts/hero/studio.py` (módulo compartido) + una escena por historia: home `scripts/hero/scene.py`, servicios `scripts/hero/scenes/<slug>.py` con sus texturas `scripts/hero/textures/<slug>.mjs`. Render de un servicio: `npm run hero:render:service -- <slug>` (≈ 30 min). Frames de servicio en `public/sequence/<slug>/v1/`.
- **Secuencia de frames:** `public/sequence/v2/desktop/f_0001.webp … f_0150.webp` (1200²), `public/sequence/v2/mobile/f_0001.webp … f_0090.webp` (720×900), `poster-first.webp`, `poster-first-mobile.webp`, `poster-last.webp`; `public/og/poster-last.png` (1200×1200) para OG y portadas por defecto.
- **Formulario:** Turnstile y el embed de agenda solo se cargan en `/contacto`. El ancla `/contacto#agenda` debe existir.
- **Propiedad de archivos:** cada agente toca SOLO sus archivos; `app/globals.css`, `app/layout.tsx`, `components/ui/*`, `components/layout/*`, `lib/*` (salvo lo asignado) y `content/{types,services,faq,nav,process}.ts` son de la base. Si te falta algo ahí, créalo en tu carpeta y anótalo en tu informe final.
