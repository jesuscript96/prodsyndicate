import { ArrowRight } from 'lucide-react';
import { getServiceSummary } from '@/content/services';
import type { ServiceSlug } from '@/content/types';
import { LinkArrow } from '@/components/ui/link-arrow';
import './services.css';

/** Filas exactas de §8.2 sección 4: "Si tu situación es… → te conviene…". */
const rows: readonly { situation: string; slug: ServiceSlug; label: string }[] = [
  { situation: 'Tengo una idea y nada construido', slug: 'mvp', label: 'MVP' },
  { situation: 'Mi equipo pierde horas en tareas manuales', slug: 'automatizacion-ia', label: 'Automatización e IA' },
  {
    situation: 'Necesito un portal, panel o herramienta para mi empresa',
    slug: 'software-a-medida',
    label: 'Software a medida',
  },
  { situation: 'Quiero una experiencia digital con identidad propia', slug: 'productos-creativos', label: 'Productos creativos' },
];

/** Tabla accesible (caption, scope, roles explícitos para que no pierda semántica al apilarse en móvil). */
export function HowToChoose() {
  return (
    <table className="choose" role="table">
      <caption className="sr-only">Qué servicio te conviene según tu situación</caption>
      <thead>
        <tr role="row">
          <th scope="col" role="columnheader">
            Si tu situación es…
          </th>
          <th scope="col" role="columnheader">
            Te conviene…
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const s = getServiceSummary(r.slug);
          return (
            <tr key={r.slug} role="row">
              <th scope="row" role="rowheader">
                «{r.situation}»
              </th>
              <td role="cell">
                <span className="choose__to">
                  <ArrowRight className="choose__arrow" aria-hidden="true" strokeWidth={1.5} />
                  <LinkArrow href={`/servicios/${r.slug}`} accent>
                    {r.label}
                  </LinkArrow>
                  {s && <span className="choose__line">{s.menuLine}</span>}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
