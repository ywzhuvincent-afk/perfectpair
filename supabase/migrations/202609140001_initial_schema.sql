-- PerfectPair Bra MVP. Apply to a new Supabase project with `supabase db push`.
-- All product data is versioned and sourced. Automated ingestion never publishes
-- a candidate directly: it creates a reviewable record first.
create extension if not exists pgcrypto;

create type public.data_layer as enum ('manufacturer', 'community', 'editorial_lab');
create type public.source_kind as enum ('official', 'affiliate_feed', 'partner_api', 'public_page', 'community', 'lab');
create type public.confidence_level as enum ('emerging', 'developing', 'established', 'verified');
create type public.bra_style as enum ('t_shirt', 'balconette', 'plunge', 'full_coverage', 'wireless', 'bralette', 'minimizer', 'strapless', 'sports', 'nursing');
create type public.wire_type as enum ('underwire', 'wireless', 'flex_wire');
create type public.cup_construction as enum ('moulded', 'seamed', 'unlined', 'padded', 'spacer', 'soft_cup');
create type public.fit_label as enum ('runs_small', 'true_to_size', 'runs_large', 'varies');
create type public.review_visibility as enum ('anonymous_matching', 'private_only');
create type public.candidate_status as enum ('received', 'approved', 'needs_review', 'rejected', 'published');
create type public.availability_state as enum ('in_stock', 'low_stock', 'unknown', 'out_of_stock');

-- Private user data. The first release uses manual fields only: no photo,
-- body scan or appearance scoring is stored here.
create table public.profiles (
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

create table public.brands (
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
create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id),
  slug text not null unique,
  name text not null,
  family text,
  description text,
  style public.bra_style not null,
  wire public.wire_type not null,
  cup_construction public.cup_construction not null,
  support_level smallint check (support_level between 1 and 5),
  material_composition jsonb not null default '[]'::jsonb,
  features text[] not null default '{}',
  use_cases text[] not null default '{}',
  fit public.fit_label not null default 'varies',
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

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
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
create table public.bra_size_mappings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  brand_size_label text not null,
  canonical_band integer check (canonical_band between 24 and 54),
  canonical_cup text,
  size_system text not null check (size_system in ('US_CA', 'UK', 'EU', 'AU_NZ', 'brand_specific')),
  source_observation_id uuid,
  confidence public.confidence_level not null default 'emerging',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (product_id is not null or variant_id is not null)
);

-- Field-level provenance makes manufacturer claims, community evidence and lab
-- testing distinct instead of collapsing them into a single opaque record.
create table public.product_observations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  field_name text not null,
  value jsonb not null,
  data_layer public.data_layer not null,
  source_kind public.source_kind not null,
  source_name text not null,
  source_url text,
  confidence public.confidence_level not null default 'emerging',
  observed_at timestamptz not null,
  verified_at timestamptz,
  ingestion_run_id uuid,
  created_at timestamptz not null default now(),
  check (product_id is not null or variant_id is not null)
);
create index product_observations_product_idx on public.product_observations(product_id, field_name, observed_at desc);

create table public.product_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  version text not null,
  change_kind text not null check (change_kind in ('created', 'specification', 'size_chart', 'price', 'availability', 'editorial', 'merged')),
  snapshot jsonb not null,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(product_id, version)
);

create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  retailer_name text not null,
  retailer_url text,
  currency char(3) not null,
  amount numeric(10,2) not null check (amount >= 0),
  price_type text not null check (price_type in ('list', 'sale')),
  observed_at timestamptz not null,
  source_observation_id uuid references public.product_observations(id),
  unique (variant_id, retailer_name, currency, amount, price_type, observed_at)
);

create table public.product_availability (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  retailer_name text not null,
  availability public.availability_state not null default 'unknown',
  observed_at timestamptz not null,
  source_observation_id uuid references public.product_observations(id),
  unique (variant_id, retailer_name, observed_at)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
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
  sizing public.fit_label not null default 'varies',
  band_fit text check (band_fit in ('too_tight', 'secure', 'too_loose')),
  cup_fit_signal text check (cup_fit_signal in ('too_small', 'contained', 'too_large', 'shape_mismatch')),
  wire_fit text check (wire_fit in ('not_applicable', 'comfortable', 'too_narrow', 'too_wide', 'uncomfortable')),
  straps_fit text check (straps_fit in ('stayed_put', 'slipped', 'dug_in')),
  issues text[] not null default '{}',
  review_body text,
  profile_snapshot jsonb not null default '{}'::jsonb,
  profile_visibility public.review_visibility not null default 'private_only',
  moderation_state text not null default 'pending' check (moderation_state in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_product_published_idx on public.reviews(product_id, moderation_state, created_at desc);

create table public.bra_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  state text not null check (state in ('want_to_try', 'owned', 'repurchase', 'retired')),
  purchased_at date,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, product_id, variant_id)
);

create table public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
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
create table public.ingestion_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  source_kind public.source_kind not null,
  base_url text,
  legal_basis text not null check (legal_basis in ('partner_authorized', 'public_product_page', 'manual_import')),
  crawl_policy jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.ingestion_sources(id),
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  counts jsonb not null default '{}'::jsonb,
  log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ingestion_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ingestion_runs(id) on delete cascade,
  external_id text not null,
  canonical_url text not null,
  raw_payload jsonb not null,
  normalized_payload jsonb,
  field_sources jsonb not null default '{}'::jsonb,
  quality_score numeric(5,2),
  quality_reasons text[] not null default '{}',
  blocking_issues text[] not null default '{}',
  status public.candidate_status not null default 'received',
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  published_product_id uuid references public.products(id),
  created_at timestamptz not null default now(),
  unique(run_id, external_id)
);

create view public.product_scorecards as
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
from public.reviews r group by r.product_id;

alter table public.profiles enable row level security;
alter table public.bra_history enable row level security;
alter table public.price_alerts enable row level security;
alter table public.reviews enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.bra_size_mappings enable row level security;
alter table public.product_observations enable row level security;
alter table public.product_versions enable row level security;
alter table public.product_prices enable row level security;
alter table public.product_availability enable row level security;

create policy "users manage their own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "users manage their own bra history" on public.bra_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own alerts" on public.price_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public catalog is readable" on public.brands for select using (true);
create policy "public products are readable" on public.products for select using (true);
create policy "public variants are readable" on public.product_variants for select using (true);
create policy "public size maps are readable" on public.bra_size_mappings for select using (true);
create policy "public observations are readable" on public.product_observations for select using (true);
create policy "public product versions are readable" on public.product_versions for select using (true);
create policy "public prices are readable" on public.product_prices for select using (true);
create policy "public availability is readable" on public.product_availability for select using (true);
create policy "published community reviews are readable" on public.reviews for select using (moderation_state = 'published' or author_id = auth.uid());
create policy "users create their own reviews" on public.reviews for insert with check (auth.uid() = author_id);
create policy "users update their own pending reviews" on public.reviews for update using (auth.uid() = author_id and moderation_state = 'pending');

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger brands_updated_at before update on public.brands for each row execute procedure public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute procedure public.set_updated_at();
create trigger variants_updated_at before update on public.product_variants for each row execute procedure public.set_updated_at();
create trigger reviews_updated_at before update on public.reviews for each row execute procedure public.set_updated_at();
