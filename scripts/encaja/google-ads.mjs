#!/usr/bin/env node
/**
 * Campaña de búsqueda de Google Ads «Encaja»: textos, palabras clave y recursos, con los límites
 * de caracteres de Google comprobados. Genera los archivos para Google Ads Editor y la tabla de
 * textos que enlaza docs/encaja/google-ads.md.
 *   npm run encaja:google-ads  → docs/encaja/google-ads/{textos.md, anuncios.csv, palabras-clave.csv, negativas.txt}
 *
 * Sin cifras inventadas: los números que aparecen (30 minutos, 2 a 4 semanas, desde 3.000 € en
 * 6 meses) son los del negocio, los mismos de las landings (content/encaja.ts).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'docs/encaja/google-ads');
const SITE = 'https://www.automatoagency.art';

export const CAMPAIGN = 'Encaja · Búsqueda · ES';

/** Títulos comunes a los tres grupos (máx. 30 caracteres). */
const COMMON_HEADLINES = [
  'Software a medida',
  'Llamada de 30 min gratis',
  'Resultados en 2 a 4 semanas',
  'Desde 3.000 € en 6 meses',
  'Propuesta cerrada en días',
  'Agenda una llamada',
  'Software que encaja contigo',
];
const COMMON_DESCRIPTION = 'Llamada de 30 minutos, gratis y sin compromiso. Sales con una idea de cómo quedaría.';

export const AD_GROUPS = [
  {
    name: 'Tiempo · trabajo manual',
    landing: '/encaja/tiempo',
    paths: ['sin-excel', 'a-medida'],
    intent: 'Quien busca quitarse trabajo manual, salir del Excel o dejar de perseguir pedidos y stock.',
    keywords: [
      'automatizar tareas administrativas',
      'automatizar excel empresa',
      'sustituir excel por software',
      'alternativa a excel para empresas',
      'software gestion pedidos a medida',
      'programa control de stock a medida',
      'gestion de turnos y vacaciones empresa',
      'reducir trabajo manual empresa',
      'automatizar trabajo repetitivo',
    ],
    headlines: [
      'Tu negocio no cabe en un Excel',
      'Deja de ser el administrativo',
      'Recupera tus horas',
      'Automatiza el trabajo manual',
      'Copiar y pegar no escala',
      'Pedidos y stock sin Excel',
      'Todo en un solo sitio',
      'Sabes cómo va todo',
    ],
    pinned: ['Tu negocio no cabe en un Excel', 'Deja de ser el administrativo', 'Recupera tus horas'],
    descriptions: [
      'Nos llevamos la operativa que hoy te come el día para que vuelvas a dirigir tu empresa.',
      'Pedidos, stock y proyectos en un solo sitio y al día. Sabes cómo va todo sin preguntar.',
      'Empezamos por lo que más tiempo te quita. Primer resultado en 2 a 4 semanas.',
    ],
    images: ['11-no-son-un-sistema', '10-datos-de-un-sitio-a-otro', '28-no-cabe-en-una-hoja'],
  },
  {
    name: 'Procesos · automatización e integraciones',
    landing: '/encaja/procesos',
    paths: ['automatizar', 'procesos'],
    intent: 'Quien busca automatizar procesos, conectar sus programas o aplicar IA en su empresa.',
    keywords: [
      'automatizacion de procesos empresariales',
      'automatizar procesos empresa',
      'integrar erp y crm',
      'integracion odoo hubspot',
      'conectar aplicaciones empresa',
      'automatizacion con ia para empresas',
      'inteligencia artificial para empresas',
      'consultor n8n',
      'automatizaciones make empresa',
    ],
    headlines: [
      'Automatiza tus procesos',
      'Tu ERP, CRM y correo, unidos',
      'Integra lo que ya usas',
      'IA solo donde aporta',
      'Hablemos de tus procesos',
      'Que se haga solo',
      'Conecta Odoo, HubSpot y Excel',
      'Automatización con IA',
    ],
    pinned: ['Automatiza tus procesos', 'Tu ERP, CRM y correo, unidos', 'Hablemos de tus procesos'],
    descriptions: [
      'Lo que entra por un programa aparece en el otro, sin que nadie copie datos a mano.',
      'Primero entendemos cómo trabajáis; después automatizamos lo que más se repite.',
      'IA solo donde de verdad ahorra tiempo. Partimos de las herramientas que ya usas.',
    ],
    images: ['33-erp-crm-correo', '06-herramientas-internas'],
  },
  {
    name: 'Crecer · software a medida',
    landing: '/encaja/crecer',
    paths: ['software', 'a-medida'],
    intent: 'Quien busca software a medida o digitalizar una empresa que ha crecido.',
    keywords: [
      'software a medida para empresas',
      'desarrollo de software a medida',
      'aplicacion a medida para empresa',
      'programa a medida para empresa',
      'herramientas internas a medida',
      'digitalizar empresa',
      'digitalizacion de pymes',
      'software para pymes a medida',
    ],
    headlines: [
      'Tu empresa ha crecido',
      'Crece sin que todo pase por ti',
      'Software a medida para pymes',
      'Digitalizar es invertir',
      'Herramientas a tu medida',
      'Deja los procesos manuales',
      'Un sistema, una versión',
      'Empieza por un solo proceso',
    ],
    pinned: ['Tu empresa ha crecido', 'Crece sin que todo pase por ti', 'Software a medida para pymes'],
    descriptions: [
      'Ordenamos cómo trabaja tu equipo hoy, empezando por lo que más tiempo os quita.',
      'Tu equipo da abasto y tú no tienes que estar en todo. Primer resultado en 2 a 4 semanas.',
      'Desde 3.000 € en 6 meses, con propuesta cerrada antes de empezar.',
    ],
    images: ['18-empresa-ha-crecido', '25-software-que-encaja'],
  },
];

/**
 * Palabras negativas de campaña: búsquedas de quien no va a contratar. Las de una palabra van en
 * concordancia amplia; las de varias, entre comillas (frase), para no bloquear búsquedas como
 * «automatizar trabajo de oficina» por llevar «trabajo» y «de» sueltas.
 */
export const NEGATIVES = [
  'gratis', 'gratuito', 'curso', 'cursos', 'formacion', 'master', 'tutorial', 'aprender', '"como hacer"',
  'plantilla', 'plantillas', 'descargar', 'pdf', 'empleo', '"trabajo de"', '"ofertas de trabajo"', 'sueldo',
  'salario', 'practicas', 'oposiciones', '"que es"', 'definicion', 'ejemplos', 'login', '"iniciar sesion"',
  'soporte', 'telefono', 'certificacion', 'universidad', 'grado', 'chatgpt', 'wordpress', '"tienda online"',
  'juegos', '"open source"', 'github',
];

export const SITELINKS = [
  { text: 'Cómo trabajamos', url: '/proceso', d1: 'De la llamada al resultado', d2: 'Propuesta cerrada en días' },
  { text: 'Software a medida', url: '/servicios/software-a-medida', d1: 'Hecho a tu forma de trabajar', d2: 'Con lo que ya usas' },
  { text: 'Automatización e IA', url: '/servicios/automatizacion-ia', d1: 'Lo repetitivo, que vaya solo', d2: 'IA solo donde aporta' },
  { text: 'Quiénes somos', url: '/nosotros', d1: 'Quién está detrás', d2: 'Cerca, rápido y claro' },
];

export const CALLOUTS = [
  'Llamada gratis de 30 min',
  'Propuesta cerrada en días',
  'Resultados en 2-4 semanas',
  'Desde 3.000 € en 6 meses',
  'Con lo que ya usas',
  'Hecho a tu medida',
];

export const SNIPPET = {
  header: 'Servicios',
  values: ['Automatizaciones', 'Integraciones', 'Herramientas internas', 'Paneles de gestión', 'Asistentes de IA'],
};

/** Sufijo de URL final (nivel de campaña). Los utm_* los guarda la web y viajan con la reserva. */
export const FINAL_URL_SUFFIX =
  'utm_source=google&utm_medium=cpc&utm_campaign=encaja-busqueda&utm_content={adgroupid}&utm_term={keyword}';

/* ───────────── Comprobación de límites ───────────── */

const LIMITS = { headline: 30, description: 90, path: 15, sitelink: 25, sitelinkDesc: 35, callout: 25, snippet: 25 };
const len = (s) => [...s].length;
let errors = 0;
const check = (kind, s) => {
  if (len(s) > LIMITS[kind]) {
    errors++;
    console.error(`[google-ads] ${kind} demasiado largo (${len(s)}/${LIMITS[kind]}): ${s}`);
  }
};

for (const g of AD_GROUPS) {
  g.allHeadlines = [...g.headlines, ...COMMON_HEADLINES];
  g.allDescriptions = [...g.descriptions, COMMON_DESCRIPTION];
  const fail = (msg) => {
    errors++;
    console.error(`[google-ads] ${g.name}: ${msg}`);
  };
  if (g.allHeadlines.length > 15) fail('más de 15 títulos');
  if (g.allDescriptions.length > 4) fail('más de 4 descripciones');
  if (new Set(g.allHeadlines).size !== g.allHeadlines.length) fail('títulos repetidos');
  g.allHeadlines.forEach((h) => check('headline', h));
  g.allDescriptions.forEach((d) => check('description', d));
  g.paths.forEach((p) => check('path', p));
  g.pinned.filter((p) => !g.headlines.includes(p)).forEach((p) => fail(`fijado que no existe: ${p}`));
}
SITELINKS.forEach((s) => {
  check('sitelink', s.text);
  check('sitelinkDesc', s.d1);
  check('sitelinkDesc', s.d2);
});
CALLOUTS.forEach((c) => check('callout', c));
SNIPPET.values.forEach((v) => check('snippet', v));

/* ───────────── Salida ───────────── */

mkdirSync(OUT, { recursive: true });
const csv = (rows) => rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';

// Palabras clave: frase y exacta por grupo (formato de columnas de Google Ads Editor).
const kw = [['Campaign', 'Ad group', 'Keyword', 'Criterion Type', 'Final URL']];
for (const g of AD_GROUPS) {
  for (const k of g.keywords) {
    kw.push([CAMPAIGN, g.name, k, 'Phrase', SITE + g.landing]);
    kw.push([CAMPAIGN, g.name, k, 'Exact', SITE + g.landing]);
  }
}
writeFileSync(path.join(OUT, 'palabras-clave.csv'), csv(kw));

// Anuncios de búsqueda adaptables: un anuncio por grupo.
const adHead = ['Campaign', 'Ad group', 'Ad type', 'Final URL', 'Path 1', 'Path 2'];
for (let i = 1; i <= 15; i++) adHead.push(`Headline ${i}`, `Headline ${i} position`);
for (let i = 1; i <= 4; i++) adHead.push(`Description ${i}`);
const ads = [adHead];
for (const g of AD_GROUPS) {
  const row = [CAMPAIGN, g.name, 'Responsive search ad', SITE + g.landing, g.paths[0], g.paths[1]];
  for (let i = 0; i < 15; i++) {
    const h = g.allHeadlines[i] ?? '';
    row.push(h, g.pinned.includes(h) ? '1' : '');
  }
  for (let i = 0; i < 4; i++) row.push(g.allDescriptions[i] ?? '');
  ads.push(row);
}
writeFileSync(path.join(OUT, 'anuncios.csv'), csv(ads));
writeFileSync(path.join(OUT, 'negativas.txt'), NEGATIVES.join('\n') + '\n');

const table = (items) => `| Texto | Caracteres |\n|---|---|\n${items.map((t) => `| ${t} | ${len(t)} |`).join('\n')}`;
const md = `# Campaña «${CAMPAIGN}» · textos y palabras clave

Generado con \`npm run encaja:google-ads\` desde \`scripts/encaja/google-ads.mjs\`. No edites este archivo a mano: cambia el script y vuelve a generarlo. Todos los textos están dentro de los límites de Google.

${AD_GROUPS.map(
  (g) => `## ${g.name}

- **URL final:** ${SITE}${g.landing}
- **Ruta visible:** automatoagency.art/${g.paths.join('/')}
- **Intención:** ${g.intent}
- **Imágenes:** ${g.images.map((id) => `\`${id}\``).join(', ')} (en \`assets/encaja/google-ads/imagenes/\`, formatos 1:1 y 1,91:1)

**Palabras clave** (concordancia de frase y exacta)

${g.keywords.map((k) => `- \`"${k}"\` · \`[${k}]\``).join('\n')}

**Títulos** (fijados en la posición 1: ${g.pinned.map((p) => `«${p}»`).join(', ')})

${table(g.allHeadlines)}

**Descripciones**

${table(g.allDescriptions)}
`,
).join('\n')}
## Recursos de campaña

**Enlaces de sitio**

| Texto | URL | Línea 1 | Línea 2 |
|---|---|---|---|
${SITELINKS.map((s) => `| ${s.text} | ${SITE}${s.url} | ${s.d1} | ${s.d2} |`).join('\n')}

**Textos destacados**

${table(CALLOUTS)}

**Fragmento estructurado** · ${SNIPPET.header}: ${SNIPPET.values.join(' · ')}

**Palabras negativas** (\`negativas.txt\`, a nivel de campaña; las de varias palabras, en concordancia de frase)

${NEGATIVES.map((n) => `\`${n}\``).join(' · ')}

**Sufijo de URL final** (a nivel de campaña)

\`\`\`
${FINAL_URL_SUFFIX}
\`\`\`
`;
writeFileSync(path.join(OUT, 'textos.md'), md);

console.log(errors ? `[google-ads] ${errors} problemas` : '[google-ads] todo dentro de los límites');
process.exitCode = errors ? 1 : 0;
