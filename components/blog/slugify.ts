import { isValidElement, type ReactNode } from 'react';

export type TocItem = { id: string; text: string; level: 2 | 3 };

/** Slug estable y legible a partir de un texto (sin acentos, minúsculas, guiones). */
export function slugify(text: string): string {
  const s = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return s || 'seccion';
}

/** Generador de ids únicos dentro de un documento (encabezados repetidos → `-2`, `-3`…). */
export function createSlugger() {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const base = slugify(text);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

/** Texto plano de un árbol de hijos React (para el slug de un encabezado con `code`, `em`, etc.). */
export function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

function stripInline(md: string): string {
  return md
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .trim();
}

/**
 * Encabezados h2/h3 de un MDX (fuera de bloques de código), con los MISMOS ids
 * que generan los componentes `h2`/`h3` de `createMdxComponents()`. Sirve para
 * pintar el índice en el servidor sin esperar al DOM (sin CLS); el cliente lo
 * sincroniza después con los encabezados renderizados.
 */
export function extractHeadings(source: string): TocItem[] {
  const slug = createSlugger();
  const items: TocItem[] = [];
  let inFence = false;
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (!m) continue;
    const text = stripInline(m[2]);
    items.push({ id: slug(text), text, level: m[1].length === 2 ? 2 : 3 });
  }
  return items;
}
