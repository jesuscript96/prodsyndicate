import type { FaqItem } from './types';
import { faq } from './faq';
import { secondaryCta } from './nav';
import { serviceDetails } from './services-detail';

/**
 * /servicios/automatizacion-n8n-make: página de servicio para quien busca una agencia de
 * automatización con n8n y Make. Mismo patrón que /empresas (PageHero + secciones + FAQ + CTA).
 * El copy sale de lo que ya dice la web (servicio Automatización e IA, artículo de n8n/Make,
 * FAQ global): sin cifras, precios ni clientes nuevos.
 */

const automatizacion = serviceDetails['automatizacion-ia'];

const pick = (q: string) => faq.find((f) => f.q === q) ?? automatizacion.faq.find((f) => f.q === q);

export const n8nMakePage = {
  meta: {
    title: 'Agencia de automatización con n8n y Make',
    description:
      'Automatizamos los procesos de tu empresa con n8n y Make: leads, alta de clientes, facturación e informes conectados entre tus herramientas, con alertas y registro.',
    path: '/servicios/automatizacion-n8n-make',
  },
  crumbs: [
    { name: 'Servicios', href: '/servicios' },
    { name: 'Automatización e IA', href: '/servicios/automatizacion-ia' },
    { name: 'n8n y Make', href: '/servicios/automatizacion-n8n-make' },
  ],
  hero: {
    label: 'Automatización con n8n y Make',
    h1: { before: 'Automatización con n8n y Make: procesos que se hacen ', accent: 'solos', after: '.' },
    intro:
      'Diseñamos, construimos y mantenemos flujos en n8n y Make que conectan las herramientas que ya usáis y quitan de en medio el trabajo de copiar datos de un sitio a otro.',
    cta: secondaryCta,
    secondary: { label: 'Cómo trabajamos', href: '/proceso' },
  },
  problems: {
    label: 'Qué problemas resuelve',
    title: { before: 'Qué problemas ', accent: 'resuelve', after: '' },
    intro: 'Procesos repetitivos, frecuentes y con reglas claras: los que casi siempre merece la pena automatizar.',
    items: [
      {
        title: 'Leads que se quedan en el formulario',
        text: 'Cada lead de la web entra en el CRM sin duplicados, se asigna a quien le toca y el equipo recibe un aviso con el enlace a la ficha.',
      },
      {
        title: 'Altas de clientes que pasan por cuatro herramientas',
        text: 'CRM, carpeta, programa de facturación y correo de bienvenida, siempre en el mismo orden y con los mismos datos.',
      },
      {
        title: 'Facturas y cobros a mano',
        text: 'Al cerrar una venta se crea la factura, se envía y se registra el cobro, sin copiar datos de un programa a otro.',
      },
      {
        title: 'Informes que alguien recopila cada semana',
        text: 'Los datos de varias herramientas se reúnen y llegan al equipo de forma automática, el día que toca.',
      },
    ],
  },
  forWho: {
    label: 'Para quién es',
    title: { before: 'Para ', accent: 'quién', after: ' es' },
    items: [
      { title: 'Equipos que copian datos entre herramientas', text: 'Hojas de cálculo, correo, CRM y facturación que no se hablan entre sí.' },
      { title: 'Operaciones, ventas y atención al cliente saturadas', text: 'Tareas pequeñas que se repiten con cada cliente, cada pedido o cada consulta.' },
      { title: 'Empresas que quieren usar IA sin perderse', text: 'Clasificar, extraer o resumir dentro del flujo, solo donde aporta y con revisión humana.' },
    ],
  },
  choose: {
    label: 'n8n, Make o algo más',
    title: { before: '¿n8n o Make? ', accent: 'Lo que encaje', after: '' },
    intro: 'Elegimos la herramienta según quién va a mantener el flujo, el volumen y dónde tienen que vivir los datos.',
    items: [
      {
        title: 'Make',
        text: 'Cuando lo va a mantener el propio equipo sin perfil técnico y los flujos son sencillos.',
      },
      {
        title: 'n8n',
        text: 'Cuando hay volumen, lógica compleja o requisitos sobre dónde viven los datos: se puede alojar en tu propio servidor y admite código dentro del flujo.',
      },
      { title: 'Power Automate', text: 'Cuando la empresa ya trabaja en Microsoft 365.' },
      {
        title: 'Código',
        text: 'Cuando hace falta más control, rendimiento o lógica compleja. A menudo, una combinación con n8n o Make.',
      },
    ],
    guide: { label: 'Leer la guía: automatizar procesos con n8n o Make', href: '/blog/automatizar-procesos-con-n8n-o-make' },
  },
  howWeWork: {
    label: 'Cómo trabajamos',
    title: { before: 'Cómo lo ', accent: 'hacemos', after: '' },
    items: automatizacion.steps.map((s, i) => ({ n: `0${i + 1}`, title: s.title, text: s.text })),
  },
  standards: {
    label: 'Lo que lleva cada flujo',
    title: { before: 'Lo que no se ve, ', accent: 'también', after: '' },
    intro: 'Una automatización bien hecha se nota en las partes que no se ven.',
    items: [
      { title: 'Sin duplicados', text: 'Si el mismo evento llega dos veces, el resultado es el mismo: no dos facturas, no dos leads.' },
      { title: 'Reintentos con cabeza', text: 'Si un servicio no responde, se reintenta un número limitado de veces y, si sigue fallando, se avisa.' },
      { title: 'Alertas útiles', text: 'Qué flujo, qué paso y qué dato ha fallado, con un enlace para relanzarlo desde ese punto.' },
      { title: 'Registro de ejecuciones', text: 'Puedes ver qué pasó con un lead o un cliente concreto semanas después.' },
      { title: 'Credenciales gestionadas', text: 'Nunca en texto plano dentro del flujo; con acceso restringido y rotación posible.' },
      { title: 'Documentación y formación', text: 'Qué hace cada flujo, qué lo dispara, qué servicios toca y quién lo mantiene.' },
    ],
  },
  cases: {
    label: 'Casos',
    title: { before: 'Casos ', accent: 'relacionados', after: '' },
  },
  faq: [
    {
      q: '¿Trabajáis con n8n o con Make?',
      a: 'Con los dos, y con Power Automate cuando la empresa ya vive en Microsoft 365. Make cuando lo va a mantener tu equipo sin perfil técnico y los flujos son sencillos; n8n cuando hay volumen, lógica compleja o requisitos sobre dónde viven los datos.',
    },
    pick('¿Qué procesos merece la pena automatizar?'),
    pick('¿Qué pasa si falla una automatización?'),
    pick('¿Cuánto cuesta un proyecto?'),
  ].filter((f): f is FaqItem => Boolean(f)) as readonly FaqItem[],
  service: {
    name: 'Automatización con n8n y Make',
    serviceType: 'Automatización de procesos con n8n y Make',
  },
  cta: { primary: secondaryCta, secondary: { label: 'Cuéntanos tu proceso', href: '/contacto' } },
} as const;
