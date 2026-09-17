-- Private operator controls. This migration never grants the public read access
-- to private profiles, measurements, identity data, or operator notes.

alter table public.ingestion_candidates
  add column if not exists reviewer_note text check (char_length(reviewer_note) <= 1_000),
  add column if not exists published_tights_product_id uuid references public.tights_products(id) on delete set null;

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_label text not null default 'operator',
  action text not null check (char_length(action) between 1 and 80),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 120),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_entity_idx
  on public.admin_audit_events(entity_type, entity_id, created_at desc);

alter table public.admin_audit_events enable row level security;

comment on table public.admin_audit_events is 'Private operational audit trail. Metadata excludes profile measurements, emails, source credentials, copied descriptions, and image URLs.';
comment on column public.ingestion_candidates.reviewer_note is 'Operator decision note; no copied brand content or user personal data.';
