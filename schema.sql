-- ================================================================
-- Menu App — Supabase Schema
-- Run this entire file in Supabase > SQL Editor > New Query
-- ================================================================

-- ── 1. Extensions ─────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── 2. Enums ──────────────────────────────────────────────────
create type member_role      as enum ('owner', 'member');
create type cuisine_type     as enum ('italian','mexican','chinese','japanese','indian','american','mediterranean','thai','french','middle-eastern','korean','other');
create type carb_type        as enum ('rice','pasta','bread','potato','noodles','none','other');
create type protein_type     as enum ('chicken','beef','pork','fish','shrimp','tofu','lamb','eggs','none','other');
create type storage_location as enum ('fridge','freezer','pantry','other');
create type ingredient_unit  as enum ('g','ml','kg','l','oz','lb','cup','tbsp','tsp','qty','piece','pack','bag','bottle');
create type vote_type        as enum ('yes','no','super');
create type meal_type        as enum ('breakfast','lunch','dinner');
create type grocery_category as enum ('produce','dairy-eggs','meat-seafood','frozen','pantry','snacks-drinks','bakery','household','other');

-- ── 3. Tables ─────────────────────────────────────────────────

create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users on delete cascade,
  invite_code text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         member_role not null default 'member',
  joined_at    timestamptz not null default now(),
  unique (household_id, user_id)
);

create table recipes (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text not null default '',
  cuisine           cuisine_type not null default 'other',
  carb_type         carb_type not null default 'none',
  protein_type      protein_type not null default 'none',
  prep_time_min     int not null default 0,
  cook_time_min     int not null default 0,
  servings          int not null default 2,
  estimated_price   numeric(8,2),
  emoji             text not null default '🍽️',
  bg_color          text not null default '#1e293b',
  advance_prep_days int not null default 0,
  advance_prep_note text,
  is_global         boolean not null default false,
  household_id      uuid references households on delete cascade,
  created_by        uuid references auth.users on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table recipe_ingredients (
  id               uuid primary key default gen_random_uuid(),
  recipe_id        uuid not null references recipes on delete cascade,
  name             text not null,
  amount           numeric not null,
  unit             ingredient_unit not null default 'qty',
  storage_location storage_location not null default 'pantry',
  sort_order       int not null default 0
);

create table recipe_steps (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references recipes on delete cascade,
  step_order  int not null,
  instruction text not null
);

create table votes (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households on delete cascade,
  user_id         uuid not null references auth.users on delete cascade,
  recipe_id       uuid not null references recipes on delete cascade,
  week_start_date date not null,
  vote            vote_type not null,
  voted_at        timestamptz not null default now(),
  unique (household_id, user_id, recipe_id, week_start_date)
);

create table meal_plans (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households on delete cascade,
  week_start_date date not null,
  created_by      uuid references auth.users on delete set null,
  finalized_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (household_id, week_start_date)
);

create table meal_plan_slots (
  id           uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references meal_plans on delete cascade,
  recipe_id    uuid not null references recipes on delete cascade,
  day_of_week  int not null check (day_of_week between 0 and 6), -- 0=Monday
  meal_type    meal_type not null,
  created_at   timestamptz not null default now(),
  unique (meal_plan_id, day_of_week, meal_type)
);

create table grocery_lists (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references households on delete cascade,
  week_start_date   date not null,
  created_at        timestamptz not null default now(),
  pantry_checked_at timestamptz,
  unique (household_id, week_start_date)
);

create table grocery_items (
  id              uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null references grocery_lists on delete cascade,
  name            text not null,
  amount          numeric,
  unit            ingredient_unit,
  category        grocery_category not null default 'other',
  is_standalone   boolean not null default false,
  recipe_id       uuid references recipes on delete set null,
  checked         boolean not null default false,
  pantry_confirmed boolean not null default false,
  added_by        uuid references auth.users on delete set null,
  created_at      timestamptz not null default now()
);

-- ── 4. Functions ──────────────────────────────────────────────

-- Returns the current user's household_id (null if not in any)
create or replace function my_household_id()
returns uuid language sql stable security definer as $$
  select household_id
  from   household_members
  where  user_id = auth.uid()
  limit  1;
$$;

-- Returns the ISO week-start Monday for any date
create or replace function week_start(d date)
returns date language sql immutable as $$
  select d - (extract(isodow from d)::int - 1);
$$;

-- Generates a random 6-char uppercase alphanumeric invite code
create or replace function generate_invite_code()
returns text language sql volatile as $$
  select upper(substring(md5(gen_random_uuid()::text), 1, 6));
$$;

-- Finalises a meal plan (sets finalized_at to now)
create or replace function finalize_meal_plan(plan_id uuid)
returns text language plpgsql security definer as $$
begin
  update meal_plans
  set    finalized_at = now(),
         updated_at   = now()
  where  id           = plan_id
    and  household_id = my_household_id();
  return plan_id::text;
end;
$$;

-- ── 5. Auto-create profile on sign-up ────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 6. Row Level Security ─────────────────────────────────────

alter table profiles           enable row level security;
alter table households         enable row level security;
alter table household_members  enable row level security;
alter table recipes            enable row level security;
alter table recipe_ingredients enable row level security;
alter table recipe_steps       enable row level security;
alter table votes              enable row level security;
alter table meal_plans         enable row level security;
alter table meal_plan_slots    enable row level security;
alter table grocery_lists      enable row level security;
alter table grocery_items      enable row level security;

-- profiles
create policy "profiles: anyone can read"
  on profiles for select using (true);

create policy "profiles: update own"
  on profiles for update using (id = auth.uid());

-- households
create policy "households: members can read"
  on households for select
  using (id = my_household_id());

create policy "households: owner can insert"
  on households for insert
  with check (owner_id = auth.uid());

create policy "households: owner can update"
  on households for update
  using (owner_id = auth.uid());

-- household_members
create policy "household_members: members can read"
  on household_members for select
  using (household_id = my_household_id());

create policy "household_members: insert own"
  on household_members for insert
  with check (user_id = auth.uid());

create policy "household_members: leave or owner removes"
  on household_members for delete
  using (
    user_id = auth.uid()
    or household_id in (select id from households where owner_id = auth.uid())
  );

-- recipes (global = visible to all authenticated; household = members only)
create policy "recipes: read global or own household"
  on recipes for select
  using (
    is_global = true
    or household_id = my_household_id()
    or created_by = auth.uid()
  );

create policy "recipes: insert own"
  on recipes for insert
  with check (created_by = auth.uid());

create policy "recipes: update own"
  on recipes for update
  using (created_by = auth.uid());

create policy "recipes: delete own"
  on recipes for delete
  using (created_by = auth.uid());

-- recipe_ingredients
create policy "recipe_ingredients: read"
  on recipe_ingredients for select
  using (
    exists (
      select 1 from recipes r
      where r.id = recipe_id
        and (r.is_global or r.household_id = my_household_id() or r.created_by = auth.uid())
    )
  );

create policy "recipe_ingredients: write own recipe"
  on recipe_ingredients for all
  using (
    exists (select 1 from recipes r where r.id = recipe_id and r.created_by = auth.uid())
  )
  with check (
    exists (select 1 from recipes r where r.id = recipe_id and r.created_by = auth.uid())
  );

-- recipe_steps
create policy "recipe_steps: read"
  on recipe_steps for select
  using (
    exists (
      select 1 from recipes r
      where r.id = recipe_id
        and (r.is_global or r.household_id = my_household_id() or r.created_by = auth.uid())
    )
  );

create policy "recipe_steps: write own recipe"
  on recipe_steps for all
  using (
    exists (select 1 from recipes r where r.id = recipe_id and r.created_by = auth.uid())
  )
  with check (
    exists (select 1 from recipes r where r.id = recipe_id and r.created_by = auth.uid())
  );

-- votes
create policy "votes: household members read"
  on votes for select
  using (household_id = my_household_id());

create policy "votes: insert own"
  on votes for insert
  with check (user_id = auth.uid() and household_id = my_household_id());

create policy "votes: update own"
  on votes for update
  using (user_id = auth.uid());

create policy "votes: delete own"
  on votes for delete
  using (user_id = auth.uid());

-- meal_plans
create policy "meal_plans: household members"
  on meal_plans for all
  using (household_id = my_household_id())
  with check (household_id = my_household_id());

-- meal_plan_slots
create policy "meal_plan_slots: household members"
  on meal_plan_slots for all
  using (
    exists (
      select 1 from meal_plans mp
      where mp.id = meal_plan_id and mp.household_id = my_household_id()
    )
  )
  with check (
    exists (
      select 1 from meal_plans mp
      where mp.id = meal_plan_id and mp.household_id = my_household_id()
    )
  );

-- grocery_lists
create policy "grocery_lists: household members"
  on grocery_lists for all
  using (household_id = my_household_id())
  with check (household_id = my_household_id());

-- grocery_items
create policy "grocery_items: household members"
  on grocery_items for all
  using (
    exists (
      select 1 from grocery_lists gl
      where gl.id = grocery_list_id and gl.household_id = my_household_id()
    )
  )
  with check (
    exists (
      select 1 from grocery_lists gl
      where gl.id = grocery_list_id and gl.household_id = my_household_id()
    )
  );
