-- The ingestion queue is operator-only: the server reaches it with the service
-- role, which bypasses RLS. Without RLS the schema-wide grants would let any
-- visitor read the queue and any signed-in member rewrite it through the Data API.
alter table public.ingestion_sources enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.ingestion_candidates enable row level security;
