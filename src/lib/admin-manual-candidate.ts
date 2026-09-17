import { createHash } from "node:crypto";
import { z } from "zod";
import { writeAdminAudit } from "@/lib/admin-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const sourceSlug = "operator-verified-facts";
const httpsUrl = z.string().url().max(2_000).refine((value) => new URL(value).protocol === "https:", "An HTTPS source URL is required.");
const baseProduct = z.object({
  brand: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(180),
  material: z.array(z.string().trim().min(1).max(80)).max(16).default([]),
  sizeRange: z.string().trim().min(1).max(100).optional(),
});
const braProduct = baseProduct.extend({
  style: z.enum(["t_shirt", "balconette", "plunge", "full_coverage", "wireless", "bralette", "minimizer", "strapless", "sports", "nursing"]),
  wire: z.enum(["underwire", "wireless", "flex_wire"]),
  cupConstruction: z.enum(["moulded", "seamed", "unlined", "padded", "spacer", "soft_cup"]),
  supportLevel: z.number().int().min(1).max(5),
});
const tightsProduct = baseProduct.extend({
  style: z.enum(["sheer", "semi_opaque", "opaque", "shaping", "thermal", "patterned"]),
  denier: z.number().int().min(1).max(300),
  opacity: z.enum(["ultra_sheer", "sheer", "semi_opaque", "opaque"]),
  waist: z.enum(["regular", "high_waist", "control_top", "maternity"]),
  toe: z.enum(["reinforced", "sheer", "sandal", "closed"]).optional(),
});

export const manualCandidateSchema = z.discriminatedUnion("category", [
  z.object({ category: z.literal("bra"), canonicalUrl: httpsUrl, product: braProduct }),
  z.object({ category: z.literal("tights"), canonicalUrl: httpsUrl, product: tightsProduct }),
]);

function database() {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("The operations database is not configured.");
  return client;
}

async function manualSource() {
  const client = database();
  const { data: existing, error: existingError } = await client.from("ingestion_sources").select("id").eq("slug", sourceSlug).maybeSingle();
  if (existingError) throw new Error(`Could not load the manual-facts source: ${existingError.message}`);
  let sourceId = existing?.id as string | undefined;
  if (!sourceId) {
    const { data, error } = await client.from("ingestion_sources").insert({
      slug: sourceSlug,
      name: "Operator-verified fact records",
      source_kind: "public_page",
      legal_basis: "manual_import",
      crawl_policy: { format: "manual_operator_entry", no_automated_fetch: true },
      enabled: false,
      allowed_categories: ["bra", "tights"],
      accountable_owner: "PerfectPair operator",
      robots_policy: "not_applicable",
      permitted_fields: ["brand", "name", "construction", "material", "sizeRange", "denier", "officialUrl"],
      content_handling: "manual_facts_only",
      automated_access_permitted: false,
      publication_permitted: true,
    }).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "Could not create the manual-facts source.");
    sourceId = data.id as string;
  }
  const { data: approved, error: rightsError } = await client.from("source_rights_reviews").select("id").eq("source_id", sourceId).eq("status", "approved").maybeSingle();
  if (rightsError) throw new Error(`Could not load manual-facts permission record: ${rightsError.message}`);
  if (approved) return { sourceId, rightsReviewId: approved.id as string };
  const { data: rights, error } = await client.from("source_rights_reviews").insert({
    source_id: sourceId,
    policy_version: "1.0",
    status: "approved",
    legal_basis: "manual_import",
    allowed_fields: ["brand", "name", "construction", "material", "sizeRange", "denier", "officialUrl"],
    content_handling: "manual_facts_only",
    automated_access_permitted: false,
    publication_permitted: true,
    evidence_reference: "Operator-entered factual record. No automatic fetch, copied editorial text, image, SKU inventory, or credentials are permitted.",
  }).select("id").single();
  if (error || !rights) throw new Error(error?.message ?? "Could not save the manual-facts permission record.");
  return { sourceId, rightsReviewId: rights.id as string };
}

async function existingRecord(category: "bra" | "tights", canonicalUrl: string) {
  const client = database();
  const { data: candidate, error: candidateError } = await client
    .from("ingestion_candidates")
    .select("id, status")
    .eq("product_category", category)
    .eq("canonical_url", canonicalUrl)
    .neq("status", "rejected")
    .maybeSingle();
  if (candidateError) throw new Error(`Could not check the candidate queue: ${candidateError.message}`);
  if (candidate) return { id: candidate.id as string, state: candidate.status as string, type: "candidate" as const };

  const productTable = category === "bra" ? "products" : "tights_products";
  const { data: product, error: productError } = await client
    .from(productTable)
    .select("id")
    .eq("official_url", canonicalUrl)
    .maybeSingle();
  if (productError) throw new Error(`Could not check published products: ${productError.message}`);
  return product ? { id: product.id as string, state: "published", type: "product" as const } : null;
}

/** Creates a private candidate; it cannot become public until a separate
 * operator action publishes it. This path deliberately has no network fetch. */
export async function createManualCandidate(input: z.infer<typeof manualCandidateSchema>) {
  const client = database();
  const parsed = manualCandidateSchema.parse(input);
  const existing = await existingRecord(parsed.category, parsed.canonicalUrl);
  if (existing) return { id: existing.id, duplicate: true, state: existing.state, type: existing.type };
  const source = await manualSource();
  const now = new Date().toISOString();
  const { data: run, error: runError } = await client.from("ingestion_runs").insert({
    source_id: source.sourceId,
    status: "completed",
    started_at: now,
    completed_at: now,
    refresh_lane: "catalog",
    trigger_kind: "manual",
    rights_review_id: source.rightsReviewId,
    request_count: 0,
    no_change_count: 0,
    counts: { manualCandidates: 1 },
    log: [{ event: "manual_candidate_created", at: now }],
  }).select("id").single();
  if (runError || !run) throw new Error(runError?.message ?? "Could not create the manual review run.");
  const product = parsed.product;
  const externalId = `manual-${createHash("sha256").update(`${parsed.category}:${parsed.canonicalUrl}:${product.brand}:${product.name}:${now}`).digest("hex").slice(0, 24)}`;
  const { data: candidate, error: candidateError } = await client.from("ingestion_candidates").insert({
    run_id: run.id,
    external_id: externalId,
    canonical_url: parsed.canonicalUrl,
    raw_payload: { product, entryMethod: "operator_verified_facts" },
    normalized_payload: product,
    field_sources: Object.fromEntries(Object.keys(product).map((field) => [field, { sourceUrl: parsed.canonicalUrl, method: "manual_operator_entry" }])),
    quality_score: 100,
    quality_reasons: ["Operator-entered factual record; publication still requires final review."],
    blocking_issues: [],
    status: "needs_review",
    product_category: parsed.category,
    content_fingerprint: createHash("sha256").update(JSON.stringify({ category: parsed.category, product, url: parsed.canonicalUrl })).digest("hex"),
    retention_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  }).select("id").single();
  if (candidateError || !candidate) throw new Error(candidateError?.message ?? "Could not create the manual candidate.");
  await writeAdminAudit("manual_candidate_created", "ingestion_candidate", candidate.id as string, { category: parsed.category, source: "operator_verified_facts" });
  return { id: candidate.id as string, duplicate: false, state: "needs_review", type: "candidate" as const };
}
