
create table public.rooms (
  code text primary key,
  quiz_id text not null,
  quiz_data jsonb not null,
  host_id text not null,
  started boolean not null default false,
  started_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.rooms(code) on delete cascade,
  name text not null,
  score integer not null default 0,
  answered_idx integer not null default -1,
  finished boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.room_players (room_code);

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;

-- Public access (multiplayer rooms are accessible by code; no auth required)
create policy "rooms public select" on public.rooms for select using (true);
create policy "rooms public insert" on public.rooms for insert with check (true);
create policy "rooms public update" on public.rooms for update using (true);

create policy "players public select" on public.room_players for select using (true);
create policy "players public insert" on public.room_players for insert with check (true);
create policy "players public update" on public.room_players for update using (true);

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
alter table public.rooms replica identity full;
alter table public.room_players replica identity full;
