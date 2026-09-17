import { loadDatabaseSources } from "./database-sources";
import { persistFailedRun, persistSuccessfulRun, beginPersistentRun } from "./persistence";
import { assessCandidate } from "./quality";
import { findSource, sourceRegistry } from "./sources";
import type { IngestionRunResult, RefreshLane, ScheduledIngestionResult, SourceAdapter } from "./types";

function sourcePolicyBlocker(source: SourceAdapter, now = new Date()) {
  const { rights } = source;
  if (!rights.permitsAutomatedAccess) return "Automated access is not permitted by this source policy.";
  if (!rights.permitsPublication) return "This source policy does not permit publication of normalized facts.";
  if (!rights.reviewedAt) return "The source policy has not been reviewed.";
  if (rights.validUntil && new Date(rights.validUntil) < now) return "The source policy review has expired.";
  if (!rights.allowedFields.length) return "The source policy does not define permitted fields.";
  if (rights.maxRequestsPerMinute < 1) return "The source policy has no safe request rate.";
  return null;
}

async function runSource(source: SourceAdapter, lane: RefreshLane, dryRun: boolean): Promise<IngestionRunResult> {
  if (!source.enabled) throw new Error(`Source is disabled: ${source.id}`);
  if (!source.requiresHumanReview) throw new Error(`Source ${source.id} cannot bypass human review.`);
  const policyBlocker = sourcePolicyBlocker(source);
  if (policyBlocker) throw new Error(policyBlocker);
  const run = dryRun ? null : await beginPersistentRun(source, lane);
  try {
    const discovery = await source.discover();
    const result: IngestionRunResult = { sourceId: source.id, dryRun, discovered: discovery.candidates.length, approved: 0, needsReview: 0, rejected: 0, candidates: [] };
    const reports: Parameters<typeof persistSuccessfulRun>[4] = [];
    for (const candidate of discovery.candidates) {
      const category = candidate.category ?? "bra";
      if (!source.allowedCategories.includes(category)) {
        result.rejected += 1;
        result.candidates.push({ externalId: candidate.externalId, status: "rejected", score: 0, reasons: [`Source policy does not permit ${category} publication.`] });
        continue;
      }
      const normalized = await source.normalize(candidate);
      const report = assessCandidate(normalized, source);
      result[report.status === "approved" ? "approved" : report.status === "rejected" ? "rejected" : "needsReview"] += 1;
      result.candidates.push({ externalId: candidate.externalId, status: report.status, score: report.score, reasons: [...report.reasons, ...report.blockingIssues] });
      reports.push({ normalized, report });
    }
    if (!dryRun) await persistSuccessfulRun(source, lane, run, discovery, reports, result);
    return result;
  } catch (error) {
    if (!dryRun) await persistFailedRun(source, lane, run, error);
    throw error;
  }
}

/** Runs one adapter for local QA or a protected operator request. */
export async function runIngestion(sourceId: string, dryRun = true): Promise<IngestionRunResult> {
  let source = findSource(sourceId);
  if (!source) {
    const loaded = await loadDatabaseSources("catalog");
    source = loaded.sources.find((candidate) => candidate.id === sourceId);
  }
  if (!source) throw new Error(`Unknown or non-approved source: ${sourceId}`);
  return runSource(source, "catalog", dryRun);
}

/**
 * Production is database-driven: only sources with an enabled record, an
 * unexpired rights review and a safe JSON-feed policy can be contacted. A
 * successful run stages candidates for human review; it never publishes a
 * product directly. Development fixtures are excluded from production.
 */
export async function runScheduledIngestion(lane: RefreshLane, dryRun = false): Promise<ScheduledIngestionResult> {
  const triggeredAt = new Date().toISOString();
  const databaseSources = await loadDatabaseSources(lane, new Date(triggeredAt));
  const fixtureSources = process.env.NODE_ENV === "production"
    ? []
    : sourceRegistry.filter((source) => source.enabled && source.refreshLanes.includes(lane));
  const skipped: ScheduledIngestionResult["skipped"] = [...databaseSources.skipped];
  const runs: IngestionRunResult[] = [];
  for (const source of [...databaseSources.sources, ...fixtureSources]) {
    const blocker = sourcePolicyBlocker(source, new Date(triggeredAt));
    if (blocker) { skipped.push({ sourceId: source.id, reason: blocker }); continue; }
    try {
      runs.push(await runSource(source, lane, dryRun));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown ingestion failure.";
      console.error("PerfectPair scheduled source refresh failed", { sourceId: source.id, lane, message });
      skipped.push({ sourceId: source.id, reason: `Refresh failed: ${message}` });
    }
  }
  return { lane, triggeredAt, runs, skipped };
}
