import Link from 'next/link';
import { CookieSettingsButton } from '@/components/layout/cookie-banner';
import { legalNav } from '@/content/nav';
import { site } from '@/site.config';

/** Pie mínimo de las landings de campaña: titular, email y legales. */
export function CampaignFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="hairline bg-paper">
      <div className="wrap lp-footer">
        <p className="label">
          © {year} {site.name} · {site.legalName}
        </p>
        <nav aria-label="Legal" className="lp-footer__links">
          <a href={`mailto:${site.email}`}>{site.email}</a>
          {legalNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <CookieSettingsButton className="cursor-pointer text-left" />
        </nav>
      </div>
    </footer>
  );
}
