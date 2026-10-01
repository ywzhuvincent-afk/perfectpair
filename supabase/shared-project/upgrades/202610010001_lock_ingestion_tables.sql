-- GENERATED ISOLATED UPGRADE — do not edit by hand.
-- Source migration: ../migrations/202610010001_lock_ingestion_tables.sql
-- Regenerate with: npm run generate:shared-upgrade -- 202610010001_lock_ingestion_tables.sql
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

-- The ingestion queue is operator-only: the server reaches it with the service
-- role, which bypasses RLS. Without RLS the schema-wide grants would let any
-- visitor read the queue and any signed-in member rewrite it through the Data API.
alter table perfectpair.ingestion_sources enable row level security;
alter table perfectpair.ingestion_runs enable row level security;
alter table perfectpair.ingestion_candidates enable row level security;


commit;
