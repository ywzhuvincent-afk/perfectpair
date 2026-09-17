import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession } from "@/lib/admin-auth";
import { updateCandidateDecision, updateContributionDecision, updateGapState, updateReviewDecision, updateReviewIntakeDecision, writeAdminAudit } from "@/lib/admin-data";
import { publishCandidate } from "@/lib/admin-publish";
import { createManualCandidate, manualCandidateSchema } from "@/lib/admin-manual-candidate";
import { runScheduledIngestion } from "@/lib/ingestion/runner";

const requestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("candidate"), id: z.string().uuid(), status: z.enum(["approved", "needs_review", "rejected"]), note: z.string().trim().max(1_000).optional() }),
  z.object({ type: z.literal("publish_candidate"), id: z.string().uuid(), note: z.string().trim().max(1_000).optional() }),
  z.object({ type: z.literal("contribution"), id: z.string().uuid(), status: z.enum(["source_review", "verified", "rejected", "closed"]) }),
  z.object({ type: z.literal("gap"), id: z.string().uuid(), status: z.enum(["triage", "awaiting_source", "independent_audit", "candidate_ready", "resolved", "not_supported"]) }),
  z.object({ type: z.literal("review"), id: z.string().uuid(), category: z.enum(["bra", "tights"]), status: z.enum(["published", "rejected"]) }),
  z.object({ type: z.literal("review_intake"), id: z.string().uuid(), status: z.enum(["requires_mapping", "rejected"]), note: z.string().trim().max(1_000).optional() }),
  z.object({ type: z.literal("manual_candidate"), candidate: manualCandidateSchema }),
  z.object({ type: z.literal("run_refresh"), lane: z.enum(["catalog", "price_availability", "gap_discovery"]) }),
]);

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid operator action." }, { status: 400 });
  try {
    const input = parsed.data;
    if (input.type === "candidate") await updateCandidateDecision(input.id, input.status, input.note);
    if (input.type === "publish_candidate") await publishCandidate(input.id, input.note);
    if (input.type === "contribution") await updateContributionDecision(input.id, input.status);
    if (input.type === "gap") await updateGapState(input.id, input.status);
    if (input.type === "review") await updateReviewDecision(input.category, input.id, input.status);
    if (input.type === "review_intake") await updateReviewIntakeDecision(input.id, input.status, input.note);
    if (input.type === "manual_candidate") {
      const candidate = await createManualCandidate(input.candidate);
      return NextResponse.json({ data: candidate }, { status: 201 });
    }
    if (input.type === "run_refresh") {
      const result = await runScheduledIngestion(input.lane, false);
      await writeAdminAudit("manual_refresh", "refresh_lane", input.lane, { runs: result.runs.length, skipped: result.skipped.length });
      return NextResponse.json({ data: result });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PerfectPair admin operation failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Operator action failed." }, { status: 400 });
  }
}
