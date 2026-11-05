alter table public.profiles
  add column if not exists custom_profession text,
  add column if not exists onboarding_source text,
  add column if not exists onboarding_reason text,
  add column if not exists onboarding_completed_at timestamptz;

create table if not exists public.chat_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  objective text not null default '',
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chat_projects_user_updated_idx on public.chat_projects(user_id, updated_at desc);
alter table public.chat_projects enable row level security;
drop policy if exists "Users manage own chat projects" on public.chat_projects;
create policy "Users manage own chat projects" on public.chat_projects
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.chat_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array'),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_project_created_idx on public.chat_messages(project_id, created_at asc);
alter table public.chat_messages enable row level security;
drop policy if exists "Users manage own chat messages" on public.chat_messages;
create policy "Users manage own chat messages" on public.chat_messages
  for all to authenticated using (
    auth.uid() = user_id and exists (
      select 1 from public.chat_projects p where p.id = project_id and p.user_id = auth.uid()
    )
  ) with check (
    auth.uid() = user_id and exists (
      select 1 from public.chat_projects p where p.id = project_id and p.user_id = auth.uid()
    )
  );

create table if not exists public.user_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  image_generations integer not null default 0 check (image_generations >= 0),
  imports integer not null default 0 check (imports >= 0),
  primary key (user_id, usage_date)
);
alter table public.user_daily_usage enable row level security;
drop policy if exists "Users read own daily usage" on public.user_daily_usage;
create policy "Users read own daily usage" on public.user_daily_usage
  for select to authenticated using (auth.uid() = user_id);
