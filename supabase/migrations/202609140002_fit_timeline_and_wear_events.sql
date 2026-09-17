-- Living My Bra Profile + private Fit Diary. Events reference the dated
-- snapshot that existed at the time of wear; later profile edits never
-- retrospectively alter prior experience.
create type public.fit_snapshot_source as enum ('manual', 'wear_checkin');
create type public.bra_occasion as enum ('everyday', 'work', 'lounge', 'occasion', 'travel', 'exercise');
create type public.bra_goal as enum ('all_day_comfort', 'smooth_under_clothes', 'lift_and_shape', 'low_neckline', 'wire_free');
create type public.wear_band_feel as enum ('secure', 'noticeable', 'uncomfortable');
create type public.wear_cup_containment as enum ('contained', 'minor_issue', 'not_right');
create type public.wear_wire_feel as enum ('not_applicable', 'comfortable', 'noticeable', 'painful');
create type public.wear_strap_feel as enum ('stayed_put', 'slipped', 'dug_in');
create type public.wear_repurchase_signal as enum ('yes', 'maybe', 'no');
create type public.bra_fit_issue as enum ('band_digs', 'band_rides_up', 'cup_spillage', 'cup_gaping', 'wire_pokes', 'wire_on_tissue', 'straps_slip', 'straps_dig', 'gore_floats', 'side_spillage', 'cups_shift', 'none');

create table public.fit_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source public.fit_snapshot_source not null default 'manual',
  label text,
  -- Private manual fit data only; no image or appearance score.
  profile_snapshot jsonb not null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index fit_snapshots_user_recorded_idx on public.fit_snapshots(user_id, recorded_at desc);

create table public.wear_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_version text not null,
  fit_snapshot_id uuid not null references public.fit_snapshots(id) on delete restrict,
  occasion public.bra_occasion not null,
  goal public.bra_goal not null,
  outfit_label text,
  hours_expected smallint check (hours_expected between 1 and 24),
  band_feel public.wear_band_feel not null,
  cup_containment public.wear_cup_containment not null,
  wire_feel public.wear_wire_feel not null,
  strap_feel public.wear_strap_feel not null,
  would_wear_again public.wear_repurchase_signal not null,
  issue public.bra_fit_issue not null default 'none',
  created_at timestamptz not null default now()
);
create index wear_events_user_product_idx on public.wear_events(user_id, product_id, created_at desc);

-- Durability is deliberately collected after enough wears or washing, rather
-- than treating a first impression as a durability verdict.
create table public.review_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete set null,
  due_after_wears integer check (due_after_wears in (3, 5, 10)),
  due_after_wash boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'sent', 'completed', 'dismissed')),
  response jsonb,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.fit_snapshots enable row level security;
alter table public.wear_events enable row level security;
alter table public.review_followups enable row level security;
create policy "users manage their own fit snapshots" on public.fit_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own wear events" on public.wear_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own review followups" on public.review_followups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.fit_snapshots is 'Private dated My Bra Profile; later edits never overwrite historic fit.';
comment on table public.wear_events is 'Private Fit Diary outcome; never a body or appearance rating.';
comment on table public.review_followups is 'Durability evidence collected after sufficient use, not first wear.';
