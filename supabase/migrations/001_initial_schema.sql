-- ============================================================
-- Sipscape Database Schema — Supabase (PostgreSQL)
-- Initial migration: all tables for the full app
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "citext";        -- case-insensitive usernames

-- ============================================================
-- 1. PROFILES
--    Extends Supabase auth.users with app-specific data.
--    Created automatically when a user signs up.
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  phone           text,
  first_name      text not null default '',
  last_name       text default '',
  username        citext unique,                -- case-insensitive
  birthday        date,
  location        text default '',
  avatar          text default '😊',
  xp              integer not null default 0 check (xp >= 0),
  streak          integer not null default 0 check (streak >= 0),
  milk_preference text default '',
  is_online       boolean not null default false,
  last_active     timestamptz default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_profiles_username on public.profiles(username);

-- ============================================================
-- 2. COFFEE PREFERENCES
--    Many-to-many: each user can like multiple drinks.
-- ============================================================
create table public.coffee_preferences (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  drink_key         text not null,              -- e.g. 'espresso', 'latte', 'matcha'
  preference_level  text not null default 'like' check (preference_level in ('love', 'like', 'avoid')),
  created_at        timestamptz not null default now(),
  unique(user_id, drink_key)
);

create index idx_coffee_prefs_user on public.coffee_preferences(user_id);

-- ============================================================
-- 3. CAFÉS
--    The core café directory.
-- ============================================================
create table public.cafes (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  emoji           text default '☕',
  vibe            text not null,                -- cozy, botanical, retro, etc.
  signature_drink text,
  description     text,
  website_url     text,
  instagram_url   text,
  image_url       text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index idx_cafes_vibe on public.cafes(vibe);
create index idx_cafes_active on public.cafes(is_active);

-- ============================================================
-- 3a. CAFÉ LOCATIONS
--     A café can have multiple locations (branches).
--     Address is structured for filtering by city/state/country.
-- ============================================================
create table public.cafe_locations (
  id              uuid primary key default uuid_generate_v4(),
  cafe_id         uuid not null references public.cafes(id) on delete cascade,
  label           text,                         -- e.g. 'Ballard', 'Capitol Hill', 'Downtown'
  street          text,
  city            text not null,
  state           text,
  zip             text,
  country         text not null default 'US',
  neighborhood    text,
  latitude        double precision,
  longitude       double precision,
  google_maps_url text,
  opening_hours   jsonb,                        -- e.g. {"mon":"7am-5pm", ...}
  price_level     integer check (price_level between 1 and 4),
  phone           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index idx_cafe_locations_cafe on public.cafe_locations(cafe_id);
create index idx_cafe_locations_city on public.cafe_locations(city);
create index idx_cafe_locations_neighborhood on public.cafe_locations(neighborhood);
create index idx_cafe_locations_active on public.cafe_locations(is_active);

-- ============================================================
-- 3b. CAFÉ TAGS
--     Normalized tag table.
-- ============================================================
create table public.cafe_tags (
  id        uuid primary key default uuid_generate_v4(),
  cafe_id   uuid not null references public.cafes(id) on delete cascade,
  tag       text not null,
  unique(cafe_id, tag)
);

create index idx_cafe_tags_cafe on public.cafe_tags(cafe_id);
create index idx_cafe_tags_tag on public.cafe_tags(tag);

-- ============================================================
-- 4. STAMPS / COFFEE PASSPORT
--    One row per café visit stamp a user collects.
-- ============================================================
create table public.stamps (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  cafe_id       uuid not null references public.cafes(id) on delete cascade,
  location_id   uuid references public.cafe_locations(id) on delete set null,  -- which branch
  source        text not null default 'manual' check (source in ('qr_scan', 'manual', 'location_check', 'admin')),
  xp_earned     integer not null default 30 check (xp_earned >= 0),
  collected_at  timestamptz not null default now(),
  unique(user_id, cafe_id)                     -- one stamp per café brand
);

create index idx_stamps_user on public.stamps(user_id);
create index idx_stamps_cafe on public.stamps(cafe_id);
create index idx_stamps_location on public.stamps(location_id);

-- ============================================================
-- 5. BINGO CHALLENGES
--    Master list of bingo items (admin-managed, weekly grid).
-- ============================================================
create table public.bingo_challenges (
  id            uuid primary key default uuid_generate_v4(),
  icon          text not null,
  title         text not null,
  description   text,
  position      integer not null check (position between 0 and 15),
  week_of       date not null,                 -- start-of-week date
  xp_reward     integer not null default 15 check (xp_reward >= 0),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique(week_of, position)                    -- no duplicate grid cells in same week
);

create index idx_bingo_week on public.bingo_challenges(week_of);

-- ============================================================
-- 6. BINGO PROGRESS
--    Tracks which bingo squares a user has completed.
-- ============================================================
create table public.bingo_progress (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  challenge_id  uuid not null references public.bingo_challenges(id) on delete cascade,
  xp_earned     integer not null default 15 check (xp_earned >= 0),
  completed_at  timestamptz not null default now(),
  unique(user_id, challenge_id)
);

create index idx_bingo_progress_user on public.bingo_progress(user_id);
create index idx_bingo_progress_challenge on public.bingo_progress(challenge_id);

-- ============================================================
-- 7. ROULETTE SPINS
--    History of Brew Roulette results.
--    One spin per user per day (global daily limit).
-- ============================================================
create table public.roulette_spins (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  recommended_cafe_id   uuid not null references public.cafes(id) on delete cascade,
  drink                 text not null,
  reason                text,                  -- fun reason text
  spin_date             date not null default current_date,
  xp_earned             integer not null default 10 check (xp_earned >= 0),
  spun_at               timestamptz not null default now(),
  unique(user_id, spin_date)                   -- one spin per day
);

create index idx_roulette_user on public.roulette_spins(user_id);
create index idx_roulette_cafe on public.roulette_spins(recommended_cafe_id);
create index idx_roulette_date on public.roulette_spins(spun_at desc);

-- ============================================================
-- 8. QUIZ RESULTS (Café Matchmaker)
--    Stores each user's quiz answers and matched café.
-- ============================================================
create table public.quiz_results (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  answers         jsonb not null default '[]',  -- [{question_index, answer_value}, ...]
  matched_cafe_id uuid references public.cafes(id) on delete set null,
  matched_vibe    text,
  quiz_version    text not null default 'v1',   -- tracks which quiz version was taken
  taken_at        timestamptz not null default now()
);

create index idx_quiz_user on public.quiz_results(user_id);
create index idx_quiz_cafe on public.quiz_results(matched_cafe_id);

-- ============================================================
-- 9. DAILY CHALLENGES
--    Rotating daily challenges like "Rainy Day Explorer".
--    Supports multiple challenges per day via slot.
-- ============================================================
create table public.daily_challenges (
  id              uuid primary key default uuid_generate_v4(),
  emoji           text not null,
  title           text not null,
  description     text not null,
  xp_reward       integer not null default 50 check (xp_reward >= 0),
  challenge_date  date not null default current_date,
  slot            integer not null default 1,   -- allows multiple challenges per day
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique(challenge_date, slot)
);

create index idx_daily_challenge_date on public.daily_challenges(challenge_date);

-- ============================================================
-- 10. DAILY CHALLENGE COMPLETIONS
-- ============================================================
create table public.daily_challenge_completions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  challenge_id  uuid not null references public.daily_challenges(id) on delete cascade,
  xp_earned     integer not null default 50 check (xp_earned >= 0),
  completed_at  timestamptz not null default now(),
  unique(user_id, challenge_id)
);

create index idx_daily_completions_user on public.daily_challenge_completions(user_id);
create index idx_daily_completions_challenge on public.daily_challenge_completions(challenge_id);

-- ============================================================
-- 11. XP LEDGER
--    Source of truth for all XP earned.
--    profiles.xp is a cached total, synced by trigger.
-- ============================================================
create table public.xp_ledger (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  amount        integer not null check (amount <> 0),
  source        text not null check (source in (
                  'stamp', 'roulette_spin', 'quiz_result',
                  'bingo_progress', 'daily_completion', 'admin_adjustment'
                )),
  reference_id  uuid,                          -- FK to the source row
  earned_at     timestamptz not null default now()
);

create index idx_xp_user on public.xp_ledger(user_id);
create index idx_xp_date on public.xp_ledger(earned_at desc);
create index idx_xp_source on public.xp_ledger(source);

-- ============================================================
-- 12. TIERS / BADGES
--    Stamp-based tiers (Ballard Beginner → Coffee Legend).
-- ============================================================
create table public.tiers (
  id          serial primary key,
  name        text not null unique,
  emoji       text not null,
  min_stamps  integer not null,
  sort_order  integer not null
);

insert into public.tiers (name, emoji, min_stamps, sort_order) values
  ('First Sip',             '🌱', 0, 1),
  ('Caffeine Explorer',     '🌟', 3, 2),
  ('Neighborhood Regular',  '☕', 6, 3),
  ('Coffee Legend',          '👑', 9, 4);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on profile changes
create or replace function public.update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated
  before update on public.profiles
  for each row execute function public.update_timestamp();

-- Sync profiles.xp when xp_ledger gets a new row
-- xp_ledger is the source of truth; profiles.xp is the cached total.
create or replace function public.sync_xp_from_ledger()
returns trigger as $$
begin
  update public.profiles
  set xp = greatest(0, xp + new.amount)
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger xp_ledger_sync
  after insert on public.xp_ledger
  for each row execute function public.sync_xp_from_ledger();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Calculate user tier based on stamp count
create or replace function public.get_user_tier(p_user_id uuid)
returns table(tier_name text, tier_emoji text, stamp_count bigint, next_tier text, stamps_needed integer) as $$
declare
  v_count bigint;
begin
  select count(*) into v_count from public.stamps where user_id = p_user_id;

  return query
    select
      t.name,
      t.emoji,
      v_count,
      lead(t.name) over (order by t.sort_order) as next_tier,
      coalesce(lead(t.min_stamps) over (order by t.sort_order), t.min_stamps) as stamps_needed
    from public.tiers t
    where t.min_stamps <= v_count
    order by t.sort_order desc
    limit 1;
end;
$$ language plpgsql security definer;

-- Update streak on activity
create or replace function public.update_streak(p_user_id uuid)
returns void as $$
declare
  v_last timestamptz;
  v_today date := current_date;
begin
  select last_active into v_last from public.profiles where id = p_user_id;

  if v_last::date = v_today - interval '1 day' then
    update public.profiles
    set streak = streak + 1, last_active = now()
    where id = p_user_id;
  elsif v_last::date < v_today - interval '1 day' then
    update public.profiles
    set streak = 1, last_active = now()
    where id = p_user_id;
  end if;
  -- If already active today, do nothing
end;
$$ language plpgsql security definer;

-- ============================================================
-- SECURE RPC FUNCTIONS
-- Business logic lives here, not in the frontend.
-- Frontend calls these via supabase.rpc('function_name', {args}).
-- ============================================================

-- Collect a stamp at a café (optionally at a specific location/branch)
create or replace function public.collect_stamp(
  p_cafe_id uuid,
  p_source text default 'manual',
  p_location_id uuid default null
)
returns uuid as $$
declare
  v_stamp_id uuid;
  v_xp integer := 30;
begin
  -- Insert stamp (unique constraint prevents duplicates)
  insert into public.stamps (user_id, cafe_id, location_id, source, xp_earned)
  values (auth.uid(), p_cafe_id, p_location_id, p_source, v_xp)
  returning id into v_stamp_id;

  -- Log XP
  insert into public.xp_ledger (user_id, amount, source, reference_id)
  values (auth.uid(), v_xp, 'stamp', v_stamp_id);

  -- Update streak
  perform public.update_streak(auth.uid());

  return v_stamp_id;
end;
$$ language plpgsql security definer;

-- Complete a bingo challenge
create or replace function public.complete_bingo(p_challenge_id uuid)
returns uuid as $$
declare
  v_progress_id uuid;
  v_xp integer;
begin
  -- Get the XP reward from the challenge
  select xp_reward into v_xp from public.bingo_challenges where id = p_challenge_id;

  -- Insert progress (unique constraint prevents duplicates)
  insert into public.bingo_progress (user_id, challenge_id, xp_earned)
  values (auth.uid(), p_challenge_id, v_xp)
  returning id into v_progress_id;

  -- Log XP
  insert into public.xp_ledger (user_id, amount, source, reference_id)
  values (auth.uid(), v_xp, 'bingo_progress', v_progress_id);

  -- Update streak
  perform public.update_streak(auth.uid());

  return v_progress_id;
end;
$$ language plpgsql security definer;

-- Record a roulette spin (one per day enforced by unique constraint)
create or replace function public.record_spin(p_cafe_id uuid, p_drink text, p_reason text default null)
returns uuid as $$
declare
  v_spin_id uuid;
  v_xp integer := 10;
begin
  insert into public.roulette_spins (user_id, recommended_cafe_id, drink, reason, xp_earned)
  values (auth.uid(), p_cafe_id, p_drink, p_reason, v_xp)
  returning id into v_spin_id;

  -- Log XP
  insert into public.xp_ledger (user_id, amount, source, reference_id)
  values (auth.uid(), v_xp, 'roulette_spin', v_spin_id);

  -- Update streak
  perform public.update_streak(auth.uid());

  return v_spin_id;
end;
$$ language plpgsql security definer;

-- Save a quiz result
create or replace function public.save_quiz_result(
  p_answers jsonb,
  p_matched_cafe_id uuid,
  p_matched_vibe text,
  p_quiz_version text default 'v1'
)
returns uuid as $$
declare
  v_result_id uuid;
begin
  insert into public.quiz_results (user_id, answers, matched_cafe_id, matched_vibe, quiz_version)
  values (auth.uid(), p_answers, p_matched_cafe_id, p_matched_vibe, p_quiz_version)
  returning id into v_result_id;

  -- No XP for quiz (it's for discovery, not grinding)
  -- Update streak
  perform public.update_streak(auth.uid());

  return v_result_id;
end;
$$ language plpgsql security definer;

-- Complete a daily challenge
create or replace function public.complete_daily_challenge(p_challenge_id uuid)
returns uuid as $$
declare
  v_completion_id uuid;
  v_xp integer;
begin
  -- Get the XP reward
  select xp_reward into v_xp from public.daily_challenges where id = p_challenge_id;

  -- Insert completion (unique constraint prevents duplicates)
  insert into public.daily_challenge_completions (user_id, challenge_id, xp_earned)
  values (auth.uid(), p_challenge_id, v_xp)
  returning id into v_completion_id;

  -- Log XP
  insert into public.xp_ledger (user_id, amount, source, reference_id)
  values (auth.uid(), v_xp, 'daily_completion', v_completion_id);

  -- Update streak
  perform public.update_streak(auth.uid());

  return v_completion_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles: anyone can read, only own user can update
alter table public.profiles enable row level security;
create policy "Public profiles are viewable"  on public.profiles for select using (true);
create policy "Users can update own profile"  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"  on public.profiles for insert with check (auth.uid() = id);

-- Coffee preferences: own data only
alter table public.coffee_preferences enable row level security;
create policy "Own preferences select"  on public.coffee_preferences for select using (auth.uid() = user_id);
create policy "Own preferences insert"  on public.coffee_preferences for insert with check (auth.uid() = user_id);
create policy "Own preferences delete"  on public.coffee_preferences for delete using (auth.uid() = user_id);

-- Cafés: public read, admin-managed writes
alter table public.cafes enable row level security;
create policy "Cafés are public"  on public.cafes for select using (true);

-- Café locations: public read, admin-managed writes
alter table public.cafe_locations enable row level security;
create policy "Café locations are public"  on public.cafe_locations for select using (true);

-- Café tags: public read, admin-managed writes
alter table public.cafe_tags enable row level security;
create policy "Café tags are public"  on public.cafe_tags for select using (true);

-- Stamps: public reads (for leaderboards), inserts via RPC only
alter table public.stamps enable row level security;
create policy "View any stamps"    on public.stamps for select using (true);
-- No direct insert policy: stamps are created via collect_stamp() RPC

-- Bingo challenges: public read
alter table public.bingo_challenges enable row level security;
create policy "Bingo challenges public"  on public.bingo_challenges for select using (true);

-- Bingo progress: public reads (for social), inserts via RPC only
alter table public.bingo_progress enable row level security;
create policy "View any bingo"     on public.bingo_progress for select using (true);
-- No direct insert policy: created via complete_bingo() RPC

-- Roulette: own data read, inserts via RPC only
alter table public.roulette_spins enable row level security;
create policy "Own roulette reads"  on public.roulette_spins for select using (auth.uid() = user_id);
-- No direct insert policy: created via record_spin() RPC

-- Quiz results: own data read, inserts via RPC only
alter table public.quiz_results enable row level security;
create policy "Own quiz results"  on public.quiz_results for select using (auth.uid() = user_id);
-- No direct insert policy: created via save_quiz_result() RPC

-- Daily challenges: public read
alter table public.daily_challenges enable row level security;
create policy "Daily challenges public"  on public.daily_challenges for select using (true);

-- Daily completions: own data read, inserts via RPC only
alter table public.daily_challenge_completions enable row level security;
create policy "Own completions read"  on public.daily_challenge_completions for select using (auth.uid() = user_id);
-- No direct insert policy: created via complete_daily_challenge() RPC

-- XP ledger: own data read only (never client-writable)
alter table public.xp_ledger enable row level security;
create policy "Own XP read"  on public.xp_ledger for select using (auth.uid() = user_id);
-- No insert/update/delete policies: XP is only granted by server-side RPC functions

-- Tiers: public read
alter table public.tiers enable row level security;
create policy "Tiers public"  on public.tiers for select using (true);

-- ============================================================
-- SEED DATA: Cafés
-- ============================================================
insert into public.cafes (name, emoji, vibe, signature_drink, description) values
  ('Morning Fog Roasters',  '🌫️', 'cozy',      'Honey lavender latte',      'A misty corner spot with vintage armchairs and soft jazz'),
  ('Timber & Bloom',        '🌿', 'botanical',  'Oat milk matcha',           'Plant-filled greenhouse café with natural light for days'),
  ('The Vinyl Pour',        '🎵', 'retro',      'Classic drip coffee',       'Record shop meets café — flip through vinyl while you sip'),
  ('Cloud Nine Coffee',     '☁️', 'dreamy',     'Vanilla cloud cold brew',   'Airy, minimalist space with the fluffiest foam in town'),
  ('Ember & Oak',           '🔥', 'warm',       'Smoked maple cappuccino',   'Fireplace, exposed brick, and the warmest baristas around'),
  ('Saltwater Café',        '🌊', 'coastal',    'Coconut cold brew',         'Ocean-inspired with salty air and sea-blue walls'),
  ('The Bookshelf Brew',    '📚', 'literary',   'Cardamom mocha',            'Floor-to-ceiling books and a reading nook to disappear into'),
  ('Sunrise Social',        '🌅', 'energetic',  'Espresso tonic',            'Early bird favorite — bright, buzzy, and full of good energy'),
  ('Wildflower Roast',      '🌸', 'garden',     'Rose latte',                'Garden patio café with dried flowers hanging from the ceiling');

-- SEED DATA: Café locations (some cafés have multiple branches)
insert into public.cafe_locations (cafe_id, label, street, city, state, zip, country, neighborhood, latitude, longitude)
select c.id, 'Ballard',      '5432 Ballard Ave NW',    'Seattle', 'WA', '98107', 'US', 'Ballard',      47.6677, -122.3840 from public.cafes c where c.name = 'Morning Fog Roasters'
union all
select c.id, 'Fremont',      '3401 Fremont Ave N',     'Seattle', 'WA', '98103', 'US', 'Fremont',      47.6515, -122.3499 from public.cafes c where c.name = 'Morning Fog Roasters'
union all
select c.id, 'Capitol Hill', '1521 Broadway E',        'Seattle', 'WA', '98102', 'US', 'Capitol Hill', 47.6147, -122.3214 from public.cafes c where c.name = 'Timber & Bloom'
union all
select c.id, 'Fremont',      '601 N 35th St',          'Seattle', 'WA', '98103', 'US', 'Fremont',      47.6504, -122.3507 from public.cafes c where c.name = 'The Vinyl Pour'
union all
select c.id, 'Wallingford',  '1802 N 45th St',         'Seattle', 'WA', '98103', 'US', 'Wallingford',  47.6612, -122.3352 from public.cafes c where c.name = 'Cloud Nine Coffee'
union all
select c.id, 'Ballard',      '5500 Leary Ave NW',      'Seattle', 'WA', '98107', 'US', 'Ballard',      47.6654, -122.3760 from public.cafes c where c.name = 'Ember & Oak'
union all
select c.id, 'West Seattle', '2900 Alki Ave SW',       'Seattle', 'WA', '98116', 'US', 'Alki Beach',   47.5808, -122.4115 from public.cafes c where c.name = 'Saltwater Café'
union all
select c.id, 'University',   '4520 University Way NE', 'Seattle', 'WA', '98105', 'US', 'U-District',   47.6625, -122.3131 from public.cafes c where c.name = 'The Bookshelf Brew'
union all
select c.id, 'Downtown',     '1424 4th Ave',           'Seattle', 'WA', '98101', 'US', 'Downtown',     47.6097, -122.3379 from public.cafes c where c.name = 'Sunrise Social'
union all
select c.id, 'Capitol Hill', '805 E Pike St',          'Seattle', 'WA', '98102', 'US', 'Capitol Hill', 47.6142, -122.3199 from public.cafes c where c.name = 'Sunrise Social'
union all
select c.id, 'Queen Anne',   '1810 Queen Anne Ave N',  'Seattle', 'WA', '98109', 'US', 'Queen Anne',   47.6360, -122.3572 from public.cafes c where c.name = 'Wildflower Roast';

-- SEED DATA: Café tags
insert into public.cafe_tags (cafe_id, tag)
select c.id, t.tag from public.cafes c, unnest(array['cozy','quiet','vintage']) as t(tag)        where c.name = 'Morning Fog Roasters'
union all
select c.id, t.tag from public.cafes c, unnest(array['bright','plants','healthy']) as t(tag)     where c.name = 'Timber & Bloom'
union all
select c.id, t.tag from public.cafes c, unnest(array['music','social','retro']) as t(tag)        where c.name = 'The Vinyl Pour'
union all
select c.id, t.tag from public.cafes c, unnest(array['minimal','dreamy','instagram']) as t(tag)  where c.name = 'Cloud Nine Coffee'
union all
select c.id, t.tag from public.cafes c, unnest(array['cozy','warm','fireplace']) as t(tag)       where c.name = 'Ember & Oak'
union all
select c.id, t.tag from public.cafes c, unnest(array['bright','coastal','relaxing']) as t(tag)   where c.name = 'Saltwater Café'
union all
select c.id, t.tag from public.cafes c, unnest(array['quiet','books','cozy']) as t(tag)          where c.name = 'The Bookshelf Brew'
union all
select c.id, t.tag from public.cafes c, unnest(array['energetic','social','morning']) as t(tag)  where c.name = 'Sunrise Social'
union all
select c.id, t.tag from public.cafes c, unnest(array['garden','romantic','aesthetic']) as t(tag)  where c.name = 'Wildflower Roast';

-- SEED DATA: Bingo challenges (current week)
insert into public.bingo_challenges (icon, title, position, week_of) values
  ('🥛', 'Try oat milk',          0,  current_date - extract(dow from current_date)::int),
  ('🌅', 'Go before 7am',         1,  current_date - extract(dow from current_date)::int),
  ('🎨', 'Latte art photo',       2,  current_date - extract(dow from current_date)::int),
  ('👋', 'Learn barista name',    3,  current_date - extract(dow from current_date)::int),
  ('📖', 'Read at a café',        4,  current_date - extract(dow from current_date)::int),
  ('🌧️', 'Rainy day visit',       5,  current_date - extract(dow from current_date)::int),
  ('👥', 'Bring a friend',        6,  current_date - extract(dow from current_date)::int),
  ('🫖', 'Try a pour-over',       7,  current_date - extract(dow from current_date)::int),
  ('📸', 'Post a café photo',     8,  current_date - extract(dow from current_date)::int),
  ('🍫', 'Order a mocha',         9,  current_date - extract(dow from current_date)::int),
  ('🆕', 'Visit somewhere new',   10, current_date - extract(dow from current_date)::int),
  ('💬', 'Ask for a rec',         11, current_date - extract(dow from current_date)::int),
  ('🧁', 'Try a pastry',          12, current_date - extract(dow from current_date)::int),
  ('☕', 'Black coffee day',      13, current_date - extract(dow from current_date)::int),
  ('🎵', 'Shazam café music',     14, current_date - extract(dow from current_date)::int),
  ('🌿', 'Sit outside',           15, current_date - extract(dow from current_date)::int);

-- SEED DATA: A sample daily challenge
insert into public.daily_challenges (emoji, title, description, xp_reward, challenge_date, slot) values
  ('🌧️', 'Rainy Day Explorer', 'Visit a new café while it''s raining. Double XP today!', 50, current_date, 1);
