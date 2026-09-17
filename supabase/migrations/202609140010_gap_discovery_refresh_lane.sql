-- The existing daily catalog cron also runs this lane. It is limited to
-- sources already approved for gap discovery; it is not a web-crawling lane.

alter table public.source_refresh_checkpoints drop constraint if exists source_refresh_checkpoints_lane_check;
alter table public.source_refresh_checkpoints add constraint source_refresh_checkpoints_lane_check
  check (lane in ('catalog', 'price_availability', 'gap_discovery'));

alter table public.ingestion_runs drop constraint if exists ingestion_runs_refresh_lane_check;
alter table public.ingestion_runs add constraint ingestion_runs_refresh_lane_check
  check (refresh_lane in ('catalog', 'price_availability', 'gap_discovery'));
