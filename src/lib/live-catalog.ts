import type { BraProduct, Confidence, ProductMediaAsset, ProductScore, SourceAttribution } from "@/lib/types";
import { type CatalogProduct, type TightsProduct } from "@/lib/tights";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type LiveCatalogStatus = "ready" | "empty" | "unavailable";
export type LiveCatalogSnapshot = {
  products: CatalogProduct[];
  status: LiveCatalogStatus;
  counts: { bras: number; tights: number; total: number };
};

type RecordValue = Record<string, unknown>;

const braStyles = new Set<BraProduct["style"]>(["t_shirt", "balconette", "plunge", "full_coverage", "wireless", "bralette", "minimizer", "strapless", "sports", "nursing"]);
const wireTypes = new Set<BraProduct["wire"]>(["underwire", "wireless", "flex_wire"]);
const cupConstructions = new Set<BraProduct["cupConstruction"]>(["moulded", "seamed", "unlined", "padded", "spacer", "soft_cup"]);
const tightsStyles = new Set<TightsProduct["style"]>(["sheer", "semi_opaque", "opaque", "shaping", "thermal", "patterned"]);
const tightsOpacities = new Set<TightsProduct["opacity"]>(["ultra_sheer", "sheer", "semi_opaque", "opaque"]);
const tightsWaists = new Set<TightsProduct["waist"]>(["regular", "high_waist", "control_top", "maternity"]);
const tightsToes = new Set<Exclude<TightsProduct["toe"], "not_verified">>(["reinforced", "sheer", "sandal", "closed"]);

function string(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).map((entry) => entry.trim()) : [];
}

function relatedBrand(value: unknown) {
  const record = Array.isArray(value) ? value[0] : value;
  return record && typeof record === "object" ? record as RecordValue : {};
}

function enumValue<Value extends string>(value: unknown, allowed: Set<Value>, fallback: Value) {
  return typeof value === "string" && allowed.has(value as Value) ? value as Value : fallback;
}

function source(url: string | undefined, updatedAt: string): SourceAttribution[] {
  return [{
    layer: "manufacturer",
    sourceKind: "public_page",
    sourceName: "Reviewed product fact record",
    sourceUrl: url,
    capturedAt: updatedAt,
    confidence: "verified",
    verifiedAt: updatedAt,
  }];
}

function score(row: RecordValue | undefined, category: "bra" | "tights"): ProductScore {
  const reviews = number(row?.review_count);
  const overall = number(row?.overall);
  const confidence: Confidence = reviews >= 20 ? "established" : reviews > 0 ? "developing" : "emerging";
  return {
    overall,
    comfort: number(row?.comfort),
    bandComfort: number(category === "bra" ? row?.band_comfort : row?.waist_comfort),
    cupFit: number(category === "bra" ? row?.cup_fit : row?.coverage),
    wireComfort: number(row?.wire_comfort),
    strapComfort: number(row?.strap_comfort),
    stayPut: number(row?.stay_put),
    sideSupport: number(row?.side_support),
    breathability: number(row?.breathability),
    durability: number(row?.durability),
    sizeAccuracy: number(row?.size_accuracy),
    value: number(category === "bra" ? row?.value : row?.value_score),
    reviewCount: reviews,
    confidence,
  };
}

function approvedMedia(rows: RecordValue[], category: "bra" | "tights", productId: string): ProductMediaAsset[] {
  const now = Date.now();
  return rows
    .filter((row) => String(category === "bra" ? row.product_id : row.tights_product_id) === productId)
    .filter((row) => !row.licence_expires_at || Date.parse(String(row.licence_expires_at)) > now)
    .sort((left, right) => Number(Boolean(right.is_primary)) - Number(Boolean(left.is_primary)) || String(left.created_at).localeCompare(String(right.created_at)))
    .map((row) => ({
      id: string(row.id),
      url: string(row.delivery_url),
      alt: string(row.alt_text),
      kind: enumValue(row.media_kind, new Set<ProductMediaAsset["kind"]>(["packshot", "detail", "on_body", "editorial", "owned_photo"]), "packshot"),
      attribution: string(row.attribution_text) || undefined,
    }))
    .filter((asset) => Boolean(asset.id && asset.url && asset.alt));
}

function braProduct(row: RecordValue, scorecard: RecordValue | undefined, media: RecordValue[]): BraProduct | null {
  const style = enumValue(row.style, braStyles, "t_shirt");
  const wire = enumValue(row.wire, wireTypes, "underwire");
  const cupConstruction = enumValue(row.cup_construction, cupConstructions, "unlined");
  const support = Math.max(1, Math.min(5, Math.round(number(row.support_level, 3)))) as BraProduct["supportLevel"];
  const brand = relatedBrand(row.brands);
  const updatedAt = string(row.updated_at, new Date(0).toISOString());
  const officialUrl = string(row.official_url) || undefined;
  if (!string(row.id) || !string(row.slug) || !string(row.name) || !string(brand.name)) return null;
  return {
    id: string(row.id),
    slug: string(row.slug),
    brand: string(brand.name),
    name: string(row.name),
    country: string(brand.country_code) || undefined,
    style,
    wire,
    cupConstruction,
    supportLevel: support,
    material: strings(row.material_composition),
    features: strings(row.features),
    useCases: strings(row.use_cases).filter((value): value is BraProduct["useCases"][number] => ["everyday", "work", "lounge", "occasion", "travel", "exercise"].includes(value)),
    fit: "varies",
    fitNotes: ["Published from a reviewed product fact record. Check the current brand size chart before purchase."],
    sizeSystem: ["US_CA", "UK", "EU", "AU_NZ", "brand_specific"].includes(string(row.size_system)) ? string(row.size_system) as BraProduct["sizeSystem"] : "brand_specific",
    sizeRange: string(row.size_range, "See the current brand size chart"),
    construction: {},
    price: { currency: "USD", amount: 0, observedAt: updatedAt, priceType: "list" },
    availability: "unknown",
    score: score(scorecard, "bra"),
    media: approvedMedia(media, "bra", string(row.id)),
    data: source(officialUrl, updatedAt),
    updatedAt,
    productVersion: string(row.current_version, "1.0"),
  };
}

function tightsProduct(row: RecordValue, scorecard: RecordValue | undefined, media: RecordValue[]): TightsProduct | null {
  const brand = relatedBrand(row.brands);
  const updatedAt = string(row.updated_at, new Date(0).toISOString());
  const officialUrl = string(row.official_url) || undefined;
  if (!string(row.id) || !string(row.slug) || !string(row.name) || !string(brand.name)) return null;
  return {
    kind: "tights",
    id: string(row.id),
    slug: string(row.slug),
    brand: string(brand.name),
    name: string(row.name),
    country: string(brand.country_code) || undefined,
    style: enumValue(row.style, tightsStyles, "opaque"),
    denier: Math.max(1, Math.min(300, Math.round(number(row.denier, 1)))),
    opacity: enumValue(row.opacity, tightsOpacities, "opaque"),
    material: strings(row.material_composition),
    features: strings(row.features),
    useCases: strings(row.use_cases).filter((value): value is TightsProduct["useCases"][number] => ["everyday", "work", "occasion", "travel", "cold_weather"].includes(value)),
    fit: "varies",
    fitNotes: ["Published from a reviewed product fact record. Check the current brand size chart before purchase."],
    sizeRange: string(row.size_range, "See the current brand size chart"),
    waist: enumValue(row.waist_construction, tightsWaists, "regular"),
    // Null in the canonical record means that the source did not establish a
    // toe construction. Do not silently turn that absence into "closed".
    toe: enumValue(row.toe_construction, tightsToes, "not_verified"),
    warmth: Math.max(1, Math.min(5, Math.round(number(row.warmth_level, 1)))) as TightsProduct["warmth"],
    compression: Math.max(0, Math.min(5, Math.round(number(row.compression_level, 0)))) as TightsProduct["compression"],
    price: { currency: "USD", amount: 0, observedAt: updatedAt, priceType: "list" },
    availability: "unknown",
    score: score(scorecard, "tights"),
    media: approvedMedia(media, "tights", string(row.id)),
    data: source(officialUrl, updatedAt),
    updatedAt,
    productVersion: string(row.current_version, "1.0"),
  };
}

/** Reads only published canonical records. Development fixtures are never a
 * fallback: an empty database is intentionally shown as an empty catalogue. */
export async function getLiveCatalog(): Promise<LiveCatalogSnapshot> {
  const database = getSupabaseAdmin();
  if (!database) return { products: [], status: "unavailable", counts: { bras: 0, tights: 0, total: 0 } };
  const [brasResult, tightsResult, braScoresResult, tightsScoresResult, mediaResult] = await Promise.all([
    database.from("products").select("id, slug, name, family, style, wire, cup_construction, support_level, material_composition, features, use_cases, size_system, size_range, official_url, current_version, updated_at, brands(name, country_code)").eq("lifecycle_status", "active").order("updated_at", { ascending: false }).limit(500),
    database.from("tights_products").select("id, slug, name, family, style, denier, opacity, waist_construction, toe_construction, warmth_level, compression_level, material_composition, features, use_cases, size_range, official_url, current_version, updated_at, brands(name, country_code)").eq("lifecycle_status", "active").order("updated_at", { ascending: false }).limit(500),
    database.from("product_scorecards").select("product_id, review_count, overall, comfort, band_comfort, cup_fit, wire_comfort, strap_comfort, stay_put, side_support, breathability, durability, size_accuracy, value"),
    database.from("tights_product_scorecards").select("product_id, review_count, overall, comfort, waist_comfort, coverage, stay_put, toe_comfort, breathability, durability, size_accuracy, value_score"),
    database.from("product_media_assets").select("id, product_id, tights_product_id, delivery_url, alt_text, media_kind, attribution_text, licence_expires_at, is_primary, created_at").eq("rights_status", "approved"),
  ]);
  if (brasResult.error || tightsResult.error || braScoresResult.error || tightsScoresResult.error) {
    console.error("PerfectPair live catalogue query failed", { bras: brasResult.error?.message, tights: tightsResult.error?.message, braScores: braScoresResult.error?.message, tightsScores: tightsScoresResult.error?.message });
    return { products: [], status: "unavailable", counts: { bras: 0, tights: 0, total: 0 } };
  }
  const braScores = new Map((braScoresResult.data ?? []).map((entry) => [String(entry.product_id), entry as RecordValue]));
  const tightsScores = new Map((tightsScoresResult.data ?? []).map((entry) => [String(entry.product_id), entry as RecordValue]));
  if (mediaResult.error) console.warn("PerfectPair product-media registry is not available yet", mediaResult.error.message);
  const media = (mediaResult.data ?? []) as RecordValue[];
  const bras = (brasResult.data ?? []).map((entry) => braProduct(entry as RecordValue, braScores.get(String(entry.id)), media)).filter((entry): entry is BraProduct => Boolean(entry));
  const tights = (tightsResult.data ?? []).map((entry) => tightsProduct(entry as RecordValue, tightsScores.get(String(entry.id)), media)).filter((entry): entry is TightsProduct => Boolean(entry));
  const products = [...bras, ...tights].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return { products, status: products.length ? "ready" : "empty", counts: { bras: bras.length, tights: tights.length, total: products.length } };
}

export async function getLiveProductBySlug(slug: string) {
  const catalog = await getLiveCatalog();
  return { product: catalog.products.find((entry) => entry.slug === slug), status: catalog.status };
}
