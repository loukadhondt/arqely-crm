-- Arqely CRM — core schema
create extension if not exists pgcrypto;

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- team ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('owner','member')),
  locale text not null default 'fr' check (locale in ('fr','en')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- First user to sign up becomes active owner; others wait for activation by the team.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.profiles;
  insert into public.profiles (id, email, full_name, role, is_active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          case when n = 0 then 'owner' else 'member' end, n = 0);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_team_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active);
$$;

-- ---------- settings ----------
create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ---------- CRM ----------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  website text,
  phone text,
  email text,
  address text,
  city text,
  country text default 'BE',
  google_maps_url text,
  notes text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger companies_updated before update on public.companies for each row execute function public.set_updated_at();
create index companies_name_idx on public.companies (lower(name));

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  first_name text,
  last_name text,
  email text,
  phone text,
  position text,
  source text not null default 'manual', -- manual | framer | calcom | email | referral | ads | other
  status text not null default 'lead' check (status in ('lead','prospect','client','lost')),
  tags text[] not null default '{}',
  notes text,
  owner_id uuid references public.profiles(id) on delete set null,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger contacts_updated before update on public.contacts for each row execute function public.set_updated_at();
create unique index contacts_email_uidx on public.contacts (lower(email)) where email is not null;
create index contacts_company_idx on public.contacts (company_id);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null,
  name_en text not null,
  position int not null,
  probability int not null default 10,
  is_won boolean not null default false,
  is_lost boolean not null default false
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  stage_id uuid not null references public.pipeline_stages(id),
  amount numeric(12,2) not null default 0,        -- one-off value
  monthly_amount numeric(12,2) not null default 0, -- recurring value
  currency text not null default 'EUR',
  expected_close date,
  status text not null default 'open' check (status in ('open','won','lost')),
  lost_reason text,
  position int not null default 0,
  owner_id uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger deals_updated before update on public.deals for each row execute function public.set_updated_at();
create index deals_stage_idx on public.deals (stage_id, position);
create index deals_contact_idx on public.deals (contact_id);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('note','call','email','meeting','form','booking','system')),
  subject text,
  body text,
  contact_id uuid references public.contacts(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activities_contact_idx on public.activities (contact_id, occurred_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  due_at timestamptz,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'todo' check (status in ('todo','done')),
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tasks_updated before update on public.tasks for each row execute function public.set_updated_at();
create index tasks_assignee_idx on public.tasks (assignee_id, status, due_at);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_fr text not null,
  name_en text not null,
  billing text not null default 'monthly' check (billing in ('monthly','one_off')),
  default_price numeric(12,2) not null default 0,
  is_active boolean not null default true
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  name text not null,
  status text not null default 'active' check (status in ('active','paused','cancelled','completed')),
  monthly_amount numeric(12,2) not null default 0,
  one_off_amount numeric(12,2) not null default 0,
  start_date date not null default current_date,
  end_date date,
  renewal_date date,
  notes text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscriptions_updated before update on public.subscriptions for each row execute function public.set_updated_at();
create index subscriptions_company_idx on public.subscriptions (company_id, status);

create table public.inbound_events (
  id uuid primary key default gen_random_uuid(),
  source text not null, -- framer | calcom | email
  payload jsonb not null,
  processed boolean not null default false,
  contact_id uuid references public.contacts(id) on delete set null,
  error text,
  created_at timestamptz not null default now()
);

-- Keep contacts.last_activity_at fresh
create or replace function public.touch_contact_activity() returns trigger language plpgsql as $$
begin
  if new.contact_id is not null then
    update public.contacts set last_activity_at = greatest(coalesce(last_activity_at, 'epoch'), new.occurred_at) where id = new.contact_id;
  end if;
  return new;
end $$;
create trigger activities_touch after insert on public.activities for each row execute function public.touch_contact_activity();

-- ---------- RLS: whole team shares everything ----------
alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.services enable row level security;
alter table public.subscriptions enable row level security;
alter table public.inbound_events enable row level security;

-- profiles: everyone authenticated can read own row (to know if active); team reads all; team can update.
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_team_member());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_team_update on public.profiles for update to authenticated using (public.is_team_member()) with check (public.is_team_member());

do $$
declare t text;
begin
  foreach t in array array['app_settings','companies','contacts','pipeline_stages','deals','activities','tasks','services','subscriptions','inbound_events'] loop
    execute format('create policy %I_team_all on public.%I for all to authenticated using (public.is_team_member()) with check (public.is_team_member());', t, t);
  end loop;
end $$;

-- ---------- seed ----------
insert into public.pipeline_stages (name_fr, name_en, position, probability, is_won, is_lost) values
 ('Nouveau lead','New lead',1,10,false,false),
 ('Contacté','Contacted',2,20,false,false),
 ('Audit planifié','Audit booked',3,40,false,false),
 ('Proposition envoyée','Proposal sent',4,60,false,false),
 ('Négociation','Negotiation',5,80,false,false),
 ('Signé','Won',6,100,true,false),
 ('Perdu','Lost',7,0,false,true);

insert into public.services (code, name_fr, name_en, billing, default_price) values
 ('gbp','Google Business Profile & SEO local','Google Business Profile & local SEO','monthly',297),
 ('website','Site web (design + hébergement)','Website (design + hosting)','one_off',1500),
 ('hosting','Hébergement & maintenance site','Website hosting & maintenance','monthly',49),
 ('social','Gestion réseaux sociaux','Social media management','monthly',397),
 ('ads','Publicité Google / Meta Ads','Google / Meta Ads management','monthly',497),
 ('crm','CRM & automatisations email/SMS','CRM & email/SMS automations','monthly',197),
 ('ai_followup','Relances IA','AI follow-up system','monthly',147),
 ('reviews','Gestion des avis','Review management','monthly',97);

insert into public.app_settings (key, value) values
 ('webhook_secret', encode(gen_random_bytes(24),'hex')),
 ('brand_name','Arqely'),
 ('default_owner_email','');

-- ---------- hardening ----------
alter function public.set_updated_at() set search_path = public;
alter function public.touch_contact_activity() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_team_member() from public, anon;
grant execute on function public.is_team_member() to authenticated;
