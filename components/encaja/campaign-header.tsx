import { BrandMark } from '@/components/layout/brand-mark';
import { Button } from '@/components/ui/button';
import { encajaCta } from '@/content/encaja';
import { site } from '@/site.config';
import './encaja.css';

/**
 * Cabecera de las landings de campaña: solo marca y botón, sin menú ni enlace a la home, para que
 * quien llega desde un anuncio no se vaya a otra parte de la web antes de decidir.
 */
export function CampaignHeader() {
  return (
    <header className="lp-nav">
      <div className="lp-nav__pill">
        <span className="lp-nav__brand">
          <BrandMark size={22} />
          <span className="lp-nav__wordmark">{site.name}</span>
        </span>
        <Button href={encajaCta.href} size="sm" analytics={{ location: 'lp-header', label: encajaCta.label }}>
          {encajaCta.label}
        </Button>
      </div>
    </header>
  );
}
