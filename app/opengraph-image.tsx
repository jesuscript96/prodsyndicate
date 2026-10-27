import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { site } from '@/site.config';
import { services } from '@/content/services';

/**
 * OG por defecto (§10.4): fondo blanco, titular grande, nombre del sitio en mono
 * con el punto ultramar y, a la derecha, el último frame del hero
 * (`public/og/poster-last.png`) solo si existe. Sin fuentes externas.
 */
export const alt = `${site.name} · Productos digitales a medida`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const INK = '#0b0b0f';
const INK_2 = '#3a3a42';
const INK_3 = '#6b6b76';
const LINE = '#e8e8e3';
const ACCENT = '#2b3bff';

/** Data URL del poster si está exportado; `null` si no existe (sin error). */
async function posterDataUrl(): Promise<string | null> {
  try {
    const file = await readFile(path.join(process.cwd(), 'public', 'og', 'poster-last.png'));
    return `data:image/png;base64,${file.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const poster = await posterDataUrl();
  const host = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const lines = services.map((s) => s.shortTitle).join(' · ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#ffffff',
          color: INK,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            padding: '64px 72px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'monospace',
              fontSize: 22,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: INK_3,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 999, background: ACCENT }} />
            <span>{site.name}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div
              style={{
                fontSize: poster ? 72 : 96,
                fontWeight: 600,
                lineHeight: 1.02,
                letterSpacing: -3,
                maxWidth: poster ? 560 : 1000,
                display: 'block',
              }}
            >
              Productos digitales a medida
            </div>
            <div style={{ fontSize: 24, lineHeight: 1.4, color: INK_2, maxWidth: poster ? 520 : 900, display: 'block' }}>
              {lines}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              fontFamily: 'monospace',
              fontSize: 20,
              letterSpacing: 2,
              color: INK_3,
              borderTop: `1px solid ${LINE}`,
              paddingTop: 24,
            }}
          >
            {host}
          </div>
        </div>

        {poster && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '48px 56px 48px 0' }}>
            {/* <img> nativo a propósito: lo rasteriza Satori, no el DOM */}
            <img
              src={poster}
              alt=""
              width={534}
              height={534}
              style={{ borderRadius: 28, border: `1px solid ${LINE}`, objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
