-- Every public review submission is recorded without copying profile
-- measurements or account identifiers. A record can only affect a public
-- scorecard after it is matched to a canonical product and moderated.

create table if not exists public.review_intake (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('bra', 'tights')),
  product_reference text not null check (char_length(product_reference) between 1 and 160),
  product_version text not null check (char_length(product_version) between 1 and 80),
  size_bought text not null check (char_length(size_bought) between 1 and 30),
  scores jsonb not null,
  fit_signals jsonb not null,
  issues text[] not null default '{}',
  profile_visibility public.review_visibility not null default 'private_only',
  canonical_bra_product_id uuid references public.products(id) on delete set null,
  canonical_tights_product_id uuid references public.tights_products(id) on delete set null,
  moderation_state text not null default 'requires_mapping'
    check (moderation_state in ('pending', 'requires_mapping', 'published', 'rejected')),
  reviewer_note text check (char_length(reviewer_note) <= 1_000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (category = 'bra' and canonical_tights_product_id is null)
    or (category = 'tights' and canonical_bra_product_id is null)
  )
);

create index if not exists review_intake_moderation_idx
  on public.review_intake(moderation_state, created_at desc);

alter table public.review_intake enable row level security;

comment on table public.review_intake is 'Private review intake. Never stores body measurements, profile snapshots, email, IP address, or authentication identifiers. Records without a canonical product require mapping before they can affect a public score.';
