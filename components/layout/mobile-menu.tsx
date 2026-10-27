'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { site } from '@/site.config';
import { services } from '@/content/services';
import { mainNav, primaryCta } from '@/content/nav';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';

/** Hoja a pantalla completa con enlaces grandes y stagger (§5.6). Se cierra al navegar y con Esc. */
export function MobileMenu({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [seenPath, setSeenPath] = useState(pathname);

  // Cerrar al navegar (ajuste de estado durante el render, sin efecto)
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const i = (n: number) => ({ '--i': n } as CSSProperties);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="nav__burger" aria-label="Abrir menú">
          <Menu size={22} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet__overlay" />
        <Dialog.Content className="sheet" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Menú de navegación</Dialog.Title>
          <div className="sheet__top">
            <div className="nav__pill">
              <Logo onClick={() => setOpen(false)} />
              <Dialog.Close asChild>
                <button type="button" className="nav__burger" aria-label="Cerrar menú">
                  <X size={22} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <nav aria-label="Principal">
            <ul className="sheet__links">
              <li>
                <Link href="/servicios" className="sheet__link" style={i(0)}>
                  Servicios <span className="label">01</span>
                </Link>
                <div className="sheet__group">
                  {services.map((s, k) => (
                    <Link key={s.slug} href={`/servicios/${s.slug}`} className="sheet__sub" style={i(k)}>
                      {s.title}
                    </Link>
                  ))}
                </div>
              </li>
              {mainNav.map((item, k) => (
                <li key={item.href}>
                  <Link href={item.href} className="sheet__link" style={i(k + 1)}>
                    {item.label} <span className="label">0{k + 2}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sheet__footer">
            <Button href={primaryCta.href} arrow className="w-full" analytics={{ location: 'mobile-menu', label: primaryCta.label }}>
              {primaryCta.label}
            </Button>
            <a href={`mailto:${site.email}`} className="text-center font-mono text-sm text-ink-3 no-underline hover:text-ink">
              {site.email}
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
