-- GENERATED FILE — do not edit by hand.
-- Regenerate with: npm run generate:shared-schema
--
-- This installer is for the existing shared madeshed Supabase project only.
-- It creates a fully isolated PerfectPair schema without changing public.
begin;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'perfectpair') then
    raise exception 'The perfectpair schema already exists. Stop rather than mixing a second deployment into it.';
  end if;
end;
$$;

create schema perfectpair;
revoke all on schema perfectpair from public;

-- BEGIN 202609140001_initial_schema.sql
-- PerfectPair Bra MVP. Apply to a new Supabase project with `supabase db push`.
-- All product data is versioned and sourced. Automated ingestion never publishes
-- a candidate directly: it creates a reviewable record first.
create extension if not exists pgcrypto;

create type perfectpair.data_layer as enum ('manufacturer', 'community', 'editorial_lab');
create type perfectpair.source_kind as enum ('official', 'affiliate_feed', 'partner_api', 'public_page', 'community', 'lab');
create type perfectpair.confidence_level as enum ('emerging', 'developing', 'established', 'verified');
create type perfectpair.bra_style as enum ('t_shirt', 'balconette', 'plunge', 'full_coverage', 'wireless', 'bralette', 'minimizer', 'strapless', 'sports', 'nursing');
create type perfectpair.wire_type as enum ('underwire', 'wireless', 'flex_wire');
create type perfectpair.cup_construction as enum ('moulded', 'seamed', 'unlined', 'padded', 'spacer', 'soft_cup');
create type perfectpair.fit_label as enum ('runs_small', 'true_to_size', 'runs_large', 'varies');
create type perfectpair.review_visibility as enum ('anonymous_matching', 'private_only');
create type perfectpair.candidate_status as enum ('received', 'approved', 'needs_review', 'rejected', 'published');
create type perfectpair.availability_state as enum ('in_stock', 'low_stock', 'unknown', 'out_of_stock');

-- Private user data. The first release uses manual fields only: no photo,
-- body scan or appearance scoring is stored here.
create table perfectpair.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  height_cm numeric(5,1) check (height_cm between 100 and 250),
  weight_kg numeric(5,1) check (weight_kg between 25 and 300),
  underbust_snug_cm numeric(5,1) check (underbust_snug_cm between 55 and 150),
  underbust_loose_cm numeric(5,1) check (underbust_loose_cm between 55 and 160),
  bust_standing_cm numeric(5,1) check (bust_standing_cm between 60 and 200),
  bust_leaning_cm numeric(5,1) check (bust_leaning_cm between 60 and 220),
  current_band_size integer check (current_band_size between 24 and 54),
  current_cup_size text check (char_length(current_cup_size) between 1 and 4),
  known_working_bra text,
  known_problem_bra text,
  root_width text check (root_width in ('narrow', 'average', 'wide', 'unknown')),
  projection text check (projection in ('shallow', 'average', 'projected', 'unknown')),
  preferred_wire text check (preferred_wire in ('any', 'underwire', 'wireless', 'flex_wire')),
  common_use_cases text[] not null default '{}',
  fit_priorities text[] not null default '{}',
  avoid_issues text[] not null default '{}',
  profile_matching_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table perfectpair.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  country_code char(2),
  website_url text,
  size_system text check (size_system in ('US_CA', 'UK', 'EU', 'AU_NZ', 'brand_specific')),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A product is a model/family. Each purchasable colour and size is a variant.
create table perfectpair.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references perfectpair.brands(id),
  slug text not null unique,
  name text not null,
  family text,
  description text,
  style perfectpair.bra_style not null,
  wire perfectpair.wire_type not null,
  cup_construction perfectpair.cup_construction not null,
  support_level smallint check (support_level between 1 and 5),
  material_composition jsonb not null default '[]'::jsonb,
  features text[] not null default '{}',
  use_cases text[] not null default '{}',
  fit perfectpair.fit_label not null default 'varies',
  fit_notes text[] not null default '{}',
  size_system text not null check (size_system in ('US_CA', 'UK', 'EU', 'AU_NZ', 'brand_specific')),
  size_range text,
  band_range int4range,
  cup_range jsonb not null default '[]'::jsonb,
  construction jsonb not null default '{}'::jsonb,
  official_url text,
  lifecycle_status text not null default 'active' check (lifecycle_status in ('active', 'discontinued', 'unconfirmed')),
  current_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, name)
);

create table perfectpair.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references perfectpair.products(id) on delete cascade,
  external_sku text,
  colour_name text,
  colour_family text,
  size_label text,
  upc text,
  attributes jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, external_sku)
);

-- Normalizes a maker's label into the comparison layer. A mapping can be
-- versioned when a brand changes a chart without rewriting historic evidence.
create table perfectpair.bra_size_mappings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references perfectpair.products(id) on delete cascade,
  variant_id uuid references perfectpair.product_variants(id) on delete cascade,
  brand_size_label text not null,
  canonical_band integer check (canonical_band between 24 and 54),
  canonical_cup text,
  size_system text not null check (size_system in ('US_CA', 'UK', 'EU', 'AU_NZ', 'brand_specific')),
  source_observation_id uuid,
  confidence perfectpair.confidence_level not null default 'emerging',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (product_id is not null or variant_id is not null)
);

-- Field-level provenance makes manufacturer claims, community evidence and lab
-- testing distinct instead of collapsing them into a single opaque record.
create table perfectpair.product_observations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references perfectpair.products(id) on delete cascade,
  variant_id uuid references perfectpair.product_variants(id) on delete cascade,
  field_name text not null,
  value jsonb not null,
  data_layer perfectpair.data_layer not null,
  source_kind perfectpair.source_kind not null,
  source_name text not null,
  source_url text,
  confidence perfectpair.confidence_level not null default 'emerging',
  observed_at timestamptz not null,
  verified_at timestamptz,
  ingestion_run_id uuid,
  created_at timestamptz not null default now(),
  check (product_id is not null or variant_id is not null)
);
create index product_observations_product_idx on perfectpair.product_observations(product_id, field_name, observed_at desc);

create table perfectpair.product_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references perfectpair.products(id) on delete cascade,
  version text not null,
  change_kind text not null check (change_kind in ('created', 'specification', 'size_chart', 'price', 'availability', 'editorial', 'merged')),
  snapshot jsonb not null,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(product_id, version)
);

create table perfectpair.product_prices (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references perfectpair.product_variants(id) on delete cascade,
  retailer_name text not null,
  retailer_url text,
  currency char(3) not null,
  amount numeric(10,2) not null check (amount >= 0),
  price_type text not null check (price_type in ('list', 'sale')),
  observed_at timestamptz not null,
  source_observation_id uuid references perfectpair.product_observations(id),
  unique (variant_id, retailer_name, currency, amount, price_type, observed_at)
);

create table perfectpair.product_availability (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references perfectpair.product_variants(id) on delete cascade,
  retailer_name text not null,
  availability perfectpair.availability_state not null default 'unknown',
  observed_at timestamptz not null,
  source_observation_id uuid references perfectpair.product_observations(id),
  unique (variant_id, retailer_name, observed_at)
);

create table perfectpair.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references perfectpair.products(id) on delete cascade,
  product_version text not null,
  author_id uuid references auth.users(id) on delete set null,
  size_bought text not null,
  overall numeric(2,1) not null check (overall between 1 and 5),
  comfort numeric(2,1) check (comfort between 1 and 5),
  band_comfort numeric(2,1) check (band_comfort between 1 and 5),
  cup_fit numeric(2,1) check (cup_fit between 1 and 5),
  wire_comfort numeric(2,1) check (wire_comfort between 1 and 5),
  strap_comfort numeric(2,1) check (strap_comfort between 1 and 5),
  stay_put numeric(2,1) check (stay_put between 1 and 5),
  side_support numeric(2,1) check (side_support between 1 and 5),
  breathability numeric(2,1) check (breathability between 1 and 5),
  durability numeric(2,1) check (durability between 1 and 5),
  size_accuracy numeric(2,1) check (size_accuracy between 1 and 5),
  value_score numeric(2,1) check (value_score between 1 and 5),
  sizing perfectpair.fit_label not null default 'varies',
  band_fit text check (band_fit in ('too_tight', 'secure', 'too_loose')),
  cup_fit_signal text check (cup_fit_signal in ('too_small', 'contained', 'too_large', 'shape_mismatch')),
  wire_fit text check (wire_fit in ('not_applicable', 'comfortable', 'too_narrow', 'too_wide', 'uncomfortable')),
  straps_fit text check (straps_fit in ('stayed_put', 'slipped', 'dug_in')),
  issues text[] not null default '{}',
  review_body text,
  profile_snapshot jsonb not null default '{}'::jsonb,
  profile_visibility perfectpair.review_visibility not null default 'private_only',
  moderation_state text not null default 'pending' check (moderation_state in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_product_published_idx on perfectpair.reviews(product_id, moderation_state, created_at desc);

create table perfectpair.bra_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references perfectpair.products(id) on delete cascade,
  variant_id uuid references perfectpair.product_variants(id) on delete set null,
  state text not null check (state in ('want_to_try', 'owned', 'repurchase', 'retired')),
  purchased_at date,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, product_id, variant_id)
);

create table perfectpair.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references perfectpair.products(id) on delete cascade,
  variant_id uuid references perfectpair.product_variants(id) on delete set null,
  target_price numeric(10,2) check (target_price >= 0),
  currency char(3) not null default 'USD',
  notify_stock boolean not null default false,
  active boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Ingestion storage supports official pages, authorized feeds/APIs, and manual
-- imports. A public page can be received only after policy review and remains
-- blocked from publishing until an accountable reviewer approves it.
create table perfectpair.ingestion_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  source_kind perfectpair.source_kind not null,
  base_url text,
  legal_basis text not null check (legal_basis in ('partner_authorized', 'public_product_page', 'manual_import')),
  crawl_policy jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table perfectpair.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references perfectpair.ingestion_sources(id),
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  counts jsonb not null default '{}'::jsonb,
  log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table perfectpair.ingestion_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references perfectpair.ingestion_runs(id) on delete cascade,
  external_id text not null,
  canonical_url text not null,
  raw_payload jsonb not null,
  normalized_payload jsonb,
  field_sources jsonb not null default '{}'::jsonb,
  quality_score numeric(5,2),
  quality_reasons text[] not null default '{}',
  blocking_issues text[] not null default '{}',
  status perfectpair.candidate_status not null default 'received',
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  published_product_id uuid references perfectpair.products(id),
  created_at timestamptz not null default now(),
  unique(run_id, external_id)
);

create view perfectpair.product_scorecards as
select r.product_id,
  count(*) filter (where r.moderation_state = 'published') as review_count,
  round(avg(r.overall) filter (where r.moderation_state = 'published'), 1) as overall,
  round(avg(r.comfort) filter (where r.moderation_state = 'published'), 1) as comfort,
  round(avg(r.band_comfort) filter (where r.moderation_state = 'published'), 1) as band_comfort,
  round(avg(r.cup_fit) filter (where r.moderation_state = 'published'), 1) as cup_fit,
  round(avg(r.wire_comfort) filter (where r.moderation_state = 'published'), 1) as wire_comfort,
  round(avg(r.strap_comfort) filter (where r.moderation_state = 'published'), 1) as strap_comfort,
  round(avg(r.stay_put) filter (where r.moderation_state = 'published'), 1) as stay_put,
  round(avg(r.side_support) filter (where r.moderation_state = 'published'), 1) as side_support,
  round(avg(r.breathability) filter (where r.moderation_state = 'published'), 1) as breathability,
  round(avg(r.durability) filter (where r.moderation_state = 'published'), 1) as durability,
  round(avg(r.size_accuracy) filter (where r.moderation_state = 'published'), 1) as size_accuracy,
  round(avg(r.value_score) filter (where r.moderation_state = 'published'), 1) as value
from perfectpair.reviews r group by r.product_id;

alter table perfectpair.profiles enable row level security;
alter table perfectpair.bra_history enable row level security;
alter table perfectpair.price_alerts enable row level security;
alter table perfectpair.reviews enable row level security;
alter table perfectpair.brands enable row level security;
alter table perfectpair.products enable row level security;
alter table perfectpair.product_variants enable row level security;
alter table perfectpair.bra_size_mappings enable row level security;
alter table perfectpair.product_observations enable row level security;
alter table perfectpair.product_versions enable row level security;
alter table perfectpair.product_prices enable row level security;
alter table perfectpair.product_availability enable row level security;

create policy "users manage their own profile" on perfectpair.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "users manage their own bra history" on perfectpair.bra_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own alerts" on perfectpair.price_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public catalog is readable" on perfectpair.brands for select using (true);
create policy "public products are readable" on perfectpair.products for select using (true);
create policy "public variants are readable" on perfectpair.product_variants for select using (true);
create policy "public size maps are readable" on perfectpair.bra_size_mappings for select using (true);
create policy "public observations are readable" on perfectpair.product_observations for select using (true);
create policy "public product versions are readable" on perfectpair.product_versions for select using (true);
create policy "public prices are readable" on perfectpair.product_prices for select using (true);
create policy "public availability is readable" on perfectpair.product_availability for select using (true);
create policy "published community reviews are readable" on perfectpair.reviews for select using (moderation_state = 'published' or author_id = auth.uid());
create policy "users create their own reviews" on perfectpair.reviews for insert with check (auth.uid() = author_id);
create policy "users update their own pending reviews" on perfectpair.reviews for update using (auth.uid() = author_id and moderation_state = 'pending');

create or replace function perfectpair.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on perfectpair.profiles for each row execute procedure perfectpair.set_updated_at();
create trigger brands_updated_at before update on perfectpair.brands for each row execute procedure perfectpair.set_updated_at();
create trigger products_updated_at before update on perfectpair.products for each row execute procedure perfectpair.set_updated_at();
create trigger variants_updated_at before update on perfectpair.product_variants for each row execute procedure perfectpair.set_updated_at();
create trigger reviews_updated_at before update on perfectpair.reviews for each row execute procedure perfectpair.set_updated_at();

-- END 202609140001_initial_schema.sql


-- BEGIN 202609140002_fit_timeline_and_wear_events.sql
-- Living My Bra Profile + private Fit Diary. Events reference the dated
-- snapshot that existed at the time of wear; later profile edits never
-- retrospectively alter prior experience.
create type perfectpair.fit_snapshot_source as enum ('manual', 'wear_checkin');
create type perfectpair.bra_occasion as enum ('everyday', 'work', 'lounge', 'occasion', 'travel', 'exercise');
create type perfectpair.bra_goal as enum ('all_day_comfort', 'smooth_under_clothes', 'lift_and_shape', 'low_neckline', 'wire_free');
create type perfectpair.wear_band_feel as enum ('secure', 'noticeable', 'uncomfortable');
create type perfectpair.wear_cup_containment as enum ('contained', 'minor_issue', 'not_right');
create type perfectpair.wear_wire_feel as enum ('not_applicable', 'comfortable', 'noticeable', 'painful');
create type perfectpair.wear_strap_feel as enum ('stayed_put', 'slipped', 'dug_in');
create type perfectpair.wear_repurchase_signal as enum ('yes', 'maybe', 'no');
create type perfectpair.bra_fit_issue as enum ('band_digs', 'band_rides_up', 'cup_spillage', 'cup_gaping', 'wire_pokes', 'wire_on_tissue', 'straps_slip', 'straps_dig', 'gore_floats', 'side_spillage', 'cups_shift', 'none');

create table perfectpair.fit_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source perfectpair.fit_snapshot_source not null default 'manual',
  label text,
  -- Private manual fit data only; no image or appearance score.
  profile_snapshot jsonb not null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index fit_snapshots_user_recorded_idx on perfectpair.fit_snapshots(user_id, recorded_at desc);

create table perfectpair.wear_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references perfectpair.products(id) on delete cascade,
  product_version text not null,
  fit_snapshot_id uuid not null references perfectpair.fit_snapshots(id) on delete restrict,
  occasion perfectpair.bra_occasion not null,
  goal perfectpair.bra_goal not null,
  outfit_label text,
  hours_expected smallint check (hours_expected between 1 and 24),
  band_feel perfectpair.wear_band_feel not null,
  cup_containment perfectpair.wear_cup_containment not null,
  wire_feel perfectpair.wear_wire_feel not null,
  strap_feel perfectpair.wear_strap_feel not null,
  would_wear_again perfectpair.wear_repurchase_signal not null,
  issue perfectpair.bra_fit_issue not null default 'none',
  created_at timestamptz not null default now()
);
create index wear_events_user_product_idx on perfectpair.wear_events(user_id, product_id, created_at desc);

-- Durability is deliberately collected after enough wears or washing, rather
-- than treating a first impression as a durability verdict.
create table perfectpair.review_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references perfectpair.products(id) on delete cascade,
  review_id uuid references perfectpair.reviews(id) on delete set null,
  due_after_wears integer check (due_after_wears in (3, 5, 10)),
  due_after_wash boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'sent', 'completed', 'dismissed')),
  response jsonb,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table perfectpair.fit_snapshots enable row level security;
alter table perfectpair.wear_events enable row level security;
alter table perfectpair.review_followups enable row level security;
create policy "users manage their own fit snapshots" on perfectpair.fit_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own wear events" on perfectpair.wear_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own review followups" on perfectpair.review_followups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table perfectpair.fit_snapshots is 'Private dated My Bra Profile; later edits never overwrite historic fit.';
comment on table perfectpair.wear_events is 'Private Fit Diary outcome; never a body or appearance rating.';
comment on table perfectpair.review_followups is 'Durability evidence collected after sufficient use, not first wear.';

-- END 202609140002_fit_timeline_and_wear_events.sql


-- BEGIN 202609140003_unified_bra_tights_catalog.sql
-- PerfectPair unified catalog extension. Bras and tights share brands, source
-- policy and a reviewable ingestion flow, but retain category-specific facts.
-- This avoids the common mistake of forcing hosiery into bra-only fields such
-- as wire, cup construction and band/cup ranges.

do $$ begin
  create type perfectpair.tights_style as enum ('sheer', 'semi_opaque', 'opaque', 'shaping', 'thermal', 'patterned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type perfectpair.tights_opacity as enum ('ultra_sheer', 'sheer', 'semi_opaque', 'opaque');
exception when duplicate_object then null; end $$;

alter table perfectpair.profiles add column if not exists tights_profile jsonb not null default '{}'::jsonb;
alter table perfectpair.ingestion_sources add column if not exists allowed_categories text[] not null default array['bra', 'tights'];
alter table perfectpair.ingestion_sources add column if not exists refresh_interval_hours integer check (refresh_interval_hours between 1 and 720);
alter table perfectpair.ingestion_sources add column if not exists accountable_owner text;
alter table perfectpair.ingestion_candidates add column if not exists product_category text not null default 'bra' check (product_category in ('bra', 'tights'));

-- Category-specific product facts. The shared brand table remains the canonical
-- brand identity; every dynamic fact is versioned and keeps field provenance.
create table if not exists perfectpair.tights_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references perfectpair.brands(id),
  slug text not null unique,
  name text not null,
  family text,
  description text,
  style perfectpair.tights_style not null,
  denier smallint check (denier between 1 and 300),
  opacity perfectpair.tights_opacity not null,
  waist_construction text check (waist_construction in ('regular', 'high_waist', 'control_top', 'maternity')),
  toe_construction text check (toe_construction in ('reinforced', 'sheer', 'sandal', 'closed')),
  warmth_level smallint check (warmth_level between 1 and 5),
  compression_level smallint check (compression_level between 0 and 5),
  material_composition jsonb not null default '[]'::jsonb,
  features text[] not null default '{}',
  use_cases text[] not null default '{}',
  fit perfectpair.fit_label not null default 'varies',
  fit_notes text[] not null default '{}',
  size_system text not null default 'brand_specific',
  size_range text,
  official_url text,
  lifecycle_status text not null default 'active' check (lifecycle_status in ('active', 'discontinued', 'unconfirmed')),
  current_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, name)
);

create table if not exists perfectpair.tights_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references perfectpair.tights_products(id) on delete cascade,
  external_sku text,
  colour_name text,
  colour_family text,
  size_label text,
  upc text,
  attributes jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, external_sku)
);

create table if not exists perfectpair.tights_product_observations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references perfectpair.tights_products(id) on delete cascade,
  variant_id uuid references perfectpair.tights_product_variants(id) on delete cascade,
  field_name text not null,
  value jsonb not null,
  data_layer perfectpair.data_layer not null,
  source_kind perfectpair.source_kind not null,
  source_name text not null,
  source_url text,
  confidence perfectpair.confidence_level not null default 'emerging',
  observed_at timestamptz not null,
  verified_at timestamptz,
  ingestion_run_id uuid references perfectpair.ingestion_runs(id),
  created_at timestamptz not null default now(),
  check (product_id is not null or variant_id is not null)
);
create index if not exists tights_observations_product_idx on perfectpair.tights_product_observations(product_id, field_name, observed_at desc);

create table if not exists perfectpair.tights_product_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references perfectpair.tights_products(id) on delete cascade,
  version text not null,
  change_kind text not null check (change_kind in ('created', 'specification', 'size_chart', 'price', 'availability', 'editorial', 'merged')),
  snapshot jsonb not null,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(product_id, version)
);

create table if not exists perfectpair.tights_product_prices (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references perfectpair.tights_product_variants(id) on delete cascade,
  retailer_name text not null,
  retailer_url text,
  currency char(3) not null,
  amount numeric(10,2) not null check (amount >= 0),
  price_type text not null check (price_type in ('list', 'sale')),
  observed_at timestamptz not null,
  source_observation_id uuid references perfectpair.tights_product_observations(id),
  unique (variant_id, retailer_name, currency, amount, price_type, observed_at)
);

create table if not exists perfectpair.tights_product_availability (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references perfectpair.tights_product_variants(id) on delete cascade,
  retailer_name text not null,
  availability perfectpair.availability_state not null default 'unknown',
  observed_at timestamptz not null,
  source_observation_id uuid references perfectpair.tights_product_observations(id),
  unique (variant_id, retailer_name, observed_at)
);

-- Ratings are category-specific by design. A bra's cup-fit field is never
-- repurposed as hosiery evidence; both scorecards still expose the same audit
-- trail, moderation state and version that was worn.
create table if not exists perfectpair.tights_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references perfectpair.tights_products(id) on delete cascade,
  product_version text not null,
  author_id uuid references auth.users(id) on delete set null,
  size_bought text not null,
  overall numeric(2,1) not null check (overall between 1 and 5),
  comfort numeric(2,1) check (comfort between 1 and 5),
  waist_comfort numeric(2,1) check (waist_comfort between 1 and 5),
  coverage numeric(2,1) check (coverage between 1 and 5),
  stay_put numeric(2,1) check (stay_put between 1 and 5),
  toe_comfort numeric(2,1) check (toe_comfort between 1 and 5),
  breathability numeric(2,1) check (breathability between 1 and 5),
  durability numeric(2,1) check (durability between 1 and 5),
  size_accuracy numeric(2,1) check (size_accuracy between 1 and 5),
  value_score numeric(2,1) check (value_score between 1 and 5),
  sizing perfectpair.fit_label not null default 'varies',
  issues text[] not null default '{}',
  review_body text,
  profile_snapshot jsonb not null default '{}'::jsonb,
  profile_visibility perfectpair.review_visibility not null default 'private_only',
  moderation_state text not null default 'pending' check (moderation_state in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tights_reviews_product_published_idx on perfectpair.tights_reviews(product_id, moderation_state, created_at desc);

create table if not exists perfectpair.tights_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references perfectpair.tights_products(id) on delete cascade,
  variant_id uuid references perfectpair.tights_product_variants(id) on delete set null,
  state text not null check (state in ('want_to_try', 'owned', 'repurchase', 'retired')),
  purchased_at date,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, product_id, variant_id)
);

create view perfectpair.tights_product_scorecards as
select r.product_id,
  count(*) filter (where r.moderation_state = 'published') as review_count,
  round(avg(r.overall) filter (where r.moderation_state = 'published'), 1) as overall,
  round(avg(r.comfort) filter (where r.moderation_state = 'published'), 1) as comfort,
  round(avg(r.waist_comfort) filter (where r.moderation_state = 'published'), 1) as waist_comfort,
  round(avg(r.coverage) filter (where r.moderation_state = 'published'), 1) as coverage,
  round(avg(r.stay_put) filter (where r.moderation_state = 'published'), 1) as stay_put,
  round(avg(r.toe_comfort) filter (where r.moderation_state = 'published'), 1) as toe_comfort,
  round(avg(r.breathability) filter (where r.moderation_state = 'published'), 1) as breathability,
  round(avg(r.durability) filter (where r.moderation_state = 'published'), 1) as durability,
  round(avg(r.size_accuracy) filter (where r.moderation_state = 'published'), 1) as size_accuracy,
  round(avg(r.value_score) filter (where r.moderation_state = 'published'), 1) as value_score
from perfectpair.tights_reviews r group by r.product_id;

alter table perfectpair.tights_products enable row level security;
alter table perfectpair.tights_product_variants enable row level security;
alter table perfectpair.tights_product_observations enable row level security;
alter table perfectpair.tights_product_versions enable row level security;
alter table perfectpair.tights_product_prices enable row level security;
alter table perfectpair.tights_product_availability enable row level security;
alter table perfectpair.tights_reviews enable row level security;
alter table perfectpair.tights_history enable row level security;

create policy "public tights are readable" on perfectpair.tights_products for select using (true);
create policy "public tights variants are readable" on perfectpair.tights_product_variants for select using (true);
create policy "public tights observations are readable" on perfectpair.tights_product_observations for select using (true);
create policy "public tights versions are readable" on perfectpair.tights_product_versions for select using (true);
create policy "public tights prices are readable" on perfectpair.tights_product_prices for select using (true);
create policy "public tights availability is readable" on perfectpair.tights_product_availability for select using (true);
create policy "published tights reviews are readable" on perfectpair.tights_reviews for select using (moderation_state = 'published' or author_id = auth.uid());
create policy "users create their own tights reviews" on perfectpair.tights_reviews for insert with check (auth.uid() = author_id);
create policy "users update their own pending tights reviews" on perfectpair.tights_reviews for update using (auth.uid() = author_id and moderation_state = 'pending');
create policy "users manage their own tights history" on perfectpair.tights_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger tights_products_updated_at before update on perfectpair.tights_products for each row execute procedure perfectpair.set_updated_at();
create trigger tights_variants_updated_at before update on perfectpair.tights_product_variants for each row execute procedure perfectpair.set_updated_at();
create trigger tights_reviews_updated_at before update on perfectpair.tights_reviews for each row execute procedure perfectpair.set_updated_at();

comment on column perfectpair.profiles.tights_profile is 'Private optional tights preferences; no image, body scan or appearance score.';
comment on table perfectpair.tights_product_observations is 'Field-level provenance for hosiery facts, separate from community and lab evidence.';
comment on table perfectpair.tights_reviews is 'Structured, moderated hosiery experience; not a generic star-only review.';

-- END 202609140003_unified_bra_tights_catalog.sql


-- BEGIN 202609140004_profile_privacy_controls.sql
-- Profile privacy controls. Fit facts remain private by default; any optional
-- contribution uses a purpose-specific consent record and an audit trail that
-- deliberately stores no measurements or free-text profile content.

do $$ begin
  create type perfectpair.privacy_event_type as enum (
    'anonymous_matching_enabled',
    'anonymous_matching_disabled',
    'insights_enabled',
    'insights_disabled',
    'export_requested',
    'deletion_requested'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type perfectpair.privacy_request_type as enum ('export', 'delete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type perfectpair.privacy_request_state as enum ('requested', 'in_progress', 'completed', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists perfectpair.profile_privacy_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Private matching is the user-requested purpose of this profile. It does
  -- not expose data to another member or a brand.
  private_matching_enabled boolean not null default true,
  -- Separate, affirmative choices. Both are off unless the user opts in.
  anonymous_matching_enabled boolean not null default false,
  aggregated_product_insights_enabled boolean not null default false,
  privacy_notice_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists perfectpair.tights_fit_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source perfectpair.fit_snapshot_source not null default 'manual',
  label text,
  -- Private manual size/preference record. No image or appearance score.
  profile_snapshot jsonb not null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists tights_fit_snapshots_user_recorded_idx on perfectpair.tights_fit_snapshots(user_id, recorded_at desc);

create table if not exists perfectpair.profile_privacy_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type perfectpair.privacy_event_type not null,
  -- Metadata may identify a policy version or request id, never profile facts.
  metadata jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);
create index if not exists profile_privacy_events_user_recorded_idx on perfectpair.profile_privacy_events(user_id, recorded_at desc);

create table if not exists perfectpair.privacy_data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type perfectpair.privacy_request_type not null,
  state perfectpair.privacy_request_state not null default 'requested',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  failure_reason text
);
create index if not exists privacy_data_requests_user_requested_idx on perfectpair.privacy_data_requests(user_id, requested_at desc);

alter table perfectpair.profile_privacy_preferences enable row level security;
alter table perfectpair.tights_fit_snapshots enable row level security;
alter table perfectpair.profile_privacy_events enable row level security;
alter table perfectpair.privacy_data_requests enable row level security;

create policy "users manage their own privacy preferences" on perfectpair.profile_privacy_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own tights fit snapshots" on perfectpair.tights_fit_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read their own privacy events" on perfectpair.profile_privacy_events for select using (auth.uid() = user_id);
create policy "users create their own privacy events" on perfectpair.profile_privacy_events for insert with check (auth.uid() = user_id);
create policy "users read their own privacy requests" on perfectpair.privacy_data_requests for select using (auth.uid() = user_id);
create policy "users create their own privacy requests" on perfectpair.privacy_data_requests for insert with check (auth.uid() = user_id);

create trigger profile_privacy_preferences_updated_at before update on perfectpair.profile_privacy_preferences for each row execute procedure perfectpair.set_updated_at();

comment on table perfectpair.profile_privacy_preferences is 'Purpose-specific privacy choices; anonymous contribution is opt-in and never required for a private match.';
comment on table perfectpair.tights_fit_snapshots is 'Private dated tights profile; later edits do not rewrite historic fit evidence.';
comment on table perfectpair.profile_privacy_events is 'Privacy audit metadata only; no measurement, size or profile free text is retained in this event log.';
comment on table perfectpair.privacy_data_requests is 'Account-level export/delete request workflow for the signed-in production service.';

-- END 202609140004_profile_privacy_controls.sql


-- BEGIN 202609140005_progressive_private_profile_matching.sql
-- Progressive private profiles and evidence-based matching.
--
-- The app must never make disclosure a condition of browsing. These tables keep
-- the new, optional fit details separate from a public-facing account identity,
-- version official hosiery charts, and preserve a user's own wear evidence.

create table if not exists perfectpair.private_fit_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version smallint not null default 2 check (schema_version between 1 and 99),
  -- Both objects are self-entered fit data. The expected shape is validated by
  -- the API schema before write; no photo, scan, health reason or appearance
  -- score is permitted in either object.
  bra_details jsonb not null default '{}'::jsonb check (jsonb_typeof(bra_details) = 'object'),
  tights_details jsonb not null default '{}'::jsonb check (jsonb_typeof(tights_details) = 'object'),
  bra_updated_at timestamptz,
  tights_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A private, structured record of a product the member has actually tried. It
-- is more useful for personalisation than collecting more body data, and it is
-- intentionally not a public review or anonymous training record.
create table if not exists perfectpair.personal_fit_references (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bra', 'tights')),
  bra_product_id uuid references perfectpair.products(id) on delete set null,
  tights_product_id uuid references perfectpair.tights_products(id) on delete set null,
  product_version text,
  brand_name text,
  product_name text,
  size_bought text,
  outcome text not null check (outcome in ('works', 'not_for_me', 'uncertain')),
  -- Enum-like signal codes only. No free-text body description is necessary for
  -- private matching; a separate moderated review owns any public text.
  fit_signals jsonb not null default '{}'::jsonb check (jsonb_typeof(fit_signals) = 'object'),
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object'),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (category = 'bra' and bra_product_id is not null and tights_product_id is null)
    or (category = 'tights' and tights_product_id is not null and bra_product_id is null)
    or (bra_product_id is null and tights_product_id is null)
  )
);
create index if not exists personal_fit_references_user_category_idx on perfectpair.personal_fit_references(user_id, category, recorded_at desc);

-- Official hosiery charts are their own versioned data layer. A chart is never
-- inferred from community answers; each cell retains a source observation URL
-- and capture date through the parent version.
create table if not exists perfectpair.tights_size_chart_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references perfectpair.tights_products(id) on delete cascade,
  source_observation_id uuid references perfectpair.tights_product_observations(id) on delete set null,
  source_url text not null,
  chart_version text not null,
  observed_at timestamptz not null,
  verified_at timestamptz,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, chart_version)
);
create unique index if not exists tights_one_current_chart_per_product_idx on perfectpair.tights_size_chart_versions(product_id) where is_current;

create table if not exists perfectpair.tights_size_chart_rows (
  id uuid primary key default gen_random_uuid(),
  chart_version_id uuid not null references perfectpair.tights_size_chart_versions(id) on delete cascade,
  size_label text not null,
  -- Null means the maker did not publish that dimension. The matching service
  -- must not invent a range or ask the member for an unused measurement.
  height_cm numrange,
  weight_kg numrange,
  waist_cm numrange,
  hip_cm numrange,
  inseam_cm numrange,
  notes text,
  created_at timestamptz not null default now(),
  unique (chart_version_id, size_label)
);
create index if not exists tights_size_chart_rows_version_idx on perfectpair.tights_size_chart_rows(chart_version_id);

alter table perfectpair.private_fit_profiles enable row level security;
alter table perfectpair.personal_fit_references enable row level security;
alter table perfectpair.tights_size_chart_versions enable row level security;
alter table perfectpair.tights_size_chart_rows enable row level security;

create policy "users manage their own private fit profile" on perfectpair.private_fit_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own personal fit references" on perfectpair.personal_fit_references
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public tights chart versions are readable" on perfectpair.tights_size_chart_versions for select using (true);
create policy "public tights chart rows are readable" on perfectpair.tights_size_chart_rows for select using (true);

create trigger private_fit_profiles_updated_at before update on perfectpair.private_fit_profiles for each row execute procedure perfectpair.set_updated_at();
create trigger personal_fit_references_updated_at before update on perfectpair.personal_fit_references for each row execute procedure perfectpair.set_updated_at();

comment on table perfectpair.private_fit_profiles is 'Private optional profile data, separated from display identity. API validation rejects photos, health explanations and appearance scoring.';
comment on table perfectpair.personal_fit_references is 'Private structured evidence from a member’s own wear experience; it is not public review content or model-training data.';
comment on table perfectpair.tights_size_chart_versions is 'Versioned manufacturer hosiery size charts with direct source provenance.';
comment on table perfectpair.tights_size_chart_rows is 'Published chart ranges only. Null dimensions are never inferred or requested by the matcher.';

-- END 202609140005_progressive_private_profile_matching.sql


-- BEGIN 202609140006_catalog_freshness_and_rights_controls.sql
-- Catalog freshness and content-rights controls.
--
-- A source cannot be activated because a URL happens to be perfectpair. Before any
-- scheduled fetch, it needs a current, reviewable rights decision stating what
-- automated access, fields and publication are allowed.

alter table perfectpair.ingestion_sources
  add column if not exists terms_url text,
  add column if not exists robots_url text,
  add column if not exists robots_policy text not null default 'honor' check (robots_policy in ('honor', 'not_applicable')),
  add column if not exists permitted_fields text[] not null default '{}',
  add column if not exists content_handling text not null default 'facts_and_short_attribution_only' check (content_handling in ('licensed_full_content', 'facts_and_short_attribution_only', 'manual_facts_only')),
  add column if not exists automated_access_permitted boolean not null default false,
  add column if not exists publication_permitted boolean not null default false,
  add column if not exists max_requests_per_minute integer check (max_requests_per_minute between 1 and 600),
  add column if not exists crawler_user_agent text,
  add column if not exists next_catalog_refresh_at timestamptz,
  add column if not exists next_price_refresh_at timestamptz,
  add column if not exists last_success_at timestamptz,
  add column if not exists paused_reason text;

create table if not exists perfectpair.source_rights_reviews (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references perfectpair.ingestion_sources(id) on delete cascade,
  policy_version text not null,
  status text not null check (status in ('draft', 'approved', 'expired', 'rejected', 'revoked')),
  legal_basis text not null check (legal_basis in ('partner_authorized', 'public_product_page', 'manual_import')),
  terms_url text,
  robots_url text,
  robots_snapshot text,
  allowed_fields text[] not null default '{}',
  content_handling text not null check (content_handling in ('licensed_full_content', 'facts_and_short_attribution_only', 'manual_facts_only')),
  automated_access_permitted boolean not null default false,
  publication_permitted boolean not null default false,
  evidence_reference text not null,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  unique(source_id, policy_version)
);
create unique index if not exists one_active_rights_review_per_source_idx on perfectpair.source_rights_reviews(source_id)
  where status = 'approved';

-- Resumable refresh state. `etag` and `last_modified` allow permitted sources
-- to return no-change responses; source credentials are never stored here.
create table if not exists perfectpair.source_refresh_checkpoints (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references perfectpair.ingestion_sources(id) on delete cascade,
  lane text not null check (lane in ('catalog', 'price_availability')),
  cursor text,
  etag text,
  last_modified text,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  next_due_at timestamptz,
  failure_count integer not null default 0 check (failure_count >= 0),
  last_error_code text,
  updated_at timestamptz not null default now(),
  unique(source_id, lane)
);
create index if not exists source_refresh_due_idx on perfectpair.source_refresh_checkpoints(lane, next_due_at);

alter table perfectpair.ingestion_runs
  add column if not exists refresh_lane text check (refresh_lane in ('catalog', 'price_availability')),
  add column if not exists trigger_kind text not null default 'manual' check (trigger_kind in ('manual', 'scheduled', 'retry')),
  add column if not exists idempotency_key text,
  add column if not exists rights_review_id uuid references perfectpair.source_rights_reviews(id),
  add column if not exists request_count integer not null default 0 check (request_count >= 0),
  add column if not exists no_change_count integer not null default 0 check (no_change_count >= 0);
create unique index if not exists ingestion_runs_idempotency_idx on perfectpair.ingestion_runs(source_id, idempotency_key)
  where idempotency_key is not null;

alter table perfectpair.ingestion_candidates
  add column if not exists source_etag text,
  add column if not exists source_last_modified text,
  add column if not exists content_fingerprint text,
  add column if not exists retention_expires_at timestamptz;
create index if not exists ingestion_candidates_fingerprint_idx on perfectpair.ingestion_candidates(content_fingerprint)
  where content_fingerprint is not null;

-- Rights-holder or brand reports are first-class operational events. They are
-- handled by a controlled workflow, never silently deleted or ignored.
create table if not exists perfectpair.catalog_rights_requests (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references perfectpair.ingestion_sources(id) on delete set null,
  product_id uuid references perfectpair.products(id) on delete set null,
  tights_product_id uuid references perfectpair.tights_products(id) on delete set null,
  request_type text not null check (request_type in ('copyright', 'trademark', 'terms', 'data_correction', 'other')),
  requester_contact text not null,
  reference_url text,
  claim_summary text not null,
  status text not null default 'received' check (status in ('received', 'under_review', 'actioned', 'rejected', 'closed')),
  action_summary text,
  received_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists catalog_rights_requests_open_idx on perfectpair.catalog_rights_requests(status, received_at desc);

alter table perfectpair.source_rights_reviews enable row level security;
alter table perfectpair.source_refresh_checkpoints enable row level security;
alter table perfectpair.catalog_rights_requests enable row level security;

create trigger source_refresh_checkpoints_updated_at before update on perfectpair.source_refresh_checkpoints for each row execute procedure perfectpair.set_updated_at();

comment on table perfectpair.source_rights_reviews is 'Immutable approval history for source terms, robots policy, permitted fields, automated access and publication scope.';
comment on table perfectpair.source_refresh_checkpoints is 'Per-source refresh state used for conditional requests, due scheduling, failure backoff and resumable ingestion.';
comment on table perfectpair.catalog_rights_requests is 'Rights-holder, brand and correction reports with accountable resolution; accessible only through authorized support/admin workflows.';

-- END 202609140006_catalog_freshness_and_rights_controls.sql


-- BEGIN 202609140007_brand_source_onboarding.sql
-- Brand-source onboarding is separate from live ingestion. Every listed brand
-- is a coverage target, not a claim that PerfectPair already has permission to
-- copy its catalogue. Credentials must live in a secrets manager, never here.

create table if not exists perfectpair.brand_source_targets (
  id text primary key,
  brand_name text not null,
  categories text[] not null check (cardinality(categories) > 0 and categories <@ array['bra', 'tights']),
  launch_wave integer not null check (launch_wave in (1, 2)),
  status text not null default 'awaiting_authorized_access' check (status in ('awaiting_authorized_access', 'evidence_collection', 'rights_review', 'feed_validation', 'ready_for_review', 'active', 'paused')),
  channel_order text[] not null default array['brand_claim_portal', 'retailer_or_distributor_feed', 'pim_or_gdsn_licensed_data', 'brand_provided_csv', 'physical_sample_audit', 'verified_contributor_evidence'],
  required_facts text[] not null,
  excluded_without_written_licence text[] not null,
  accountable_owner text,
  next_action text not null default 'Open a brand-claim record and collect either licensed commercial data or independent fit evidence; do not crawl public product pages.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_name, categories)
);

create table if not exists perfectpair.brand_source_submissions (
  id uuid primary key default gen_random_uuid(),
  brand_target_id text not null references perfectpair.brand_source_targets(id) on delete cascade,
  source_id uuid references perfectpair.ingestion_sources(id) on delete set null,
  channel text not null check (channel in ('brand_claim_portal', 'retailer_or_distributor_feed', 'pim_or_gdsn_licensed_data', 'brand_provided_csv', 'physical_sample_audit', 'verified_contributor_evidence')),
  status text not null default 'identified' check (status in ('identified', 'contact_ready', 'access_requested', 'access_granted', 'rights_review', 'sample_received', 'validated', 'rejected', 'paused')),
  partner_reference text,
  terms_url text,
  permission_scope text,
  evidence_reference text,
  requested_fields text[] not null default '{}',
  granted_fields text[] not null default '{}',
  licence_expiry_at timestamptz,
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_source_submissions_target_status_idx
  on perfectpair.brand_source_submissions(brand_target_id, status);

insert into perfectpair.brand_source_targets (id, brand_name, categories, launch_wave, required_facts, excluded_without_written_licence) values
  ('bra-aerie', 'Aerie', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-anita', 'Anita', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-bravissimo', 'Bravissimo', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-chantelle', 'Chantelle', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-curvy-kate', 'Curvy Kate', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-elomi', 'Elomi', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-evelyn-bobbie', 'Evelyn & Bobbie', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-felina', 'Felina', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-fantasie', 'Fantasie', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-freya', 'Freya', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-glamorise', 'Glamorise', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-harper-wilde', 'Harper Wilde', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-knix', 'Knix', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-le-mystere', 'Le Mystère', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-natori', 'Natori', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-panache', 'Panache', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-parfait', 'Parfait', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-primadonna', 'PrimaDonna', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-savage-x-fenty', 'Savage X Fenty', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-soma', 'Soma', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-thirdlove', 'ThirdLove', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-understance', 'Understance', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-wacoal', 'Wacoal', array['bra'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-warner-s', 'Warner''s', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-victoria-s-secret', 'Victoria''s Secret', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('bra-empreinte', 'Empreinte', array['bra'], 2, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('tights-commando', 'Commando', array['tights'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','denier','opacity','waist','toe','compression','material','sizeSystem','sizeChartVersion','sizeRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('tights-falke', 'Falke', array['tights'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','denier','opacity','waist','toe','compression','material','sizeSystem','sizeChartVersion','sizeRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('tights-heist', 'Heist', array['tights'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','denier','opacity','waist','toe','compression','material','sizeSystem','sizeChartVersion','sizeRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('tights-sheertex', 'Sheertex', array['tights'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','denier','opacity','waist','toe','compression','material','sizeSystem','sizeChartVersion','sizeRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('tights-spanx', 'Spanx', array['tights'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','denier','opacity','waist','toe','compression','material','sizeSystem','sizeChartVersion','sizeRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text']),
  ('tights-wolford', 'Wolford', array['tights'], 1, array['brand','productFamily','productName','merchantSku','canonicalProductUrl','variantId','denier','opacity','waist','toe','compression','material','sizeSystem','sizeChartVersion','sizeRange','price','currency','availability','countryOrMarket','lastUpdatedAt'], array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text'])
on conflict (id) do nothing;

alter table perfectpair.brand_source_targets enable row level security;
alter table perfectpair.brand_source_submissions enable row level security;

create trigger brand_source_targets_updated_at before update on perfectpair.brand_source_targets
  for each row execute procedure perfectpair.set_updated_at();
create trigger brand_source_submissions_updated_at before update on perfectpair.brand_source_submissions
  for each row execute procedure perfectpair.set_updated_at();

comment on table perfectpair.brand_source_targets is 'Every directory brand that must receive an authorised product-data source before publication.';
comment on table perfectpair.brand_source_submissions is 'Evidence-led onboarding trail for brand, affiliate or authorised retailer data channels. Never stores secrets.';

-- END 202609140007_brand_source_onboarding.sql


-- BEGIN 202609140008_independent_catalog_evidence.sql
-- A non-affiliate launch can use independently generated fit evidence, while
-- keeping commercial facts (price and stock) gated behind a licensed source.
-- This table never stores a receipt image, a body photo or copied brand text.

alter type perfectpair.source_kind add value if not exists 'retailer_feed';
alter type perfectpair.source_kind add value if not exists 'physical_audit';
alter type perfectpair.source_kind add value if not exists 'contributor_evidence';

alter table perfectpair.ingestion_sources drop constraint if exists ingestion_sources_legal_basis_check;
alter table perfectpair.ingestion_sources add constraint ingestion_sources_legal_basis_check
  check (legal_basis in ('partner_authorized', 'public_product_page', 'manual_import', 'first_party_measurement', 'verified_contributor_evidence'));

alter table perfectpair.source_rights_reviews drop constraint if exists source_rights_reviews_legal_basis_check;
alter table perfectpair.source_rights_reviews add constraint source_rights_reviews_legal_basis_check
  check (legal_basis in ('partner_authorized', 'public_product_page', 'manual_import', 'first_party_measurement', 'verified_contributor_evidence'));

create table if not exists perfectpair.catalog_independent_evidence (
  id uuid primary key default gen_random_uuid(),
  brand_target_id text not null references perfectpair.brand_source_targets(id) on delete cascade,
  product_id uuid references perfectpair.products(id) on delete set null,
  tights_product_id uuid references perfectpair.tights_products(id) on delete set null,
  evidence_kind text not null check (evidence_kind in ('physical_sample_audit', 'verified_contributor_evidence')),
  product_identifier text not null,
  observed_facts jsonb not null default '{}'::jsonb,
  fact_scope text[] not null default '{}',
  provenance_note text not null,
  ownership_or_consent_confirmed boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'verified', 'rejected', 'superseded')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (product_id is not null or tights_product_id is not null)
);

create index if not exists catalog_independent_evidence_target_status_idx
  on perfectpair.catalog_independent_evidence(brand_target_id, review_status, observed_at desc);

alter table perfectpair.catalog_independent_evidence enable row level security;

comment on table perfectpair.catalog_independent_evidence is 'Original physical-audit or consented contributor facts. No photos, receipt images, copied product copy, or personal measurements are stored here.';

-- END 202609140008_independent_catalog_evidence.sql


-- BEGIN 202609140009_catalog_contributions_and_gap_queue.sql
-- Community and brand reports are research leads, not automatic catalogue
-- content. The queue makes repeated requests visible without storing receipts,
-- photos, personal measurements, or copied creative product material.

create table if not exists perfectpair.catalog_contributions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('missing_product', 'correction', 'brand_claim')),
  category text not null check (category in ('bra', 'tights', 'both')),
  brand_name text not null check (char_length(brand_name) between 1 and 120),
  product_name text check (char_length(product_name) <= 180),
  variant_label text check (char_length(variant_label) <= 100),
  product_url text check (char_length(product_url) <= 2000),
  product_identifier text check (char_length(product_identifier) <= 100),
  observed_note text check (char_length(observed_note) <= 600),
  relationship text not null check (relationship in ('i_own_or_wore_it', 'i_found_a_reference', 'i_represent_the_brand', 'i_represent_a_retailer')),
  business_email text check (char_length(business_email) <= 254),
  preferred_update_method text check (preferred_update_method in ('claim_portal', 'csv', 'contact')),
  attested boolean not null default false,
  moderation_state text not null default 'received' check (moderation_state in ('received', 'deduplicated', 'source_review', 'verified', 'rejected', 'published', 'closed')),
  merged_into_gap_id uuid,
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((submission_type = 'brand_claim' and business_email is not null and preferred_update_method is not null and relationship = 'i_represent_the_brand') or submission_type <> 'brand_claim'),
  check ((submission_type = 'brand_claim') or product_name is not null)
);

create table if not exists perfectpair.catalog_gap_queue (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  category text not null check (category in ('bra', 'tights')),
  brand_name text not null,
  product_name text not null,
  priority_score integer not null default 1 check (priority_score >= 0),
  contribution_count integer not null default 1 check (contribution_count >= 1),
  resolution_state text not null default 'queued' check (resolution_state in ('queued', 'triage', 'awaiting_source', 'independent_audit', 'candidate_ready', 'resolved', 'not_supported')),
  assigned_source_id uuid references perfectpair.ingestion_sources(id) on delete set null,
  first_reported_at timestamptz not null default now(),
  last_reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table perfectpair.catalog_contributions
  add constraint catalog_contributions_gap_fk foreign key (merged_into_gap_id) references perfectpair.catalog_gap_queue(id) on delete set null;

create table if not exists perfectpair.catalog_discovery_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  source_type text not null check (source_type in ('brand_claim_portal', 'retailer_or_distributor_feed', 'pim_or_gdsn_licensed_data', 'brand_provided_csv', 'physical_sample_audit', 'verified_contributor_evidence')),
  source_id uuid references perfectpair.ingestion_sources(id) on delete set null,
  enabled boolean not null default false,
  supports_gap_discovery boolean not null default false,
  supports_commercial_updates boolean not null default false,
  allowed_categories text[] not null default array['bra', 'tights'] check (allowed_categories <@ array['bra', 'tights']),
  rights_review_id uuid references perfectpair.source_rights_reviews(id) on delete set null,
  next_run_at timestamptz,
  last_success_at timestamptz,
  paused_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((enabled = false) or (source_id is not null and rights_review_id is not null and supports_gap_discovery = true))
);

create or replace function perfectpair.queue_catalog_contribution() returns trigger language plpgsql as $$
declare
  next_gap_id uuid;
  next_dedupe_key text;
begin
  if new.submission_type = 'brand_claim' then
    return new;
  end if;

  next_dedupe_key := new.category || ':' || regexp_replace(lower(trim(new.brand_name) || ':' || trim(new.product_name)), '[^a-z0-9]+', '', 'g');
  insert into perfectpair.catalog_gap_queue (dedupe_key, category, brand_name, product_name)
    values (next_dedupe_key, new.category, new.brand_name, new.product_name)
  on conflict (dedupe_key) do update set
    contribution_count = perfectpair.catalog_gap_queue.contribution_count + 1,
    priority_score = perfectpair.catalog_gap_queue.priority_score + 1,
    last_reported_at = now(),
    updated_at = now()
  returning id into next_gap_id;

  new.merged_into_gap_id := next_gap_id;
  new.moderation_state := 'deduplicated';
  return new;
end;
$$;

create trigger queue_catalog_contribution_before_insert before insert on perfectpair.catalog_contributions
  for each row execute procedure perfectpair.queue_catalog_contribution();
create trigger catalog_contributions_updated_at before update on perfectpair.catalog_contributions
  for each row execute procedure perfectpair.set_updated_at();
create trigger catalog_gap_queue_updated_at before update on perfectpair.catalog_gap_queue
  for each row execute procedure perfectpair.set_updated_at();
create trigger catalog_discovery_sources_updated_at before update on perfectpair.catalog_discovery_sources
  for each row execute procedure perfectpair.set_updated_at();

create index if not exists catalog_gap_queue_priority_idx on perfectpair.catalog_gap_queue(resolution_state, priority_score desc, last_reported_at desc);
create index if not exists catalog_contributions_moderation_idx on perfectpair.catalog_contributions(moderation_state, created_at desc);

alter table perfectpair.catalog_contributions enable row level security;
alter table perfectpair.catalog_gap_queue enable row level security;
alter table perfectpair.catalog_discovery_sources enable row level security;

comment on table perfectpair.catalog_gap_queue is 'Deduplicated catalogue gaps from user reports and approved discovery sources. It prioritises research; it does not authorise crawling.';
comment on table perfectpair.catalog_discovery_sources is 'Approved discovery sources only. A source must have an ingestion source and active rights review before a scheduled gap run can use it.';

-- END 202609140009_catalog_contributions_and_gap_queue.sql


-- BEGIN 202609140010_gap_discovery_refresh_lane.sql
-- The existing daily catalog cron also runs this lane. It is limited to
-- sources already approved for gap discovery; it is not a web-crawling lane.

alter table perfectpair.source_refresh_checkpoints drop constraint if exists source_refresh_checkpoints_lane_check;
alter table perfectpair.source_refresh_checkpoints add constraint source_refresh_checkpoints_lane_check
  check (lane in ('catalog', 'price_availability', 'gap_discovery'));

alter table perfectpair.ingestion_runs drop constraint if exists ingestion_runs_refresh_lane_check;
alter table perfectpair.ingestion_runs add constraint ingestion_runs_refresh_lane_check
  check (refresh_lane in ('catalog', 'price_availability', 'gap_discovery'));

-- END 202609140010_gap_discovery_refresh_lane.sql


-- BEGIN 202609160001_admin_operations_console.sql
-- Private operator controls. This migration never grants the public read access
-- to private profiles, measurements, identity data, or operator notes.

alter table perfectpair.ingestion_candidates
  add column if not exists reviewer_note text check (char_length(reviewer_note) <= 1_000),
  add column if not exists published_tights_product_id uuid references perfectpair.tights_products(id) on delete set null;

create table if not exists perfectpair.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_label text not null default 'operator',
  action text not null check (char_length(action) between 1 and 80),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 120),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_entity_idx
  on perfectpair.admin_audit_events(entity_type, entity_id, created_at desc);

alter table perfectpair.admin_audit_events enable row level security;

comment on table perfectpair.admin_audit_events is 'Private operational audit trail. Metadata excludes profile measurements, emails, source credentials, copied descriptions, and image URLs.';
comment on column perfectpair.ingestion_candidates.reviewer_note is 'Operator decision note; no copied brand content or user personal data.';

-- END 202609160001_admin_operations_console.sql


-- BEGIN 202609160002_review_intake.sql
-- Every public review submission is recorded without copying profile
-- measurements or account identifiers. A record can only affect a public
-- scorecard after it is matched to a canonical product and moderated.

create table if not exists perfectpair.review_intake (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('bra', 'tights')),
  product_reference text not null check (char_length(product_reference) between 1 and 160),
  product_version text not null check (char_length(product_version) between 1 and 80),
  size_bought text not null check (char_length(size_bought) between 1 and 30),
  scores jsonb not null,
  fit_signals jsonb not null,
  issues text[] not null default '{}',
  profile_visibility perfectpair.review_visibility not null default 'private_only',
  canonical_bra_product_id uuid references perfectpair.products(id) on delete set null,
  canonical_tights_product_id uuid references perfectpair.tights_products(id) on delete set null,
  moderation_state text not null default 'requires_mapping'
    check (moderation_state in ('pending', 'requires_mapping', 'published', 'rejected')),
  reviewer_note text check (char_length(reviewer_note) <= 1_000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (category = 'bra' and canonical_tights_product_id is null)
    or (category = 'tights' and canonical_bra_product_id is null)
  )
);

create index if not exists review_intake_moderation_idx
  on perfectpair.review_intake(moderation_state, created_at desc);

alter table perfectpair.review_intake enable row level security;

comment on table perfectpair.review_intake is 'Private review intake. Never stores body measurements, profile snapshots, email, IP address, or authentication identifiers. Records without a canonical product require mapping before they can affect a public score.';

-- END 202609160002_review_intake.sql


-- BEGIN 202609170001_product_media_rights.sql
-- Product imagery is essential to consumer product discovery, but a publicly
-- reachable image URL is not a licence. This registry only accepts media with
-- an explicit display right and lets an operator remove it immediately.

create table if not exists perfectpair.product_media_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references perfectpair.products(id) on delete cascade,
  tights_product_id uuid references perfectpair.tights_products(id) on delete cascade,
  delivery_url text not null check (delivery_url ~ '^https://'),
  source_url text not null check (source_url ~ '^https://'),
  alt_text text not null check (char_length(alt_text) between 8 and 240),
  media_kind text not null default 'packshot' check (media_kind in ('packshot', 'detail', 'on_body', 'editorial', 'owned_photo')),
  rights_basis text not null check (rights_basis in ('brand_written_permission', 'authorised_feed', 'affiliate_feed', 'retailer_written_permission', 'owned_original_photo', 'contributor_license')),
  rights_evidence text not null check (char_length(rights_evidence) between 8 and 1000),
  attribution_text text check (char_length(attribution_text) <= 240),
  territory text not null default 'worldwide' check (char_length(territory) between 2 and 120),
  licence_expires_at timestamptz,
  rights_status text not null default 'approved' check (rights_status in ('draft', 'approved', 'expired', 'revoked')),
  is_primary boolean not null default false,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (product_id is not null and tights_product_id is null)
    or (product_id is null and tights_product_id is not null)
  )
);

create unique index if not exists one_primary_bra_media_asset_idx
  on perfectpair.product_media_assets(product_id)
  where product_id is not null and is_primary and rights_status = 'approved';
create unique index if not exists one_primary_tights_media_asset_idx
  on perfectpair.product_media_assets(tights_product_id)
  where tights_product_id is not null and is_primary and rights_status = 'approved';
create index if not exists product_media_assets_public_lookup_idx
  on perfectpair.product_media_assets(rights_status, licence_expires_at, product_id, tights_product_id);

alter table perfectpair.product_media_assets enable row level security;
create trigger product_media_assets_updated_at before update on perfectpair.product_media_assets
  for each row execute procedure perfectpair.set_updated_at();

comment on table perfectpair.product_media_assets is 'Approved product imagery only. Each asset has a product, source, display-right evidence, validity and revocation status. Never store user body photos or unlicensed image URLs.';

-- END 202609170001_product_media_rights.sql


-- BEGIN 202609170002_fit_network_lower_body_and_handoff.sql
-- Expand PerfectPair from intimate-apparel research into a multi-category fit
-- network. Leggings and jeans receive their own canonical records and review
-- fields; they are never coerced into bra or hosiery columns.
--
-- The handoff table is intentionally an owner-only planning record. It has no
-- price, payment, address, messaging, shipping, public-listing or escrow
-- field, so it cannot become an accidental in-app marketplace.

do $$ begin
  create type perfectpair.fit_product_category as enum ('leggings', 'jeans');
exception when duplicate_object then null; end $$;

alter table perfectpair.private_fit_profiles
  add column if not exists lower_body_details jsonb not null default '{}'::jsonb check (jsonb_typeof(lower_body_details) = 'object'),
  add column if not exists lower_body_updated_at timestamptz;

-- The legacy public profile table remains compatible with the local-first
-- client. Authenticated persistence uses private_fit_profiles instead.
alter table perfectpair.profiles
  add column if not exists lower_body_profile jsonb not null default '{}'::jsonb check (jsonb_typeof(lower_body_profile) = 'object');

alter table perfectpair.ingestion_candidates
  drop constraint if exists ingestion_candidates_product_category_check;
alter table perfectpair.ingestion_candidates
  add constraint ingestion_candidates_product_category_check
  check (product_category in ('bra', 'tights', 'leggings', 'jeans'));

create table if not exists perfectpair.fit_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references perfectpair.brands(id),
  category perfectpair.fit_product_category not null,
  slug text not null unique,
  name text not null,
  family text,
  description text,
  -- Category-specific source facts (for example rise, cut, fabric weight,
  -- compression or stretch). The key list is controlled by the ingestion
  -- schema and review UI, never inferred from prose.
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  material_composition jsonb not null default '[]'::jsonb check (jsonb_typeof(material_composition) = 'array'),
  features text[] not null default '{}',
  use_cases text[] not null default '{}',
  fit perfectpair.fit_label not null default 'varies',
  fit_notes text[] not null default '{}',
  size_system text not null default 'brand_specific',
  size_range text,
  official_url text,
  lifecycle_status text not null default 'active' check (lifecycle_status in ('active', 'discontinued', 'unconfirmed')),
  current_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, category, name)
);

create table if not exists perfectpair.fit_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references perfectpair.fit_products(id) on delete cascade,
  external_sku text,
  colour_name text,
  colour_family text,
  size_label text,
  upc text,
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, external_sku)
);

create table if not exists perfectpair.fit_product_observations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references perfectpair.fit_products(id) on delete cascade,
  variant_id uuid references perfectpair.fit_product_variants(id) on delete cascade,
  field_name text not null,
  value jsonb not null,
  data_layer perfectpair.data_layer not null,
  source_kind perfectpair.source_kind not null,
  source_name text not null,
  source_url text,
  confidence perfectpair.confidence_level not null default 'emerging',
  observed_at timestamptz not null,
  verified_at timestamptz,
  ingestion_run_id uuid references perfectpair.ingestion_runs(id),
  created_at timestamptz not null default now(),
  check (product_id is not null or variant_id is not null)
);
create index if not exists fit_product_observations_product_idx on perfectpair.fit_product_observations(product_id, field_name, observed_at desc);

create table if not exists perfectpair.fit_product_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references perfectpair.fit_products(id) on delete cascade,
  version text not null,
  change_kind text not null check (change_kind in ('created', 'specification', 'size_chart', 'price', 'availability', 'editorial', 'merged')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(product_id, version)
);

create table if not exists perfectpair.fit_product_prices (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references perfectpair.fit_product_variants(id) on delete cascade,
  retailer_name text not null,
  retailer_url text,
  currency char(3) not null,
  amount numeric(10,2) not null check (amount >= 0),
  price_type text not null check (price_type in ('list', 'sale')),
  observed_at timestamptz not null,
  source_observation_id uuid references perfectpair.fit_product_observations(id),
  unique (variant_id, retailer_name, currency, amount, price_type, observed_at)
);

create table if not exists perfectpair.fit_product_availability (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references perfectpair.fit_product_variants(id) on delete cascade,
  retailer_name text not null,
  availability perfectpair.availability_state not null default 'unknown',
  observed_at timestamptz not null,
  source_observation_id uuid references perfectpair.fit_product_observations(id),
  unique (variant_id, retailer_name, observed_at)
);

-- Metrics retain the category and schema version. This permits a leggings
-- review to use waist stability / compression while a jeans review uses rise /
-- inseam / seat fit, without falsely comparing unrelated factors.
create table if not exists perfectpair.fit_product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references perfectpair.fit_products(id) on delete cascade,
  product_version text not null,
  author_id uuid references auth.users(id) on delete set null,
  size_bought text not null check (char_length(size_bought) between 1 and 30),
  metric_schema_version smallint not null default 1 check (metric_schema_version between 1 and 99),
  scores jsonb not null check (jsonb_typeof(scores) = 'object'),
  fit_signals jsonb not null default '{}'::jsonb check (jsonb_typeof(fit_signals) = 'object'),
  issues text[] not null default '{}',
  profile_visibility perfectpair.review_visibility not null default 'private_only',
  moderation_state text not null default 'pending' check (moderation_state in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fit_product_reviews_product_published_idx on perfectpair.fit_product_reviews(product_id, moderation_state, created_at desc);

create or replace view perfectpair.fit_product_scorecards as
select r.product_id,
  count(*) filter (where r.moderation_state = 'published') as review_count,
  round(avg(case when (r.scores ->> 'overall') ~ '^[1-5](\\.[0-9])?$' then (r.scores ->> 'overall')::numeric end) filter (where r.moderation_state = 'published'), 1) as overall
from perfectpair.fit_product_reviews r
group by r.product_id;

alter table perfectpair.product_media_assets add column if not exists fit_product_id uuid references perfectpair.fit_products(id) on delete cascade;
alter table perfectpair.product_media_assets drop constraint if exists product_media_assets_check;
alter table perfectpair.product_media_assets add constraint product_media_assets_one_product_check
  check (num_nonnulls(product_id, tights_product_id, fit_product_id) = 1);
create unique index if not exists one_primary_fit_product_media_asset_idx
  on perfectpair.product_media_assets(fit_product_id)
  where fit_product_id is not null and is_primary and rights_status = 'approved';
create index if not exists product_media_assets_fit_product_lookup_idx
  on perfectpair.product_media_assets(rights_status, licence_expires_at, fit_product_id);

alter table perfectpair.personal_fit_references add column if not exists fit_product_id uuid references perfectpair.fit_products(id) on delete set null;
alter table perfectpair.personal_fit_references drop constraint if exists personal_fit_references_category_check;
alter table perfectpair.personal_fit_references add constraint personal_fit_references_category_check
  check (
    (category = 'bra' and bra_product_id is not null and tights_product_id is null and fit_product_id is null)
    or (category = 'tights' and tights_product_id is not null and bra_product_id is null and fit_product_id is null)
    or (category in ('leggings', 'jeans') and fit_product_id is not null and bra_product_id is null and tights_product_id is null)
    or (bra_product_id is null and tights_product_id is null and fit_product_id is null)
  );

alter table perfectpair.review_intake add column if not exists canonical_fit_product_id uuid references perfectpair.fit_products(id) on delete set null;
alter table perfectpair.review_intake drop constraint if exists review_intake_category_check;
alter table perfectpair.review_intake add constraint review_intake_category_check
  check (
    (category = 'bra' and canonical_tights_product_id is null and canonical_fit_product_id is null)
    or (category = 'tights' and canonical_bra_product_id is null and canonical_fit_product_id is null)
    or (category in ('leggings', 'jeans') and canonical_bra_product_id is null and canonical_tights_product_id is null)
  );

-- This never represents an offer, a sale, or a public listing. An owner can
-- optionally record that they listed an eligible outerwear item elsewhere.
create table if not exists perfectpair.pass_it_forward_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category perfectpair.fit_product_category not null,
  fit_product_id uuid references perfectpair.fit_products(id) on delete set null,
  product_label text not null check (char_length(product_label) between 1 and 160),
  size_label text not null check (char_length(size_label) between 1 and 30),
  condition_grade text not null check (condition_grade in ('new_with_tags', 'like_new', 'gently_worn')),
  external_marketplace text not null check (external_marketplace in ('vinted', 'depop', 'poshmark', 'other')),
  status text not null default 'draft' check (status in ('draft', 'listed_elsewhere', 'closed')),
  external_listing_url text check (external_listing_url is null or external_listing_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pass_it_forward_intents_user_status_idx on perfectpair.pass_it_forward_intents(user_id, status, updated_at desc);

alter table perfectpair.fit_products enable row level security;
alter table perfectpair.fit_product_variants enable row level security;
alter table perfectpair.fit_product_observations enable row level security;
alter table perfectpair.fit_product_versions enable row level security;
alter table perfectpair.fit_product_prices enable row level security;
alter table perfectpair.fit_product_availability enable row level security;
alter table perfectpair.fit_product_reviews enable row level security;
alter table perfectpair.pass_it_forward_intents enable row level security;

create policy "public fit products are readable" on perfectpair.fit_products for select using (true);
create policy "public fit variants are readable" on perfectpair.fit_product_variants for select using (true);
create policy "public fit observations are readable" on perfectpair.fit_product_observations for select using (true);
create policy "public fit versions are readable" on perfectpair.fit_product_versions for select using (true);
create policy "public fit prices are readable" on perfectpair.fit_product_prices for select using (true);
create policy "public fit availability is readable" on perfectpair.fit_product_availability for select using (true);
create policy "published fit reviews are readable" on perfectpair.fit_product_reviews for select using (moderation_state = 'published' or author_id = auth.uid());
create policy "users create their own fit reviews" on perfectpair.fit_product_reviews for insert with check (auth.uid() = author_id);
create policy "users update their own pending fit reviews" on perfectpair.fit_product_reviews for update using (auth.uid() = author_id and moderation_state = 'pending');
create policy "users manage their own pass it forward intents" on perfectpair.pass_it_forward_intents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger fit_products_updated_at before update on perfectpair.fit_products for each row execute procedure perfectpair.set_updated_at();
create trigger fit_product_variants_updated_at before update on perfectpair.fit_product_variants for each row execute procedure perfectpair.set_updated_at();
create trigger fit_product_reviews_updated_at before update on perfectpair.fit_product_reviews for each row execute procedure perfectpair.set_updated_at();
create trigger pass_it_forward_intents_updated_at before update on perfectpair.pass_it_forward_intents for each row execute procedure perfectpair.set_updated_at();

comment on column perfectpair.private_fit_profiles.lower_body_details is 'Private self-entered leggings and jeans fit facts. No photos, scans, health explanations or appearance scoring.';
comment on table perfectpair.fit_products is 'Canonical lower-body product record. Category-specific facts are source-backed and versioned; no bra or hosiery fields are reused.';
comment on table perfectpair.fit_product_reviews is 'Structured, moderated lower-body experience. Metric schema is category-specific and profile data is never copied into a public review.';
comment on table perfectpair.pass_it_forward_intents is 'Private owner-only external-listing preparation. No in-app price, payment, address, message, shipping or public marketplace function is permitted.';

-- END 202609170002_fit_network_lower_body_and_handoff.sql


-- The Data API may address this schema only after it is explicitly exposed in
-- Supabase Project Settings > API. RLS remains the access-control boundary.
grant usage on schema perfectpair to anon, authenticated, service_role;
grant select on all tables in schema perfectpair to anon;
grant select, insert, update, delete on all tables in schema perfectpair to authenticated;
grant all privileges on all tables in schema perfectpair to service_role;
grant usage, select on all sequences in schema perfectpair to anon, authenticated, service_role;

alter default privileges in schema perfectpair grant select on tables to anon;
alter default privileges in schema perfectpair grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema perfectpair grant all privileges on tables to service_role;
alter default privileges in schema perfectpair grant usage, select on sequences to anon, authenticated, service_role;

commit;
