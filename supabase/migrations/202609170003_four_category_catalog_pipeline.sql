-- Complete the shared catalogue control plane for all four fit categories.
-- This migration adds no public media, copied descriptions, or automated
-- crawling permission. Sources remain inactive until a reviewed agreement
-- explicitly grants the fields, automated access and publication rights.

alter table public.ingestion_sources
  drop constraint if exists ingestion_sources_allowed_categories_check;
alter table public.ingestion_sources
  add constraint ingestion_sources_allowed_categories_check
  check (
    cardinality(allowed_categories) > 0
    and allowed_categories <@ array['bra', 'tights', 'leggings', 'jeans']::text[]
  );

alter table public.ingestion_candidates
  add column if not exists published_fit_product_id uuid references public.fit_products(id) on delete set null;

-- Existing brand-claim rows used the old word "both". Normalise it before the
-- new constraint so the upgrade is safe for an already-running project.
update public.catalog_contributions set category = 'all' where category = 'both';
alter table public.catalog_contributions
  drop constraint if exists catalog_contributions_category_check;
alter table public.catalog_contributions
  add constraint catalog_contributions_category_check
  check (category in ('bra', 'tights', 'leggings', 'jeans', 'all'));

alter table public.catalog_gap_queue
  drop constraint if exists catalog_gap_queue_category_check;
alter table public.catalog_gap_queue
  add constraint catalog_gap_queue_category_check
  check (category in ('bra', 'tights', 'leggings', 'jeans'));

alter table public.catalog_discovery_sources
  drop constraint if exists catalog_discovery_sources_allowed_categories_check;
alter table public.catalog_discovery_sources
  add constraint catalog_discovery_sources_allowed_categories_check
  check (
    cardinality(allowed_categories) > 0
    and allowed_categories <@ array['bra', 'tights', 'leggings', 'jeans']::text[]
  );

comment on column public.ingestion_candidates.published_fit_product_id is 'Canonical leggings or jeans record created from this reviewed candidate.';
comment on constraint ingestion_sources_allowed_categories_check on public.ingestion_sources is 'A source may cover only the four scoped fit categories and must explicitly name at least one.';
