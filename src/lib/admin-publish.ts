import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { writeAdminAudit } from "./admin-data";

const braStyles = new Set(["t_shirt", "balconette", "plunge", "full_coverage", "wireless", "bralette", "minimizer", "strapless", "sports", "nursing"]);
const wireTypes = new Set(["underwire", "wireless", "flex_wire"]);
const cupConstructions = new Set(["moulded", "seamed", "unlined", "padded", "spacer", "soft_cup"]);
const tightsStyles = new Set(["sheer", "semi_opaque", "opaque", "shaping", "thermal", "patterned"]);
const tightsOpacities = new Set(["ultra_sheer", "sheer", "semi_opaque", "opaque"]);
const waists = new Set(["regular", "high_waist", "control_top", "maternity"]);
const toes = new Set(["reinforced", "sheer", "sandal", "closed"]);

function database() {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("The operations database is not configured.");
  return client;
}

function fail(error: { message: string } | null, message: string) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

function string(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Candidate is missing ${label}.`);
  return value.trim();
}

function number(value: unknown, label: string) {
  const result = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(result)) throw new Error(`Candidate is missing ${label}.`);
  return result;
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).map((entry) => entry.trim()) : [];
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 96);
}

async function brandId(brand: string) {
  const client = database();
  const { data: existing, error: lookupError } = await client.from("brands").select("id").eq("name", brand).maybeSingle();
  fail(lookupError, "Could not look up brand");
  if (existing) return existing.id as string;
  const { data, error } = await client.from("brands").insert({ name: brand, slug: slugify(brand), active: true }).select("id").single();
  fail(error, "Could not create brand");
  if (!data) throw new Error("Brand creation returned no record.");
  return data.id as string;
}

async function candidateSource(candidate: { run_id: string; canonical_url: string }) {
  const client = database();
  const { data: run, error: runError } = await client.from("ingestion_runs").select("source_id").eq("id", candidate.run_id).single();
  fail(runError, "Could not read candidate source run");
  if (!run) throw new Error("Candidate source run was not found.");
  const { data: source, error: sourceError } = await client.from("ingestion_sources").select("name, source_kind").eq("id", run.source_id as string).single();
  fail(sourceError, "Could not read candidate source");
  if (!source) throw new Error("Candidate source was not found.");
  return { sourceName: source.name as string, sourceKind: source.source_kind as string, sourceUrl: candidate.canonical_url, runId: candidate.run_id };
}

async function recordObservations(table: "product_observations" | "tights_product_observations" | "fit_product_observations", productId: string, payload: Record<string, unknown>, source: Awaited<ReturnType<typeof candidateSource>>) {
  const client = database();
  const observedAt = new Date().toISOString();
  const rows = Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([fieldName, value]) => ({
      product_id: productId,
      field_name: fieldName,
      value,
      data_layer: "manufacturer",
      source_kind: source.sourceKind,
      source_name: source.sourceName,
      source_url: source.sourceUrl,
      confidence: "verified",
      observed_at: observedAt,
      verified_at: observedAt,
      ingestion_run_id: source.runId,
    }));
  if (!rows.length) return;
  const { error } = await client.from(table).insert(rows);
  fail(error, "Could not store field provenance");
}

function lowerBodyAttributes(category: "leggings" | "jeans", value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Lower-body candidate is missing verified fit attributes.");
  const input = value as Record<string, unknown>;
  const allowedKeys = category === "leggings" ? ["rise", "compression", "stretch", "inseam"] : ["cut", "rise", "stretch", "inseam"];
  const attributes = Object.fromEntries(Object.entries(input)
    .filter(([key, entry]) => allowedKeys.includes(key) && typeof entry === "string" && entry.trim())
    .map(([key, entry]) => [key, (entry as string).trim()]));
  const rise = attributes.rise;
  if (rise !== "low" && rise !== "mid" && rise !== "high") throw new Error("Lower-body candidate needs a verified low, mid or high rise.");
  if (category === "leggings") {
    if (attributes.compression && !["none", "light", "firm"].includes(attributes.compression)) throw new Error("Leggings compression must be none, light or firm.");
  } else {
    if (!attributes.cut || !["skinny", "slim", "straight", "wide_leg", "bootcut", "flare", "relaxed", "boyfriend", "barrel"].includes(attributes.cut)) {
      throw new Error("Jeans candidate needs a verified supported cut.");
    }
  }
  if (attributes.stretch && !["rigid", "some_stretch", "stretch"].includes(attributes.stretch)) throw new Error("Stretch must be rigid, some_stretch or stretch.");
  if (attributes.inseam && attributes.inseam.length > 60) throw new Error("Inseam value is too long.");
  return attributes;
}

/** Publishing is deliberate and creates versioned canonical facts. The caller
 * has already authenticated as an operator; unknown enum values are rejected
 * rather than guessed. */
export async function publishCandidate(candidateId: string, reviewerNote?: string) {
  const client = database();
  const { data: candidate, error: candidateError } = await client
    .from("ingestion_candidates")
    .select("id, run_id, canonical_url, normalized_payload, product_category, status")
    .eq("id", candidateId)
    .single();
  fail(candidateError, "Could not load candidate");
  if (!candidate) throw new Error("Candidate was not found.");
  if (candidate.status === "published") throw new Error("This candidate has already been published.");
  const payload = candidate.normalized_payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Candidate does not contain a normalized product record.");
  const fields = payload as Record<string, unknown>;
  const brand = string(fields.brand, "brand");
  const name = string(fields.name, "product name");
  const source = await candidateSource({ run_id: candidate.run_id as string, canonical_url: candidate.canonical_url as string });
  const currentBrandId = await brandId(brand);
  const version = `source-${candidateId.slice(0, 8)}`;
  const material = strings(fields.material);

  if (candidate.product_category === "bra") {
    const style = string(fields.style, "bra style");
    const wire = string(fields.wire, "wire type");
    const cupConstruction = string(fields.cupConstruction, "cup construction");
    const supportLevel = number(fields.supportLevel, "support level");
    if (!braStyles.has(style) || !wireTypes.has(wire) || !cupConstructions.has(cupConstruction) || supportLevel < 1 || supportLevel > 5) {
      throw new Error("Bra candidate has unsupported construction values; correct it before publishing.");
    }
    const { data: existing, error: existingError } = await client.from("products").select("id").eq("brand_id", currentBrandId).eq("name", name).maybeSingle();
    fail(existingError, "Could not look up existing bra product");
    const canonical = {
      name,
      style,
      wire,
      cup_construction: cupConstruction,
      support_level: supportLevel,
      material_composition: material,
      size_system: "brand_specific",
      size_range: typeof fields.sizeRange === "string" ? fields.sizeRange : null,
      official_url: candidate.canonical_url,
      lifecycle_status: "active",
      current_version: version,
    };
    let productId: string;
    if (existing) {
      const { data, error } = await client.from("products").update(canonical).eq("id", existing.id as string).select("id").single();
      fail(error, "Could not update bra product");
      if (!data) throw new Error("Bra product update returned no record.");
      productId = data.id as string;
    } else {
      const { data, error } = await client.from("products").insert({ ...canonical, brand_id: currentBrandId, slug: `${slugify(`${brand}-${name}`)}-${candidateId.slice(0, 6)}` }).select("id").single();
      fail(error, "Could not create bra product");
      if (!data) throw new Error("Bra product creation returned no record.");
      productId = data.id as string;
    }
    await recordObservations("product_observations", productId, fields, source);
    const { error: versionError } = await client.from("product_versions").insert({ product_id: productId, version, change_kind: "created", snapshot: fields });
    fail(versionError, "Could not create bra product version");
    const { error: candidateUpdateError } = await client.from("ingestion_candidates").update({ status: "published", published_product_id: productId, reviewer_note: reviewerNote?.trim() || null, reviewed_at: new Date().toISOString() }).eq("id", candidateId);
    fail(candidateUpdateError, "Could not mark candidate published");
    await writeAdminAudit("candidate_published", "product", productId, { candidateId, category: "bra" });
    return { category: "bra" as const, productId };
  }

  if (candidate.product_category === "leggings" || candidate.product_category === "jeans") {
    const category = candidate.product_category;
    const attributes = lowerBodyAttributes(category, fields.attributes);
    const { data: existing, error: existingError } = await client.from("fit_products").select("id").eq("brand_id", currentBrandId).eq("category", category).eq("name", name).maybeSingle();
    fail(existingError, "Could not look up existing lower-body product");
    const canonical = {
      name,
      category,
      attributes,
      material_composition: material,
      size_system: "brand_specific",
      size_range: typeof fields.sizeRange === "string" ? fields.sizeRange : null,
      official_url: candidate.canonical_url,
      lifecycle_status: "active",
      current_version: version,
    };
    let productId: string;
    if (existing) {
      const { data, error } = await client.from("fit_products").update(canonical).eq("id", existing.id as string).select("id").single();
      fail(error, "Could not update lower-body product");
      if (!data) throw new Error("Lower-body product update returned no record.");
      productId = data.id as string;
    } else {
      const { data, error } = await client.from("fit_products").insert({ ...canonical, brand_id: currentBrandId, slug: `${slugify(`${brand}-${name}`)}-${candidateId.slice(0, 6)}` }).select("id").single();
      fail(error, "Could not create lower-body product");
      if (!data) throw new Error("Lower-body product creation returned no record.");
      productId = data.id as string;
    }
    await recordObservations("fit_product_observations", productId, fields, source);
    const { error: versionError } = await client.from("fit_product_versions").insert({ product_id: productId, version, change_kind: "created", snapshot: fields });
    fail(versionError, "Could not create lower-body product version");
    const { error: candidateUpdateError } = await client.from("ingestion_candidates").update({ status: "published", published_fit_product_id: productId, reviewer_note: reviewerNote?.trim() || null, reviewed_at: new Date().toISOString() }).eq("id", candidateId);
    fail(candidateUpdateError, "Could not mark candidate published");
    await writeAdminAudit("candidate_published", "fit_product", productId, { candidateId, category });
    return { category, productId };
  }

  const style = string(fields.style, "tights style");
  const opacity = string(fields.opacity, "opacity");
  const waist = string(fields.waist, "waist construction");
  const denier = number(fields.denier, "denier");
  if (!tightsStyles.has(style) || !tightsOpacities.has(opacity) || !waists.has(waist) || denier < 1 || denier > 300) {
    throw new Error("Tights candidate has unsupported construction values; correct it before publishing.");
  }
  const toe = typeof fields.toe === "string" && toes.has(fields.toe) ? fields.toe : null;
  const { data: existing, error: existingError } = await client.from("tights_products").select("id").eq("brand_id", currentBrandId).eq("name", name).maybeSingle();
  fail(existingError, "Could not look up existing tights product");
  const canonical = {
    name,
    style,
    denier,
    opacity,
    waist_construction: waist,
    toe_construction: toe,
    material_composition: material,
    size_system: "brand_specific",
    size_range: typeof fields.sizeRange === "string" ? fields.sizeRange : null,
    official_url: candidate.canonical_url,
    lifecycle_status: "active",
    current_version: version,
  };
  let productId: string;
  if (existing) {
    const { data, error } = await client.from("tights_products").update(canonical).eq("id", existing.id as string).select("id").single();
    fail(error, "Could not update tights product");
    if (!data) throw new Error("Tights product update returned no record.");
    productId = data.id as string;
  } else {
    const { data, error } = await client.from("tights_products").insert({ ...canonical, brand_id: currentBrandId, slug: `${slugify(`${brand}-${name}`)}-${candidateId.slice(0, 6)}` }).select("id").single();
    fail(error, "Could not create tights product");
    if (!data) throw new Error("Tights product creation returned no record.");
    productId = data.id as string;
  }
  await recordObservations("tights_product_observations", productId, fields, source);
  const { error: versionError } = await client.from("tights_product_versions").insert({ product_id: productId, version, change_kind: "created", snapshot: fields });
  fail(versionError, "Could not create tights product version");
  const { error: candidateUpdateError } = await client.from("ingestion_candidates").update({ status: "published", published_tights_product_id: productId, reviewer_note: reviewerNote?.trim() || null, reviewed_at: new Date().toISOString() }).eq("id", candidateId);
  fail(candidateUpdateError, "Could not mark candidate published");
  await writeAdminAudit("candidate_published", "tights_product", productId, { candidateId, category: "tights" });
  return { category: "tights" as const, productId };
}
