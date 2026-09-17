-- Community and brand reports are research leads, not automatic catalogue
-- content. The queue makes repeated requests visible without storing receipts,
-- photos, personal measurements, or copied creative product material.

create table if not exists public.catalog_contributions (
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

create table if not exists public.catalog_gap_queue (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  category text not null check (category in ('bra', 'tights')),
  brand_name text not null,
  product_name text not null,
  priority_score integer not null default 1 check (priority_score >= 0),
  contribution_count integer not null default 1 check (contribution_count >= 1),
  resolution_state text not null default 'queued' check (resolution_state in ('queued', 'triage', 'awaiting_source', 'independent_audit', 'candidate_ready', 'resolved', 'not_supported')),
  assigned_source_id uuid references public.ingestion_sources(id) on delete set null,
  first_reported_at timestamptz not null default now(),
  last_reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalog_contributions
  add constraint catalog_contributions_gap_fk foreign key (merged_into_gap_id) references public.catalog_gap_queue(id) on delete set null;

create table if not exists public.catalog_discovery_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  source_type text not null check (source_type in ('brand_claim_portal', 'retailer_or_distributor_feed', 'pim_or_gdsn_licensed_data', 'brand_provided_csv', 'physical_sample_audit', 'verified_contributor_evidence')),
  source_id uuid references public.ingestion_sources(id) on delete set null,
  enabled boolean not null default false,
  supports_gap_discovery boolean not null default false,
  supports_commercial_updates boolean not null default false,
  allowed_categories text[] not null default array['bra', 'tights'] check (allowed_categories <@ array['bra', 'tights']),
  rights_review_id uuid references public.source_rights_reviews(id) on delete set null,
  next_run_at timestamptz,
  last_success_at timestamptz,
  paused_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((enabled = false) or (source_id is not null and rights_review_id is not null and supports_gap_discovery = true))
);

create or replace function public.queue_catalog_contribution() returns trigger language plpgsql as $$
declare
  next_gap_id uuid;
  next_dedupe_key text;
begin
  if new.submission_type = 'brand_claim' then
    return new;
  end if;

  next_dedupe_key := new.category || ':' || regexp_replace(lower(trim(new.brand_name) || ':' || trim(new.product_name)), '[^a-z0-9]+', '', 'g');
  insert into public.catalog_gap_queue (dedupe_key, category, brand_name, product_name)
    values (next_dedupe_key, new.category, new.brand_name, new.product_name)
  on conflict (dedupe_key) do update set
    contribution_count = public.catalog_gap_queue.contribution_count + 1,
    priority_score = public.catalog_gap_queue.priority_score + 1,
    last_reported_at = now(),
    updated_at = now()
  returning id into next_gap_id;

  new.merged_into_gap_id := next_gap_id;
  new.moderation_state := 'deduplicated';
  return new;
end;
$$;

create trigger queue_catalog_contribution_before_insert before insert on public.catalog_contributions
  for each row execute procedure public.queue_catalog_contribution();
create trigger catalog_contributions_updated_at before update on public.catalog_contributions
  for each row execute procedure public.set_updated_at();
create trigger catalog_gap_queue_updated_at before update on public.catalog_gap_queue
  for each row execute procedure public.set_updated_at();
create trigger catalog_discovery_sources_updated_at before update on public.catalog_discovery_sources
  for each row execute procedure public.set_updated_at();

create index if not exists catalog_gap_queue_priority_idx on public.catalog_gap_queue(resolution_state, priority_score desc, last_reported_at desc);
create index if not exists catalog_contributions_moderation_idx on public.catalog_contributions(moderation_state, created_at desc);

alter table public.catalog_contributions enable row level security;
alter table public.catalog_gap_queue enable row level security;
alter table public.catalog_discovery_sources enable row level security;

comment on table public.catalog_gap_queue is 'Deduplicated catalogue gaps from user reports and approved discovery sources. It prioritises research; it does not authorise crawling.';
comment on table public.catalog_discovery_sources is 'Approved discovery sources only. A source must have an ingestion source and active rights review before a scheduled gap run can use it.';
