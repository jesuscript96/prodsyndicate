# Campaña «Encaja» · dónde está todo

«Encaja» es la campaña de AUTOMATO dirigida a dueños de empresas de 10 a 50 personas que pierden tiempo en procesos manuales. El mensaje es software hecho a la medida de su forma de trabajar. La primera fase es solo Google Ads, en la Red de Búsqueda.

Este repositorio es **público**. Las cifras internas del negocio, como el presupuesto de anuncios, los objetivos o las respuestas del discovery, no se guardan aquí.

## En producción

| Qué | URL |
|---|---|
| Landing «Tiempo»: trabajo manual | https://www.automatoagency.art/encaja/tiempo |
| Landing «Decisión»: empresa que ha crecido | https://www.automatoagency.art/encaja/crecer |
| Landing «Camino»: procesos e integraciones | https://www.automatoagency.art/encaja/procesos |
| One pager de cada landing | https://www.automatoagency.art/encaja/presentacion-tiempo.pdf · [crecer](https://www.automatoagency.art/encaja/presentacion-crecer.pdf) · [procesos](https://www.automatoagency.art/encaja/presentacion-procesos.pdf) |

Las landings no se indexan en buscadores y no salen en el sitemap. Despliega Vercel desde la rama `main`.

## En este repositorio

| Qué | Dónde | Cómo se regenera |
|---|---|---|
| **Texto de las landings y de los one pagers** (fuente de verdad) | `content/encaja.ts` | |
| Componentes y ruta de las landings | `components/encaja/` · `app/(campaign)/encaja/[slug]/page.tsx` | |
| Imágenes del hero y vista previa para compartir | `public/encaja/hero-*.webp` · `public/encaja/og-*.png` | |
| One pagers A4 en PDF | `public/encaja/presentacion-*.pdf` | `npm run encaja:presentaciones` |
| Agenda con Google Calendar y Meet | `lib/agenda/` · `app/api/agenda/` · `components/agenda/` | Configuración: [agenda-google.md](../agenda-google.md) |
| **Campaña de Google Ads**: guía | [google-ads.md](google-ads.md) | |
| Campaña de Google Ads: textos, palabras clave y CSV | [google-ads/](google-ads/) | `npm run encaja:google-ads` |
| Imágenes de Google Ads sin logotipo y logotipos | `assets/encaja/google-ads/` | |
| Banco de 37 mensajes y los 11 elegidos | [anuncios/mensajes.md](anuncios/mensajes.md) | |
| Textos de la primera tanda para Meta y Google | [anuncios/textos-meta-google.md](anuncios/textos-meta-google.md) | |
| Definición de cada creatividad: titular, subtítulo y visual | [anuncios/creatividades.json](anuncios/creatividades.json) | |
| Formulario de discovery (sin respuestas) | [discovery.html](discovery.html) | |
| Propuesta inicial de las landings, histórica | [propuesta-landings.md](propuesta-landings.md) | |
| Pendientes antes de lanzar | `TODO.md`, sección «Campaña Encaja» | |

## Fuera del repositorio

| Qué | Dónde | Nota |
|---|---|---|
| Anuncios en todos los formatos: 1:1, 4:5, 9:16 y 1,91:1, con y sin titular, más un ZIP | Mac del equipo: `Producto-Digital/.claude/worktrees/product-syndicate-promo-video-6099d4/assets/promo/ads/` | Sin guardar en git (23 MB). Conviene subirlo a una carpeta compartida |
| Plantilla y generador de anuncios | Mismo worktree: `scripts/promo/ads/` | Sin guardar en git |
| Vídeo «Encaja» de 25 s, con y sin voz, y guion de locución | Mismo worktree: `assets/promo/automato-empresas-25s*.mp4` · `scripts/promo/guiones-locucion.md` | Los vídeos pesan demasiado para git |
| Respuestas del discovery | Página privada en Claude: https://claude.ai/artifact/RUCY6soSkjKmTP4XzbsQWa | Solo la ve su dueño |
| Medición | Google Tag Manager GTM-K3ZHSP9S · GA4 G-MHXH3R4RX3 | La reserva envía el evento `generate_lead` |

## Estado

- **Hecho:** las landings, los one pagers y la estructura de la campaña de búsqueda.
- **Falta para lanzar:**
  - las variables de Google Calendar y Turnstile en Vercel;
  - la conversión «Llamada reservada» en Google Ads y Tag Manager;
  - crear la campaña.

  Todo está detallado en [google-ads.md](google-ads.md), en el apartado «Antes de lanzar».
