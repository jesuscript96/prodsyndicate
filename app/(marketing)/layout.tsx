import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

/** Web completa: cabecera con menú, contenido y pie de cuatro columnas. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
