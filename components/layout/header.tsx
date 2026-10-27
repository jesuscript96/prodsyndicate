'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { useCallback, useEffect, useRef, useState } from 'react';
import { mainNav, primaryCta } from '@/content/nav';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import { MegaMenu } from './mega-menu';
import { MobileMenu } from './mobile-menu';
import './header.css';

/**
 * Píldora flotante (§5.6): se oculta al bajar y reaparece al subir, salvo
 * durante el hero fijado (`body[data-hero-pinned="true"]`) o con el menú móvil abierto.
 */
export function Header() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const menuOpen = useRef(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        ticking.current = false;
        const y = window.scrollY;
        const delta = y - lastY.current;
        lastY.current = y;
        const pinned = document.body.dataset.heroPinned === 'true';
        if (pinned || menuOpen.current || y < 80) {
          setHidden(false);
          return;
        }
        if (Math.abs(delta) < 4) return;
        setHidden(delta > 0);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setHidden(false);
  }

  const onMenuOpenChange = useCallback((open: boolean) => {
    menuOpen.current = open;
    if (open) setHidden(false);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="nav" data-hidden={hidden ? 'true' : undefined}>
      <div className="nav__pill">
        <Logo />
        <NavigationMenu.Root aria-label="Principal" delayDuration={120}>
          <NavigationMenu.List className="nav__links">
            <MegaMenu active={isActive('/servicios')} />
            {mainNav.map((item) => (
              <NavigationMenu.Item key={item.href} className="nav__item">
                <NavigationMenu.Link asChild active={isActive(item.href)}>
                  <Link href={item.href} className="nav__link" aria-current={isActive(item.href) ? 'page' : undefined}>
                    {item.label}
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            ))}
          </NavigationMenu.List>
        </NavigationMenu.Root>
        <Button href={primaryCta.href} size="sm" className="nav__cta" analytics={{ location: 'header', label: primaryCta.label }}>
          {primaryCta.label}
        </Button>
        <MobileMenu onOpenChange={onMenuOpenChange} />
      </div>
    </header>
  );
}
