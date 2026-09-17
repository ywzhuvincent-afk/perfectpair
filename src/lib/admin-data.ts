import { getSupabaseAdmin } from "@/lib/supabase-admin";

function assertDatabase() {
  const database = getSupabaseAdmin();
  if (!database) throw new Error("The operations database is not configured.");
  return database;
}

async function count(table: string, filters: Array<[string, string]> = []) {
  const database = assertDatabase();
  let query = database.from(table).select("*", { count: "exact", head: true });
  for (const [column, value] of filters) query = query.eq(column, value);
  const { count: result, error } = await query;
  if (error) throw new Error(`Could not count ${table}: ${error.message}`);
  return result ?? 0;
}

function throwIfError(error: { message: string } | null, label: string) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

/** This intentionally returns no profile values, private fit snapshots, or
 * user identifiers. The operator can see privacy-workload counts only. */
export async function getAdminDashboard() {
  const database = assertDatabase();
  const [candidateResult, contributionResult, gapResult, sourceResult, runResult, auditResult, intakeResult, braReviewResult, tightsReviewResult, summary] = await Promise.all([
    database.from("ingestion_candidates").select("id, external_id, canonical_url, normalized_payload, quality_score, quality_reasons, blocking_issues, status, product_category, created_at, reviewed_at, reviewer_note").in("status", ["received", "needs_review", "approved"]).order("created_at", { ascending: false }).limit(30),
    database.from("catalog_contributions").select("id, submission_type, category, brand_name, product_name, product_url, relationship, business_email, preferred_update_method, moderation_state, created_at").in("moderation_state", ["received", "deduplicated", "source_review", "verified"]).order("created_at", { ascending: false }).limit(30),
    database.from("catalog_gap_queue").select("id, category, brand_name, product_name, priority_score, contribution_count, resolution_state, last_reported_at, assigned_source_id").order("priority_score", { ascending: false }).order("last_reported_at", { ascending: false }).limit(30),
    database.from("ingestion_sources").select("id, slug, name, source_kind, base_url, legal_basis, enabled, allowed_categories, refresh_interval_hours, automated_access_permitted, publication_permitted, paused_reason, last_success_at, next_catalog_refresh_at").order("created_at", { ascending: false }).limit(30),
    database.from("ingestion_runs").select("id, source_id, status, refresh_lane, trigger_kind, request_count, no_change_count, counts, started_at, completed_at").order("created_at", { ascending: false }).limit(20),
    database.from("admin_audit_events").select("id, action, entity_type, entity_id, metadata, created_at").order("created_at", { ascending: false }).limit(20),
    database.from("review_intake").select("id, category, product_reference, product_version, size_bought, moderation_state, created_at, reviewer_note").in("moderation_state", ["requires_mapping", "pending"]).order("created_at", { ascending: false }).limit(30),
    database.from("reviews").select("id, product_id, product_version, size_bought, overall, comfort, moderation_state, created_at").eq("moderation_state", "pending").order("created_at", { ascending: false }).limit(30),
    database.from("tights_reviews").select("id, product_id, product_version, size_bought, overall, comfort, moderation_state, created_at").eq("moderation_state", "pending").order("created_at", { ascending: false }).limit(30),
    Promise.all([
      count("ingestion_candidates", [["status", "needs_review"]]),
      count("catalog_contributions", [["moderation_state", "source_review"]]),
      count("catalog_gap_queue", [["resolution_state", "queued"]]),
      count("ingestion_sources", [["enabled", "true"]]),
      count("source_rights_reviews", [["status", "draft"]]),
      count("reviews", [["moderation_state", "pending"]]),
      count("tights_reviews", [["moderation_state", "pending"]]),
      count("review_intake", [["moderation_state", "requires_mapping"]]),
      count("privacy_data_requests", [["state", "requested"]]),
      count("products", [["lifecycle_status", "active"]]),
      count("tights_products", [["lifecycle_status", "active"]]),
      count("fit_products", [["lifecycle_status", "active"], ["category", "leggings"]]),
      count("fit_products", [["lifecycle_status", "active"], ["category", "jeans"]]),
    ]),
  ]);
  throwIfError(candidateResult.error, "Could not load candidate queue");
  throwIfError(contributionResult.error, "Could not load contribution queue");
  throwIfError(gapResult.error, "Could not load product gaps");
  throwIfError(sourceResult.error, "Could not load sources");
  throwIfError(runResult.error, "Could not load ingestion runs");
  throwIfError(auditResult.error, "Could not load operator audit events");
  throwIfError(intakeResult.error, "Could not load review intake queue");
  throwIfError(braReviewResult.error, "Could not load bra review moderation queue");
  throwIfError(tightsReviewResult.error, "Could not load tights review moderation queue");
  const [candidates, contributionsToReview, gaps, activeSources, draftReviews, braReviews, tightsReviews, unmatchedReviews, privacyRequests, publishedBras, publishedTights, publishedLeggings, publishedJeans] = summary;
  return {
    summary: {
      candidates,
      contributionsToReview,
      gaps,
      activeSources,
      pendingReviews: braReviews + tightsReviews + unmatchedReviews,
      privacyRequests,
      draftSourceReviews: draftReviews,
      publishedBras,
      publishedTights,
      publishedLeggings,
      publishedJeans,
    },
    candidates: candidateResult.data ?? [],
    contributions: contributionResult.data ?? [],
    gaps: gapResult.data ?? [],
    sources: sourceResult.data ?? [],
    runs: runResult.data ?? [],
    auditEvents: auditResult.data ?? [],
    reviewIntake: intakeResult.data ?? [],
    moderationReviews: [
      ...(braReviewResult.data ?? []).map((review) => ({ ...review, category: "bra" as const })),
      ...(tightsReviewResult.data ?? []).map((review) => ({ ...review, category: "tights" as const })),
    ],
  };
}

export async function writeAdminAudit(action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  const database = assertDatabase();
  const { error } = await database.from("admin_audit_events").insert({
    actor_label: "operator",
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
  throwIfError(error, "Could not write operator audit event");
}

export async function updateCandidateDecision(id: string, status: "approved" | "needs_review" | "rejected", reviewerNote?: string) {
  const database = assertDatabase();
  const { error } = await database.from("ingestion_candidates").update({
    status,
    reviewer_note: reviewerNote?.trim() || null,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  throwIfError(error, "Could not update candidate decision");
  await writeAdminAudit("candidate_decision", "ingestion_candidate", id, { status });
}

export async function updateContributionDecision(id: string, moderationState: "source_review" | "verified" | "rejected" | "closed") {
  const database = assertDatabase();
  const { error } = await database.from("catalog_contributions").update({ moderation_state: moderationState }).eq("id", id);
  throwIfError(error, "Could not update contribution decision");
  await writeAdminAudit("contribution_decision", "catalog_contribution", id, { moderationState });
}

export async function updateGapState(id: string, resolutionState: "triage" | "awaiting_source" | "independent_audit" | "candidate_ready" | "resolved" | "not_supported") {
  const database = assertDatabase();
  const resolvedAt = resolutionState === "resolved" || resolutionState === "not_supported" ? new Date().toISOString() : null;
  const { error } = await database.from("catalog_gap_queue").update({ resolution_state: resolutionState, resolved_at: resolvedAt }).eq("id", id);
  throwIfError(error, "Could not update product-gap state");
  await writeAdminAudit("gap_state", "catalog_gap", id, { resolutionState });
}

export async function updateReviewDecision(category: "bra" | "tights", id: string, moderationState: "published" | "rejected") {
  const database = assertDatabase();
  const table = category === "bra" ? "reviews" : "tights_reviews";
  const { error } = await database.from(table).update({ moderation_state: moderationState }).eq("id", id);
  throwIfError(error, "Could not update review decision");
  await writeAdminAudit("review_decision", table, id, { moderationState });
}

export async function updateReviewIntakeDecision(id: string, moderationState: "requires_mapping" | "rejected", reviewerNote?: string) {
  const database = assertDatabase();
  const { error } = await database.from("review_intake").update({ moderation_state: moderationState, reviewer_note: reviewerNote?.trim() || null, reviewed_at: new Date().toISOString() }).eq("id", id);
  throwIfError(error, "Could not update review intake decision");
  await writeAdminAudit("review_intake_decision", "review_intake", id, { moderationState });
}
