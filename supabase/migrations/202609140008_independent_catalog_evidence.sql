-- A non-affiliate launch can use independently generated fit evidence, while
-- keeping commercial facts (price and stock) gated behind a licensed source.
-- This table never stores a receipt image, a body photo or copied brand text.

alter type public.source_kind add value if not exists 'retailer_feed';
alter type public.source_kind add value if not exists 'physical_audit';
alter type public.source_kind add value if not exists 'contributor_evidence';

alter table public.ingestion_sources drop constraint if exists ingestion_sources_legal_basis_check;
alter table public.ingestion_sources add constraint ingestion_sources_legal_basis_check
  check (legal_basis in ('partner_authorized', 'public_product_page', 'manual_import', 'first_party_measurement', 'verified_contributor_evidence'));

alter table public.source_rights_reviews drop constraint if exists source_rights_reviews_legal_basis_check;
alter table public.source_rights_reviews add constraint source_rights_reviews_legal_basis_check
  check (legal_basis in ('partner_authorized', 'public_product_page', 'manual_import', 'first_party_measurement', 'verified_contributor_evidence'));

create table if not exists public.catalog_independent_evidence (
  id uuid primary key default gen_random_uuid(),
  brand_target_id text not null references public.brand_source_targets(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  tights_product_id uuid references public.tights_products(id) on delete set null,
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
  on public.catalog_independent_evidence(brand_target_id, review_status, observed_at desc);

alter table public.catalog_independent_evidence enable row level security;

comment on table public.catalog_independent_evidence is 'Original physical-audit or consented contributor facts. No photos, receipt images, copied product copy, or personal measurements are stored here.';
