import { site } from '@/site.config';
import { Button } from '@/components/ui/button';
import { ScrollStory } from '@/components/story/scroll-story';
import { HOME_STORY } from './hero.config';

/**
 * Hero de la home (§6.2–§6.8): "Del boceto al producto". El comportamiento (pin,
 * secuencia en canvas, capítulos, estados estático / sin JS / móvil) vive en el motor
 * común ScrollStory; aquí solo el texto real y la configuración de la historia.
 */
export function HeroStory() {
  return (
    <ScrollStory
      story={HOME_STORY}
      ariaLabel="Introducción"
      eyebrow={<>{site.name} — Estudio de producto digital</>}
      title={
        <>
          Convertimos ideas en <em className="accent-word text-accent">productos digitales</em> a medida.
        </>
      }
      sub="Diseñamos y construimos MVPs, software a medida y automatizaciones para emprendedores y empresas que necesitan algo que funcione de verdad."
      actions={
        <>
          <Button href="/contacto" arrow analytics={{ location: 'hero', label: 'Cuéntanos tu idea' }}>
            Cuéntanos tu idea
          </Button>
          <Button href="/proceso" variant="secondary" analytics={{ location: 'hero', label: 'Cómo trabajamos' }}>
            Cómo trabajamos
          </Button>
        </>
      }
      finalCta={
        <>
          <p className="h3">
            ¿Tienes una idea? <em className="accent-word text-accent">Hablemos.</em>
          </p>
          <div className="hero__actions">
            <Button href="/contacto" arrow analytics={{ location: 'hero-final', label: 'Cuéntanos tu idea' }}>
              Cuéntanos tu idea
            </Button>
            <Button href="/proyectos" variant="ghost" arrow analytics={{ location: 'hero-final', label: 'Ver proyectos' }}>
              Ver proyectos
            </Button>
          </div>
        </>
      }
    />
  );
}
