-- PerfectPair unified catalog extension. Bras and tights share brands, source
-- policy and a reviewable ingestion flow, but retain category-specific facts.
-- This avoids the common mistake of forcing hosiery into bra-only fields such
-- as wire, cup construction and band/cup ranges.

do $$ begin
  create type public.tights_style as enum ('sheer', 'semi_opaque', 'opaque', 'shaping', 'thermal', 'patterned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tights_opacity as enum ('ultra_sheer', 'sheer', 'semi_opaque', 'opaque');
exception when duplicate_object then null; end $$;

alter table public.profiles add column if not exists tights_profile jsonb not null default '{}'::jsonb;
alter table public.ingestion_sources add column if not exists allowed_categories text[] not null default array['bra', 'tights'];
alter table public.ingestion_sources add column if not exists refresh_interval_hours integer check (refresh_interval_hours between 1 and 720);
alter table public.ingestion_sources add column if not exists accountable_owner text;
alter table public.ingestion_candidates add column if not exists product_category text not null default 'bra' check (product_category in ('bra', 'tights'));

-- Category-specific product facts. The shared brand table remains the canonical
-- brand identity; every dynamic fact is versioned and keeps field provenance.
create table if not exists public.tights_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id),
  slug text not null unique,
  name text not null,
  family text,
  description text,
  style public.tights_style not null,
  denier smallint check (denier between 1 and 300),
  opacity public.tights_opacity not null,
  waist_construction text check (waist_construction in ('regular', 'high_waist', 'control_top', 'maternity')),
  toe_construction text check (toe_construction in ('reinforced', 'sheer', 'sandal', 'closed')),
  warmth_level smallint check (warmth_level between 1 and 5),
  compression_level smallint check (compression_level between 0 and 5),
  material_composition jsonb not null default '[]'::jsonb,
  features text[] not null default '{}',
  use_cases text[] not null default '{}',
  fit public.fit_label not null default 'varies',
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

create table if not exists public.tights_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.tights_products(id) on delete cascade,
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

create table if not exists public.tights_product_observations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.tights_products(id) on delete cascade,
  variant_id uuid references public.tights_product_variants(id) on delete cascade,
  field_name text not null,
  value jsonb not null,
  data_layer public.data_layer not null,
  source_kind public.source_kind not null,
  source_name text not null,
  source_url text,
  confidence public.confidence_level not null default 'emerging',
  observed_at timestamptz not null,
  verified_at timestamptz,
  ingestion_run_id uuid references public.ingestion_runs(id),
  created_at timestamptz not null default now(),
  check (product_id is not null or variant_id is not null)
);
create index if not exists tights_observations_product_idx on public.tights_product_observations(product_id, field_name, observed_at desc);

create table if not exists public.tights_product_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.tights_products(id) on delete cascade,
  version text not null,
  change_kind text not null check (change_kind in ('created', 'specification', 'size_chart', 'price', 'availability', 'editorial', 'merged')),
  snapshot jsonb not null,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(product_id, version)
);

create table if not exists public.tights_product_prices (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.tights_product_variants(id) on delete cascade,
  retailer_name text not null,
  retailer_url text,
  currency char(3) not null,
  amount numeric(10,2) not null check (amount >= 0),
  price_type text not null check (price_type in ('list', 'sale')),
  observed_at timestamptz not null,
  source_observation_id uuid references public.tights_product_observations(id),
  unique (variant_id, retailer_name, currency, amount, price_type, observed_at)
);

create table if not exists public.tights_product_availability (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.tights_product_variants(id) on delete cascade,
  retailer_name text not null,
  availability public.availability_state not null default 'unknown',
  observed_at timestamptz not null,
  source_observation_id uuid references public.tights_product_observations(id),
  unique (variant_id, retailer_name, observed_at)
);

-- Ratings are category-specific by design. A bra's cup-fit field is never
-- repurposed as hosiery evidence; both scorecards still expose the same audit
-- trail, moderation state and version that was worn.
create table if not exists public.tights_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.tights_products(id) on delete cascade,
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
  sizing public.fit_label not null default 'varies',
  issues text[] not null default '{}',
  review_body text,
  profile_snapshot jsonb not null default '{}'::jsonb,
  profile_visibility public.review_visibility not null default 'private_only',
  moderation_state text not null default 'pending' check (moderation_state in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tights_reviews_product_published_idx on public.tights_reviews(product_id, moderation_state, created_at desc);

create table if not exists public.tights_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.tights_products(id) on delete cascade,
  variant_id uuid references public.tights_product_variants(id) on delete set null,
  state text not null check (state in ('want_to_try', 'owned', 'repurchase', 'retired')),
  purchased_at date,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, product_id, variant_id)
);

create view public.tights_product_scorecards as
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
from public.tights_reviews r group by r.product_id;

alter table public.tights_products enable row level security;
alter table public.tights_product_variants enable row level security;
alter table public.tights_product_observations enable row level security;
alter table public.tights_product_versions enable row level security;
alter table public.tights_product_prices enable row level security;
alter table public.tights_product_availability enable row level security;
alter table public.tights_reviews enable row level security;
alter table public.tights_history enable row level security;

create policy "public tights are readable" on public.tights_products for select using (true);
create policy "public tights variants are readable" on public.tights_product_variants for select using (true);
create policy "public tights observations are readable" on public.tights_product_observations for select using (true);
create policy "public tights versions are readable" on public.tights_product_versions for select using (true);
create policy "public tights prices are readable" on public.tights_product_prices for select using (true);
create policy "public tights availability is readable" on public.tights_product_availability for select using (true);
create policy "published tights reviews are readable" on public.tights_reviews for select using (moderation_state = 'published' or author_id = auth.uid());
create policy "users create their own tights reviews" on public.tights_reviews for insert with check (auth.uid() = author_id);
create policy "users update their own pending tights reviews" on public.tights_reviews for update using (auth.uid() = author_id and moderation_state = 'pending');
create policy "users manage their own tights history" on public.tights_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger tights_products_updated_at before update on public.tights_products for each row execute procedure public.set_updated_at();
create trigger tights_variants_updated_at before update on public.tights_product_variants for each row execute procedure public.set_updated_at();
create trigger tights_reviews_updated_at before update on public.tights_reviews for each row execute procedure public.set_updated_at();

comment on column public.profiles.tights_profile is 'Private optional tights preferences; no image, body scan or appearance score.';
comment on table public.tights_product_observations is 'Field-level provenance for hosiery facts, separate from community and lab evidence.';
comment on table public.tights_reviews is 'Structured, moderated hosiery experience; not a generic star-only review.';
