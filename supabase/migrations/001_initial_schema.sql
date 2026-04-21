-- ============================================================================
-- Optimus.AI — initial schema (Phase 1: auth + user profile + credits)
-- ============================================================================
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- It creates the user-facing tables, row-level-security (RLS) policies so
-- each user can only read/write their own rows, and a trigger that gives
-- every new signup a trial credit balance.
-- ============================================================================

-- -----------------------------------------------------------------------------
-- profiles — extends auth.users with app-specific fields (display name,
-- avatar, created_at). auth.users is managed by Supabase Auth and we
-- shouldn't modify it directly.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  display_name text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read and update their own profile.
create policy "profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- credits — per-user credit balance. 1 credit = 1 remix or 1 generate.
-- On signup we grant 1 trial credit. Subscriptions top this up monthly
-- (Phase 2 wires Stripe webhooks to refill this table).
-- -----------------------------------------------------------------------------
create table if not exists public.credits (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  balance     integer not null default 0,
  lifetime_used integer not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.credits enable row level security;

-- Users can read their own balance. Writes happen server-side via the
-- service_role key (API endpoints), so no INSERT/UPDATE policy for
-- anon users.
create policy "credits are viewable by owner"
  on public.credits for select
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- subscriptions — tracks each user's Stripe subscription state. Populated
-- by the Stripe webhook handler in Phase 2.
-- -----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id   text,
  stripe_subscription_id text,
  status               text, -- active | trialing | past_due | canceled | incomplete
  price_id             text,
  current_period_end   timestamptz,
  cancel_at_period_end boolean default false,
  updated_at           timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions are viewable by owner"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- saved_videos — user's video vault (replaces localStorage).
-- -----------------------------------------------------------------------------
create table if not exists public.saved_videos (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  video_id    text not null, -- platform-specific id (e.g. Instagram pk)
  payload     jsonb not null, -- full video object
  created_at  timestamptz not null default now(),
  unique (user_id, video_id)
);

alter table public.saved_videos enable row level security;

create policy "saved_videos owned"
  on public.saved_videos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- saved_scripts — user's remixed/created scripts.
-- -----------------------------------------------------------------------------
create table if not exists public.saved_scripts (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  topic       text not null,
  body        text not null,
  tone        text,
  duration    text,
  payload     jsonb, -- any extra metadata
  created_at  timestamptz not null default now()
);

alter table public.saved_scripts enable row level security;

create policy "saved_scripts owned"
  on public.saved_scripts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- watchlist — the creators a user is watching.
-- -----------------------------------------------------------------------------
create table if not exists public.watchlist (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  creator_id  text not null, -- platform-specific
  payload     jsonb not null, -- full creator object
  added_at    timestamptz not null default now(),
  unique (user_id, creator_id)
);

alter table public.watchlist enable row level security;

create policy "watchlist owned"
  on public.watchlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- Signup trigger — on every new user in auth.users, create a matching
-- profiles + credits row. The new user gets 1 trial credit.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.credits (user_id, balance)
  values (new.id, 1) -- 1 trial credit
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Helper RPC: spend_credit
--   Atomically decrement a user's balance by 1 if they have credits left.
--   Called from API endpoints (Vercel functions) via the service_role key.
--   Returns the NEW balance on success, or -1 if the user had 0 credits
--   (so the endpoint can return "out of credits" without burning a Claude
--   call).
-- ============================================================================
create or replace function public.spend_credit(target_user uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  current_balance integer;
begin
  update public.credits
    set balance = balance - 1,
        lifetime_used = lifetime_used + 1,
        updated_at = now()
    where user_id = target_user and balance > 0
    returning balance into current_balance;

  if current_balance is null then
    return -1; -- out of credits
  end if;

  return current_balance;
end;
$$;
