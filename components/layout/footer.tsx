import Link from 'next/link';
import { site } from '@/site.config';
import { services } from '@/content/services';
import { audienceNav, companyNav, legalNav } from '@/content/nav';

const socials = [
  { label: 'LinkedIn', href: site.social.linkedin },
  { label: 'X', href: site.social.x },
  { label: 'GitHub', href: site.social.github },
].filter((s) => s.href);

/** Footer de 4 columnas + franja inferior (§3.2). */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="hairline bg-paper">
      <div className="wrap grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:py-20">
        <div className="grid content-start gap-4">
          <Link href="/" className="inline-flex items-center gap-2 font-medium" aria-label={`${site.name}, inicio`}>
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
              <path d="M3 15.5C5.5 9 9 5 15 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <circle cx="16.5" cy="15.5" r="3.5" fill="var(--accent)" />
            </svg>
            {site.name}
          </Link>
          <p className="max-w-[32ch] text-ink-2">{site.tagline}</p>
          <a href={`mailto:${site.email}`} className="link-arrow w-fit text-accent">
            {site.email}
          </a>
        </div>

        <nav aria-label="Servicios" className="grid content-start gap-3">
          <p className="label">Servicios</p>
          {services.map((s) => (
            <Link key={s.slug} href={`/servicios/${s.slug}`} className="text-ink-2 no-underline hover:text-ink">
              {s.title}
            </Link>
          ))}
          <div className="mt-2 grid gap-3">
            {audienceNav.map((item) => (
              <Link key={item.href} href={item.href} className="text-ink-2 no-underline hover:text-ink">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Compañía" className="grid content-start gap-3">
          <p className="label">Compañía</p>
          {companyNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-ink-2 no-underline hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Legal" className="grid content-start gap-3">
          <p className="label">Legal</p>
          {legalNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-ink-2 no-underline hover:text-ink">
              {item.label}
            </Link>
          ))}
          {socials.length > 0 && (
            <>
              <p className="label mt-4">Redes</p>
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-ink-2 no-underline hover:text-ink">
                  {s.label}
                </a>
              ))}
            </>
          )}
        </nav>
      </div>
      <div className="hairline">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-6">
          <p className="label">
            © {year} {site.legalName}
          </p>
          <p className="label">Diseñado y construido con criterio.</p>
        </div>
      </div>
    </footer>
  );
}
