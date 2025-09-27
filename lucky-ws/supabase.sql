-- Extensiones útiles (si tenés permisos; en Supabase suelen estar)
-- create extension if not exists "pgcrypto";
-- create extension if not exists "uuid-ossp";

-- Tablas básicas
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  creator_user_id text not null,
  white_id text,
  black_id text,
  phase text not null default 'rolling',         -- 'rolling' | 'moving' | 'finished'
  current_turn text check (current_turn in ('white','black')),

  dice_white int,
  dice_black int,

  -- Guardamos la partida como lista de UCI strings ["e2e4", "e7e5", ...]
  moves jsonb not null default '[]'::jsonb
);

-- Index sugeridos
create index if not exists rooms_created_at_idx on public.rooms (created_at desc);

-- Row Level Security (RLS)
alter table public.rooms enable row level security;

-- Políticas mínimas (simple: cualquiera puede leer, y escribir si es parte)
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'rooms_select_all') then
    create policy rooms_select_all on public.rooms
      for select
      using (true);
  end if;

  if not exists (select 1 from pg_policies where polname = 'rooms_insert_all') then
    create policy rooms_insert_all on public.rooms
      for insert
      with check (true);
  end if;

  if not exists (select 1 from pg_policies where polname = 'rooms_update_participants') then
    create policy rooms_update_participants on public.rooms
      for update
      using (true)
      with check (true);
  end if;
end $$;
