-- Catalog freshness and content-rights controls.
--
-- A source cannot be activated because a URL happens to be public. Before any
-- scheduled fetch, it needs a current, reviewable rights decision stating what
-- automated access, fields and publication are allowed.

alter table public.ingestion_sources
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

create table if not exists public.source_rights_reviews (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.ingestion_sources(id) on delete cascade,
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
create unique index if not exists one_active_rights_review_per_source_idx on public.source_rights_reviews(source_id)
  where status = 'approved';

-- Resumable refresh state. `etag` and `last_modified` allow permitted sources
-- to return no-change responses; source credentials are never stored here.
create table if not exists public.source_refresh_checkpoints (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.ingestion_sources(id) on delete cascade,
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
create index if not exists source_refresh_due_idx on public.source_refresh_checkpoints(lane, next_due_at);

alter table public.ingestion_runs
  add column if not exists refresh_lane text check (refresh_lane in ('catalog', 'price_availability')),
  add column if not exists trigger_kind text not null default 'manual' check (trigger_kind in ('manual', 'scheduled', 'retry')),
  add column if not exists idempotency_key text,
  add column if not exists rights_review_id uuid references public.source_rights_reviews(id),
  add column if not exists request_count integer not null default 0 check (request_count >= 0),
  add column if not exists no_change_count integer not null default 0 check (no_change_count >= 0);
create unique index if not exists ingestion_runs_idempotency_idx on public.ingestion_runs(source_id, idempotency_key)
  where idempotency_key is not null;

alter table public.ingestion_candidates
  add column if not exists source_etag text,
  add column if not exists source_last_modified text,
  add column if not exists content_fingerprint text,
  add column if not exists retention_expires_at timestamptz;
create index if not exists ingestion_candidates_fingerprint_idx on public.ingestion_candidates(content_fingerprint)
  where content_fingerprint is not null;

-- Rights-holder or brand reports are first-class operational events. They are
-- handled by a controlled workflow, never silently deleted or ignored.
create table if not exists public.catalog_rights_requests (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.ingestion_sources(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  tights_product_id uuid references public.tights_products(id) on delete set null,
  request_type text not null check (request_type in ('copyright', 'trademark', 'terms', 'data_correction', 'other')),
  requester_contact text not null,
  reference_url text,
  claim_summary text not null,
  status text not null default 'received' check (status in ('received', 'under_review', 'actioned', 'rejected', 'closed')),
  action_summary text,
  received_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists catalog_rights_requests_open_idx on public.catalog_rights_requests(status, received_at desc);

alter table public.source_rights_reviews enable row level security;
alter table public.source_refresh_checkpoints enable row level security;
alter table public.catalog_rights_requests enable row level security;

create trigger source_refresh_checkpoints_updated_at before update on public.source_refresh_checkpoints for each row execute procedure public.set_updated_at();

comment on table public.source_rights_reviews is 'Immutable approval history for source terms, robots policy, permitted fields, automated access and publication scope.';
comment on table public.source_refresh_checkpoints is 'Per-source refresh state used for conditional requests, due scheduling, failure backoff and resumable ingestion.';
comment on table public.catalog_rights_requests is 'Rights-holder, brand and correction reports with accountable resolution; accessible only through authorized support/admin workflows.';
