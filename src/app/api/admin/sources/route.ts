import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession } from "@/lib/admin-auth";
import { writeAdminAudit } from "@/lib/admin-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const httpsUrl = z.string().url().max(2_000).refine((value) => new URL(value).protocol === "https:", "HTTPS is required.");
const sourceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(96).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  feedUrl: httpsUrl,
  baseUrl: httpsUrl.optional().or(z.literal("")),
  termsUrl: httpsUrl,
  robotsUrl: httpsUrl.optional().or(z.literal("")),
  categories: z.array(z.enum(["bra", "tights", "leggings", "jeans"])).min(1).max(4),
  refreshHours: z.number().int().min(1).max(720),
  allowedFields: z.array(z.string().trim().min(1).max(80)).min(3).max(32),
  sourceKind: z.enum(["official", "affiliate_feed", "partner_api", "retailer_feed"]),
  legalBasis: z.enum(["partner_authorized", "manual_import"]),
});

const sourceActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), id: z.string().uuid() }),
  z.object({ action: z.literal("pause"), id: z.string().uuid(), reason: z.string().trim().min(4).max(240) }),
]);

function database() {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("The operations database is not configured.");
  return client;
}

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = sourceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid source record." }, { status: 400 });
  try {
    const input = parsed.data;
    const client = database();
    const { data: source, error: sourceError } = await client.from("ingestion_sources").insert({
      slug: input.slug,
      name: input.name,
      source_kind: input.sourceKind,
      base_url: input.baseUrl || null,
      legal_basis: input.legalBasis,
      crawl_policy: { format: "json_catalog_v1", feedUrl: input.feedUrl, refreshLanes: ["catalog", "price_availability"] },
      enabled: false,
      allowed_categories: input.categories,
      refresh_interval_hours: input.refreshHours,
      accountable_owner: "PerfectPair operator",
      terms_url: input.termsUrl,
      robots_url: input.robotsUrl || null,
      robots_policy: input.robotsUrl ? "honor" : "not_applicable",
      permitted_fields: input.allowedFields,
      content_handling: "facts_and_short_attribution_only",
      automated_access_permitted: false,
      publication_permitted: false,
      max_requests_per_minute: 1,
      crawler_user_agent: "PerfectPairCatalogBot/1.0",
    }).select("id, slug").single();
    if (sourceError || !source) throw new Error(sourceError?.message ?? "Source was not created.");
    const { error: reviewError } = await client.from("source_rights_reviews").insert({
      source_id: source.id,
      policy_version: "1.0",
      status: "draft",
      legal_basis: input.legalBasis,
      terms_url: input.termsUrl,
      robots_url: input.robotsUrl || null,
      allowed_fields: input.allowedFields,
      content_handling: "facts_and_short_attribution_only",
      automated_access_permitted: false,
      publication_permitted: false,
      evidence_reference: "Operator-entered source record; approval requires current terms, permitted field scope and sample-feed validation.",
    });
    if (reviewError) throw new Error(`Source was created but rights review could not be saved: ${reviewError.message}`);
    await writeAdminAudit("source_created", "ingestion_source", source.id as string, { slug: source.slug });
    return NextResponse.json({ data: source }, { status: 201 });
  } catch (error) {
    console.error("PerfectPair source creation failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Source creation failed." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = sourceActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid source action." }, { status: 400 });
  try {
    const client = database();
    if (parsed.data.action === "pause") {
      const { error } = await client.from("ingestion_sources").update({ enabled: false, paused_reason: parsed.data.reason }).eq("id", parsed.data.id);
      if (error) throw new Error(error.message);
      await writeAdminAudit("source_paused", "ingestion_source", parsed.data.id, { reason: parsed.data.reason });
      return NextResponse.json({ ok: true });
    }
    const { data: review, error: reviewError } = await client.from("source_rights_reviews").select("id, valid_until").eq("source_id", parsed.data.id).eq("status", "draft").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (reviewError || !review) throw new Error("A draft rights review is required before a source can be approved.");
    if (review.valid_until && new Date(review.valid_until as string) < new Date()) throw new Error("The source rights review has expired.");
    const { error: approvalError } = await client.from("source_rights_reviews").update({ status: "approved", automated_access_permitted: true, publication_permitted: true, reviewed_at: new Date().toISOString() }).eq("id", review.id as string);
    if (approvalError) throw new Error(approvalError.message);
    const { error: sourceError } = await client.from("ingestion_sources").update({ enabled: true, automated_access_permitted: true, publication_permitted: true, paused_reason: null, next_catalog_refresh_at: new Date().toISOString() }).eq("id", parsed.data.id);
    if (sourceError) throw new Error(sourceError.message);
    await writeAdminAudit("source_approved", "ingestion_source", parsed.data.id, { rightsReviewId: review.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PerfectPair source action failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Source action failed." }, { status: 400 });
  }
}
