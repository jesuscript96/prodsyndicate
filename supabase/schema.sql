-- Esquema de la tabla de leads del formulario de contacto (§9.2).
--
-- ⚠️ Región: crea el proyecto de Supabase en una región de la UE (p. ej. Frankfurt
-- `eu-central-1`) si se tratan datos de residentes en la UE, y firma el acuerdo de
-- encargado de tratamiento (DPA) con Supabase, Resend y Cloudflare.
--
-- Ejecutar en el SQL Editor del proyecto (o con `supabase db push`).

create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  audience    text not null check (audience in ('emprendedor','empresa')),
  needs       text[] not null default '{}',
  stage       text,
  timeline    text,
  budget      text,
  message     text,
  links       text[],
  name        text not null,
  email       text not null,
  company     text,
  phone       text,
  consent     boolean not null,
  source      text,
  utm         jsonb,
  status      text not null default 'nuevo'   -- nuevo | contactado | propuesta | ganado | perdido
);

create index leads_created_at_idx on public.leads (created_at desc);

-- Seguridad: RLS activada y SIN políticas públicas.
-- Solo el service role (servidor, `SUPABASE_SERVICE_ROLE_KEY`) puede leer/escribir.
alter table public.leads enable row level security;

-- Cinturón y tirantes: ni `anon` ni `authenticated` tienen privilegios sobre la tabla,
-- aunque alguien añadiera una política por error.
revoke all on table public.leads from anon, authenticated;

comment on table public.leads is
  'Leads del asistente de contacto (/contacto). Datos personales: minimizar accesos y borrar según la política de retención.';
