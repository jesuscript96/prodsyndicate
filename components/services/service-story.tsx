import { Button } from '@/components/ui/button';
import { ScrollStory } from '@/components/story/scroll-story';
import { SERVICE_STORIES, SERVICE_STORY_COPY } from '@/content/service-stories';
import { getServiceSummary } from '@/content/services';
import type { ServiceDetail } from '@/content/services-detail';
import type { Cta } from '@/content/types';
import { renderAccent } from './accent-title';

const contactCta: Cta = { label: 'Cuéntanos tu idea', href: '/contacto' };
const agendaCta: Cta = { label: 'Agenda una llamada', href: '/contacto#agenda' };

/**
 * Hero de cada página de servicio: historia por scroll con su propia escena 3D
 * (content/service-stories.ts) y el texto real del servicio (content/services-detail.ts).
 */
export function ServiceStory({ detail }: { detail: ServiceDetail }) {
  const story = SERVICE_STORIES[detail.slug];
  const summary = getServiceSummary(detail.slug);
  const copy = SERVICE_STORY_COPY[detail.slug];
  const secondary = detail.cta.href.includes('#agenda') ? contactCta : agendaCta;
  const location = `service-hero-${detail.slug}`;

  return (
    <ScrollStory
      story={story}
      ariaLabel={`Introducción: ${summary?.title ?? 'servicio'}`}
      eyebrow={<>Servicios — {summary?.title}</>}
      title={renderAccent(detail.h1)}
      sub={detail.intro}
      actions={
        <>
          <Button href={detail.cta.href} arrow analytics={{ location, label: detail.cta.label }}>
            {detail.cta.label}
          </Button>
          <Button href={secondary.href} variant="secondary" analytics={{ location, label: secondary.label }}>
            {secondary.label}
          </Button>
        </>
      }
      finalCta={
        <>
          <p className="h3">{renderAccent(copy.finalTitle)}</p>
          <div className="hero__actions">
            <Button href={detail.cta.href} arrow analytics={{ location: `${location}-final`, label: detail.cta.label }}>
              {detail.cta.label}
            </Button>
            <Button href="/proyectos" variant="ghost" arrow analytics={{ location: `${location}-final`, label: 'Ver proyectos' }}>
              Ver proyectos
            </Button>
          </div>
        </>
      }
    />
  );
}
