-- Profile privacy controls. Fit facts remain private by default; any optional
-- contribution uses a purpose-specific consent record and an audit trail that
-- deliberately stores no measurements or free-text profile content.

do $$ begin
  create type public.privacy_event_type as enum (
    'anonymous_matching_enabled',
    'anonymous_matching_disabled',
    'insights_enabled',
    'insights_disabled',
    'export_requested',
    'deletion_requested'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.privacy_request_type as enum ('export', 'delete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.privacy_request_state as enum ('requested', 'in_progress', 'completed', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.profile_privacy_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Private matching is the user-requested purpose of this profile. It does
  -- not expose data to another member or a brand.
  private_matching_enabled boolean not null default true,
  -- Separate, affirmative choices. Both are off unless the user opts in.
  anonymous_matching_enabled boolean not null default false,
  aggregated_product_insights_enabled boolean not null default false,
  privacy_notice_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tights_fit_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source public.fit_snapshot_source not null default 'manual',
  label text,
  -- Private manual size/preference record. No image or appearance score.
  profile_snapshot jsonb not null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists tights_fit_snapshots_user_recorded_idx on public.tights_fit_snapshots(user_id, recorded_at desc);

create table if not exists public.profile_privacy_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type public.privacy_event_type not null,
  -- Metadata may identify a policy version or request id, never profile facts.
  metadata jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);
create index if not exists profile_privacy_events_user_recorded_idx on public.profile_privacy_events(user_id, recorded_at desc);

create table if not exists public.privacy_data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type public.privacy_request_type not null,
  state public.privacy_request_state not null default 'requested',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  failure_reason text
);
create index if not exists privacy_data_requests_user_requested_idx on public.privacy_data_requests(user_id, requested_at desc);

alter table public.profile_privacy_preferences enable row level security;
alter table public.tights_fit_snapshots enable row level security;
alter table public.profile_privacy_events enable row level security;
alter table public.privacy_data_requests enable row level security;

create policy "users manage their own privacy preferences" on public.profile_privacy_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own tights fit snapshots" on public.tights_fit_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read their own privacy events" on public.profile_privacy_events for select using (auth.uid() = user_id);
create policy "users create their own privacy events" on public.profile_privacy_events for insert with check (auth.uid() = user_id);
create policy "users read their own privacy requests" on public.privacy_data_requests for select using (auth.uid() = user_id);
create policy "users create their own privacy requests" on public.privacy_data_requests for insert with check (auth.uid() = user_id);

create trigger profile_privacy_preferences_updated_at before update on public.profile_privacy_preferences for each row execute procedure public.set_updated_at();

comment on table public.profile_privacy_preferences is 'Purpose-specific privacy choices; anonymous contribution is opt-in and never required for a private match.';
comment on table public.tights_fit_snapshots is 'Private dated tights profile; later edits do not rewrite historic fit evidence.';
comment on table public.profile_privacy_events is 'Privacy audit metadata only; no measurement, size or profile free text is retained in this event log.';
comment on table public.privacy_data_requests is 'Account-level export/delete request workflow for the signed-in production service.';
