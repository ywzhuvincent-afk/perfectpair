-- GENERATED ISOLATED UPGRADE — do not edit by hand.
-- Source migration: ../migrations/202609170002_fit_network_lower_body_and_handoff.sql
-- Regenerate with: npm run generate:shared-upgrade -- 202609170002_fit_network_lower_body_and_handoff.sql
--
-- This is only for an already-installed PerfectPair schema. It does not touch
-- the shared public schema. Do not use the full installer for an upgrade.
begin;

do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'perfectpair') then
    raise exception 'The perfectpair schema is missing. Run the full isolated installer first.';
  end if;
end;
$$;

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


commit;
