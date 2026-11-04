import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { site } from '@/site.config';
import { CookieBanner } from '@/components/layout/cookie-banner';
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider';
import { RouteFocus } from '@/components/providers/route-focus';
import { UtmCapture } from '@/components/providers/utm-capture';
import Script from 'next/script';
import { JsonLd } from '@/components/ui/json-ld';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Productos digitales a medida para emprendedores y empresas`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: 'website', locale: 'es_ES', siteName: site.name },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

const analyticsDomain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;

// Valme: consentimiento por defecto (antes que nada de Google) y Google Tag Manager.
const GTM_ID = 'GTM-K3ZHSP9S';
const consentDefault = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
try { if (window.localStorage.getItem('valme_cookies') === 'granted') { gtag('consent', 'update', { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' }); } } catch (e) {}`;
const gtmSnippet = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* beforeInteractive: Next los inyecta en el <head>, en este orden */}
        <Script id="valme-consent-default" strategy="beforeInteractive">
          {consentDefault}
        </Script>
        <Script id="valme-gtm" strategy="beforeInteractive">
          {gtmSnippet}
        </Script>
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <SmoothScrollProvider>
          <RouteFocus />
          <UtmCapture />
          {/* Cabecera, <main id="contenido"> y pie los pone cada grupo de rutas: (marketing) la web
              completa y (campaign) las landings de anuncios, con cabecera mínima. */}
          {children}
        </SmoothScrollProvider>
        <CookieBanner />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        {analyticsDomain && (
          // Analítica sin cookies (§13.2). Plausible por defecto; cambiar el src si se elige Umami.
          <Script defer data-domain={analyticsDomain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
