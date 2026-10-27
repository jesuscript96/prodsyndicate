'use client';

import Link from 'next/link';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { ChevronDown } from 'lucide-react';
import { services } from '@/content/services';
import { ServiceIcon } from '@/components/ui/service-icon';
import { LinkArrow } from '@/components/ui/link-arrow';

/** Menú desplegable de Servicios: 4 tarjetas con icono, título y una línea (§3.2, §5.6). */
export function MegaMenu({ active }: { active: boolean }) {
  return (
    <NavigationMenu.Item className="nav__item">
      <NavigationMenu.Trigger className="nav__link" aria-current={active ? 'page' : undefined}>
        Servicios
        <ChevronDown className="nav__chevron" aria-hidden="true" />
      </NavigationMenu.Trigger>
      <NavigationMenu.Content className="mega">
        {services.map((s) => (
          <NavigationMenu.Link key={s.slug} asChild>
            <Link href={`/servicios/${s.slug}`} className="mega__card">
              <span className="mega__icon">
                <ServiceIcon name={s.icon} size={20} />
              </span>
              <span>
                <span className="mega__title block">{s.title}</span>
                <span className="mega__line block">{s.menuLine}</span>
              </span>
            </Link>
          </NavigationMenu.Link>
        ))}
        <div className="mega__footer">
          <span>Cuatro formas de trabajar contigo, un mismo estándar.</span>
          <NavigationMenu.Link asChild>
            <LinkArrow href="/servicios">Todos los servicios</LinkArrow>
          </NavigationMenu.Link>
        </div>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  );
}
