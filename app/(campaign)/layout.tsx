import { CampaignFooter } from '@/components/encaja/campaign-footer';
import { CampaignHeader } from '@/components/encaja/campaign-header';

/** Landings de anuncios: cabecera solo con marca y botón, y pie solo con legales. */
export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CampaignHeader />
      <main id="contenido" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <CampaignFooter />
    </>
  );
}
