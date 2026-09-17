import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedIngestionRequest } from "@/lib/ingestion/route-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** Private operations view for the self-healing catalogue queue. Browser users
 * can contribute, but only an authenticated operator can inspect the demand
 * queue, verify claims, or assign an approved discovery source. */
export async function GET(request: NextRequest) {
  if (!isAuthorizedIngestionRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const database = getSupabaseAdmin();
  if (!database) {
    return NextResponse.json({ error: "Catalog database is not configured." }, { status: 503 });
  }

  const [gaps, contributions, sources] = await Promise.all([
    database.from("catalog_gap_queue").select("id, category, brand_name, product_name, priority_score, contribution_count, resolution_state, last_reported_at, assigned_source_id").order("priority_score", { ascending: false }).order("last_reported_at", { ascending: false }).limit(100),
    database.from("catalog_contributions").select("id, submission_type, brand_name, product_name, moderation_state, created_at, merged_into_gap_id").order("created_at", { ascending: false }).limit(50),
    database.from("catalog_discovery_sources").select("id, name, source_type, enabled, supports_gap_discovery, supports_commercial_updates, next_run_at, last_success_at, paused_reason").order("name"),
  ]);

  const error = gaps.error ?? contributions.error ?? sources.error;
  if (error) {
    // Keep the HTTP response generic: database details are useful to an
    // operator in Vercel Logs, but should never be exposed to a caller.
    console.error("PerfectPair catalog queue query failed", {
      catalogGapQueue: gaps.error?.message,
      catalogContributions: contributions.error?.message,
      catalogDiscoverySources: sources.error?.message,
    });
    return NextResponse.json({ error: "Catalog queue could not be read." }, { status: 503 });
  }
  const gapRows = gaps.data ?? [];
  const contributionRows = contributions.data ?? [];
  const sourceRows = sources.data ?? [];
  return NextResponse.json({
    summary: {
      queuedGaps: gapRows.filter((gap) => gap.resolution_state === "queued").length,
      topPriority: gapRows[0]?.priority_score ?? 0,
      enabledDiscoverySources: sourceRows.filter((source) => source.enabled && source.supports_gap_discovery).length,
    },
    gaps: gapRows,
    recentContributions: contributionRows,
    discoverySources: sourceRows,
  });
}
