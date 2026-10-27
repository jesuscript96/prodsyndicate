/** Etiquetas legibles para los tags del frontmatter (los slugs se mantienen en las URLs y filtros). */
const labels: Record<string, string> = {
  mvp: 'MVP',
  producto: 'Producto',
  'software-a-medida': 'Software a medida',
  'no-code': 'No-code',
  automatizacion: 'Automatización',
  frontend: 'Front-end',
  animacion: 'Animación',
  proceso: 'Proceso',
};

export function tagLabel(tag: string): string {
  return labels[tag] ?? tag.replace(/-/g, ' ');
}
