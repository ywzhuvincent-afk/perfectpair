-- Progressive private profiles and evidence-based matching.
--
-- The app must never make disclosure a condition of browsing. These tables keep
-- the new, optional fit details separate from a public-facing account identity,
-- version official hosiery charts, and preserve a user's own wear evidence.

create table if not exists public.private_fit_profiles (
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
create table if not exists public.personal_fit_references (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bra', 'tights')),
  bra_product_id uuid references public.products(id) on delete set null,
  tights_product_id uuid references public.tights_products(id) on delete set null,
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
create index if not exists personal_fit_references_user_category_idx on public.personal_fit_references(user_id, category, recorded_at desc);

-- Official hosiery charts are their own versioned data layer. A chart is never
-- inferred from community answers; each cell retains a source observation URL
-- and capture date through the parent version.
create table if not exists public.tights_size_chart_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.tights_products(id) on delete cascade,
  source_observation_id uuid references public.tights_product_observations(id) on delete set null,
  source_url text not null,
  chart_version text not null,
  observed_at timestamptz not null,
  verified_at timestamptz,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, chart_version)
);
create unique index if not exists tights_one_current_chart_per_product_idx on public.tights_size_chart_versions(product_id) where is_current;

create table if not exists public.tights_size_chart_rows (
  id uuid primary key default gen_random_uuid(),
  chart_version_id uuid not null references public.tights_size_chart_versions(id) on delete cascade,
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
create index if not exists tights_size_chart_rows_version_idx on public.tights_size_chart_rows(chart_version_id);

alter table public.private_fit_profiles enable row level security;
alter table public.personal_fit_references enable row level security;
alter table public.tights_size_chart_versions enable row level security;
alter table public.tights_size_chart_rows enable row level security;

create policy "users manage their own private fit profile" on public.private_fit_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own personal fit references" on public.personal_fit_references
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public tights chart versions are readable" on public.tights_size_chart_versions for select using (true);
create policy "public tights chart rows are readable" on public.tights_size_chart_rows for select using (true);

create trigger private_fit_profiles_updated_at before update on public.private_fit_profiles for each row execute procedure public.set_updated_at();
create trigger personal_fit_references_updated_at before update on public.personal_fit_references for each row execute procedure public.set_updated_at();

comment on table public.private_fit_profiles is 'Private optional profile data, separated from display identity. API validation rejects photos, health explanations and appearance scoring.';
comment on table public.personal_fit_references is 'Private structured evidence from a member’s own wear experience; it is not public review content or model-training data.';
comment on table public.tights_size_chart_versions is 'Versioned manufacturer hosiery size charts with direct source provenance.';
comment on table public.tights_size_chart_rows is 'Published chart ranges only. Null dimensions are never inferred or requested by the matcher.';
