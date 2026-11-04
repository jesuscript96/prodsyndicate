import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EncajaLandingPage } from '@/components/encaja/landing';
import { encajaSlugs, getEncajaLanding } from '@/content/encaja';
import { buildMetadata } from '@/lib/seo';

/**
 * /encaja/tiempo · /encaja/crecer · /encaja/procesos: landings de los anuncios de «Encaja».
 * Sin indexar (no compiten con /empresas en buscadores) y fuera del sitemap.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return encajaSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const landing = getEncajaLanding(slug);
  if (!landing) return {};
  return buildMetadata({
    title: landing.meta.title,
    description: landing.meta.description,
    path: `/encaja/${landing.slug}`,
    image: landing.meta.og,
    noIndex: true,
  });
}

export default async function EncajaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landing = getEncajaLanding(slug);
  if (!landing) notFound();
  return <EncajaLandingPage landing={landing} />;
}
