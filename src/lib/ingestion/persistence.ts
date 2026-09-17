import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { NormalizedCandidate, QualityReport } from "@/lib/types";
import type { RefreshLane, SourceAdapter, SourceDiscoveryResult } from "./types";

type PersistentRun = { id: string; startedAt: string };

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(value: unknown) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function nextRefreshAt(source: SourceAdapter, now: Date, failures = 0) {
  const hours = Math.min(720, Math.max(source.refreshIntervalHours, failures ? 6 * 2 ** Math.min(failures - 1, 4) : source.refreshIntervalHours));
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export async function beginPersistentRun(source: SourceAdapter, lane: RefreshLane, now = new Date()): Promise<PersistentRun | null> {
  const binding = source.databaseBinding;
  const database = getSupabaseAdmin();
  if (!binding || !database) return null;
  const startedAt = now.toISOString();
  const idempotencyKey = `${lane}:${startedAt.slice(0, 13)}`;
  const { data: existing, error: existingError } = await database
    .from("ingestion_runs")
    .select("id, started_at")
    .eq("source_id", binding.sourceRecordId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existingError) throw new Error(`Could not check ingestion idempotency: ${existingError.message}`);
  if (existing) return { id: existing.id as string, startedAt: (existing.started_at as string | null) ?? startedAt };
  const { data, error } = await database
    .from("ingestion_runs")
    .insert({
      source_id: binding.sourceRecordId,
      status: "running",
      started_at: startedAt,
      refresh_lane: lane,
      trigger_kind: "scheduled",
      rights_review_id: binding.rightsReviewId,
      idempotency_key: idempotencyKey,
      log: [{ event: "scheduled_refresh_started", at: startedAt }],
    })
    .select("id, started_at")
    .single();
  if (error || !data) throw new Error(`Could not start ingestion run: ${error?.message ?? "no run returned"}`);
  return { id: data.id as string, startedAt: (data.started_at as string | null) ?? startedAt };
}

export async function persistSuccessfulRun(
  source: SourceAdapter,
  lane: RefreshLane,
  run: PersistentRun | null,
  discovery: SourceDiscoveryResult,
  reports: Array<{ normalized: NormalizedCandidate; report: QualityReport }>,
  result: { discovered: number; approved: number; needsReview: number; rejected: number },
  now = new Date(),
) {
  const binding = source.databaseBinding;
  const database = getSupabaseAdmin();
  if (!binding || !database || !run) return;
  const completedAt = now.toISOString();
  if (reports.length) {
    const retentionExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const rows = reports.map(({ normalized, report }) => ({
      run_id: run.id,
      external_id: normalized.candidate.externalId,
      canonical_url: normalized.candidate.canonicalUrl,
      raw_payload: normalized.candidate.raw,
      normalized_payload: normalized.product,
      field_sources: normalized.fieldSources,
      quality_score: report.score,
      quality_reasons: report.reasons,
      blocking_issues: report.blockingIssues,
      status: report.status,
      source_etag: discovery.etag ?? null,
      source_last_modified: discovery.lastModified ?? null,
      content_fingerprint: fingerprint({ externalId: normalized.candidate.externalId, product: normalized.product, source: normalized.candidate.canonicalUrl }),
      retention_expires_at: retentionExpiresAt,
    }));
    const { error } = await database.from("ingestion_candidates").insert(rows);
    if (error) throw new Error(`Could not store review candidates: ${error.message}`);
  }
  const { error: runError } = await database
    .from("ingestion_runs")
    .update({
      status: "completed",
      completed_at: completedAt,
      request_count: discovery.requestCount,
      no_change_count: discovery.noChange ? 1 : 0,
      counts: { ...result, storedCandidates: reports.length },
      log: [{ event: "scheduled_refresh_completed", at: completedAt, noChange: discovery.noChange }],
    })
    .eq("id", run.id);
  if (runError) throw new Error(`Could not complete ingestion run: ${runError.message}`);
  const { error: checkpointError } = await database
    .from("source_refresh_checkpoints")
    .upsert({
      source_id: binding.sourceRecordId,
      lane,
      cursor: null,
      etag: discovery.etag ?? binding.etag ?? null,
      last_modified: discovery.lastModified ?? binding.lastModified ?? null,
      last_attempt_at: completedAt,
      last_success_at: completedAt,
      next_due_at: nextRefreshAt(source, now),
      failure_count: 0,
      last_error_code: null,
    }, { onConflict: "source_id,lane" });
  if (checkpointError) throw new Error(`Could not update refresh checkpoint: ${checkpointError.message}`);
}

export async function persistFailedRun(source: SourceAdapter, lane: RefreshLane, run: PersistentRun | null, error: unknown, now = new Date()) {
  const binding = source.databaseBinding;
  const database = getSupabaseAdmin();
  if (!binding || !database) return;
  const at = now.toISOString();
  const message = error instanceof Error ? error.message : "Unknown ingestion failure";
  const failureCount = (binding.failureCount ?? 0) + 1;
  if (run) {
    const { error: runError } = await database
      .from("ingestion_runs")
      .update({ status: "failed", completed_at: at, log: [{ event: "scheduled_refresh_failed", at, message }] })
      .eq("id", run.id);
    if (runError) console.error("PerfectPair could not close failed ingestion run", runError.message);
  }
  const { error: checkpointError } = await database
    .from("source_refresh_checkpoints")
    .upsert({
      source_id: binding.sourceRecordId,
      lane,
      cursor: binding.cursor ?? null,
      etag: binding.etag ?? null,
      last_modified: binding.lastModified ?? null,
      last_attempt_at: at,
      next_due_at: nextRefreshAt(source, now, failureCount),
      failure_count: failureCount,
      last_error_code: message.slice(0, 160),
    }, { onConflict: "source_id,lane" });
  if (checkpointError) console.error("PerfectPair could not record ingestion failure", checkpointError.message);
}
