import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { LegalMeta, PostMeta, ProjectCategory, ProjectMeta, ServiceSlug } from '@/content/types';
import { getServiceSummary } from '@/content/services';

/**
 * Lectura de contenido MDX (sincrónica a propósito: así las páginas quedan
 * 100 % estáticas en el modelo clásico de Next). Carpetas: content/blog,
 * content/projects, content/legal.
 */
const CONTENT_DIR = path.join(process.cwd(), 'content');

function listFiles(dir: string): string[] {
  const full = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => /\.mdx?$/.test(f) && !f.startsWith('_'))
    .sort();
}

function readSource(dir: string, slug: string): string | null {
  for (const ext of ['.mdx', '.md']) {
    const p = path.join(CONTENT_DIR, dir, `${slug}${ext}`);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  return null;
}

const slugOf = (file: string) => file.replace(/\.mdx?$/, '');

function toISODate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'string' && v) return v.slice(0, 10);
  return new Date(0).toISOString().slice(0, 10);
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

/* ───────────── Blog ───────────── */

export type PostEntry = { meta: PostMeta; content: string };

function toPostMeta(slug: string, data: Record<string, unknown>, content: string): PostMeta {
  return {
    slug,
    title: str(data.title, slug),
    description: str(data.description),
    date: toISODate(data.date),
    updated: data.updated ? toISODate(data.updated) : undefined,
    author: str(data.author),
    tags: strArr(data.tags),
    service: typeof data.service === 'string' ? (data.service as ServiceSlug) : undefined,
    cover: typeof data.cover === 'string' ? data.cover : undefined,
    draft: Boolean(data.draft),
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
  };
}

const hideDrafts = process.env.NODE_ENV === 'production';

export function getAllPosts(): PostMeta[] {
  return listFiles('blog')
    .map((file) => {
      const { data, content } = matter(readSource('blog', slugOf(file)) ?? '');
      return toPostMeta(slugOf(file), data, content);
    })
    .filter((p) => !(hideDrafts && p.draft))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): PostEntry | null {
  const src = readSource('blog', slug);
  if (!src) return null;
  const { data, content } = matter(src);
  const meta = toPostMeta(slug, data, content);
  if (hideDrafts && meta.draft) return null;
  return { meta, content };
}

export function getLatestPosts(n = 3): PostMeta[] {
  return getAllPosts().slice(0, n);
}

export function getPostsByService(service: ServiceSlug, n = 2): PostMeta[] {
  return getAllPosts()
    .filter((p) => p.service === service)
    .slice(0, n);
}

export function getAllTags(): string[] {
  return Array.from(new Set(getAllPosts().flatMap((p) => p.tags))).sort();
}

/* ───────────── Proyectos ───────────── */

export type ProjectEntry = { meta: ProjectMeta; content: string };

const CATEGORIES: ProjectCategory[] = ['mvp', 'empresa', 'automatizacion', 'creativo'];

function toProjectMeta(slug: string, data: Record<string, unknown>): ProjectMeta {
  const cover = (data.cover ?? {}) as Record<string, unknown>;
  const categories = strArr(data.categories).filter((c): c is ProjectCategory =>
    (CATEGORIES as string[]).includes(c),
  );
  const results = Array.isArray(data.results)
    ? (data.results as Record<string, unknown>[]).map((r) => ({ label: str(r.label), value: str(r.value) }))
    : undefined;
  const t = data.testimonial as Record<string, unknown> | undefined;
  return {
    slug,
    title: str(data.title, slug),
    client: str(data.client),
    year: Number(data.year) || new Date().getUTCFullYear(),
    categories,
    services: strArr(data.services),
    stack: strArr(data.stack),
    summary: str(data.summary),
    cover: { src: str(cover.src, '/og/poster-last.png'), alt: str(cover.alt) },
    results: results && results.length ? results : undefined,
    testimonial: t ? { quote: str(t.quote), author: str(t.author), role: str(t.role) } : undefined,
    isConcept: Boolean(data.isConcept),
    order: typeof data.order === 'number' ? data.order : undefined,
    featured: Boolean(data.featured),
  };
}

export function getAllProjects(): ProjectMeta[] {
  return listFiles('projects')
    .map((file) => {
      const { data } = matter(readSource('projects', slugOf(file)) ?? '');
      return toProjectMeta(slugOf(file), data);
    })
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || b.year - a.year);
}

export function getProjectBySlug(slug: string): ProjectEntry | null {
  const src = readSource('projects', slug);
  if (!src) return null;
  const { data, content } = matter(src);
  return { meta: toProjectMeta(slug, data), content };
}

export function getFeaturedProjects(n = 6): ProjectMeta[] {
  const all = getAllProjects();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, n);
}

/** Proyectos relacionados con un servicio (por categoría), excluyendo opcionalmente un slug. */
export function getProjectsForService(service: ServiceSlug, n = 2, exclude?: string): ProjectMeta[] {
  const cat = getServiceSummary(service)?.category;
  return getAllProjects()
    .filter((p) => p.slug !== exclude && (!cat || p.categories.includes(cat)))
    .slice(0, n);
}

export function getNextProject(slug: string): ProjectMeta | null {
  const all = getAllProjects();
  if (!all.length) return null;
  const i = all.findIndex((p) => p.slug === slug);
  return all[(i + 1) % all.length] ?? null;
}

/* ───────────── Legales ───────────── */

export type LegalEntry = { meta: LegalMeta; content: string };

export function getAllLegal(): LegalMeta[] {
  return listFiles('legal').map((file) => {
    const { data } = matter(readSource('legal', slugOf(file)) ?? '');
    return {
      slug: slugOf(file),
      title: str(data.title, slugOf(file)),
      description: str(data.description),
      updated: toISODate(data.updated),
    };
  });
}

export function getLegalBySlug(slug: string): LegalEntry | null {
  const src = readSource('legal', slug);
  if (!src) return null;
  const { data, content } = matter(src);
  return {
    meta: { slug, title: str(data.title, slug), description: str(data.description), updated: toISODate(data.updated) },
    content,
  };
}
