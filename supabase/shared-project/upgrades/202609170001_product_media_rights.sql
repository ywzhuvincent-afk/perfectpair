-- GENERATED ISOLATED UPGRADE — do not edit by hand.
-- Source migration: ../migrations/202609170001_product_media_rights.sql
-- Regenerate with: npm run generate:shared-upgrade -- 202609170001_product_media_rights.sql
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


commit;
