import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { IngestionCandidate, NormalizedCandidate, ProductCategory, SourceAttribution, SourceKind } from "@/lib/types";
import type { RefreshLane, SourceAdapter, SourceDiscoveryResult, SourceRightsPolicy } from "./types";

type SourceRow = {
  id: string;
  slug: string;
  name: string;
  source_kind: SourceAdapter["kind"];
  base_url: string | null;
  legal_basis: SourceAdapter["legalBasis"];
  crawl_policy: unknown;
  enabled: boolean;
  allowed_categories: string[];
  refresh_interval_hours: number | null;
  accountable_owner: string | null;
  terms_url: string | null;
  robots_url: string | null;
  robots_policy: "honor" | "not_applicable";
  permitted_fields: string[];
  content_handling: SourceRightsPolicy["contentHandling"];
  automated_access_permitted: boolean;
  publication_permitted: boolean;
  max_requests_per_minute: number | null;
  crawler_user_agent: string | null;
};

type RightsReviewRow = {
  id: string;
  source_id: string;
  status: string;
  legal_basis: SourceAdapter["legalBasis"];
  terms_url: string | null;
  robots_url: string | null;
  allowed_fields: string[];
  content_handling: SourceRightsPolicy["contentHandling"];
  automated_access_permitted: boolean;
  publication_permitted: boolean;
  evidence_reference: string;
  reviewed_at: string;
  valid_until: string | null;
};

type CheckpointRow = {
  id: string;
  source_id: string;
  lane: RefreshLane;
  cursor: string | null;
  etag: string | null;
  last_modified: string | null;
  next_due_at: string | null;
  failure_count: number;
};

type FeedPolicy = {
  format: "json_catalog_v1";
  feedUrl: string;
  refreshLanes?: RefreshLane[];
  defaultCategory?: ProductCategory;
};

export interface LoadedDatabaseSources {
  sources: SourceAdapter[];
  skipped: Array<{ sourceId: string; reason: string }>;
}

const permittedLanes = new Set<RefreshLane>(["catalog", "price_availability", "gap_discovery"]);
const blockedHostSuffixes = [".local", ".internal"];
const rawFields = [
  "brand", "name", "title", "style", "wire", "cupConstruction", "supportLevel", "material", "sizeRange", "sizes",
  "price", "currency", "availability", "denier", "opacity", "waist", "toe", "compression", "sku", "id", "handle", "url",
  "productUrl", "canonicalUrl", "category", "updatedAt", "rise", "stretch", "inseam", "cut", "fit",
] as const;

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).map((entry) => entry.trim()) : undefined;
}

function asNumber(value: unknown) {
  const candidate = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(candidate) ? candidate : undefined;
}

function safeHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const privateIpv4 = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);
    if (url.protocol !== "https:" || host === "localhost" || host === "::1" || privateIpv4 || blockedHostSuffixes.some((suffix) => host.endsWith(suffix))) return null;
    return url;
  } catch {
    return null;
  }
}

function parsePolicy(value: unknown): FeedPolicy | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const policy = value as Record<string, unknown>;
  const feedUrl = asString(policy.feedUrl);
  if (policy.format !== "json_catalog_v1" || !feedUrl || !safeHttpsUrl(feedUrl)) return null;
  const defaultCategory = policy.defaultCategory === "bra" || policy.defaultCategory === "tights" || policy.defaultCategory === "leggings" || policy.defaultCategory === "jeans" ? policy.defaultCategory : undefined;
  const requestedLanes = Array.isArray(policy.refreshLanes) ? policy.refreshLanes.filter((lane): lane is RefreshLane => typeof lane === "string" && permittedLanes.has(lane as RefreshLane)) : undefined;
  return { format: "json_catalog_v1", feedUrl, defaultCategory, refreshLanes: requestedLanes?.length ? requestedLanes : ["catalog", "price_availability"] };
}

function categoryFrom(value: unknown, fallback: ProductCategory | undefined, allowed: ProductCategory[]): ProductCategory | null {
  const normalized = typeof value === "string" ? value.toLowerCase().trim() : "";
  const category = normalized === "tights" || normalized === "hosiery" || normalized === "pantyhose" ? "tights"
    : normalized === "bra" || normalized === "bras" ? "bra"
      : normalized === "legging" || normalized === "leggings" ? "leggings"
        : normalized === "jean" || normalized === "jeans" || normalized === "denim" ? "jeans"
          : fallback;
  return category && allowed.includes(category) ? category : null;
}

function pickRawRecord(input: Record<string, unknown>) {
  const raw: Record<string, unknown> = {};
  for (const key of rawFields) {
    const value = input[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") raw[key] = value;
    if (key === "material" && Array.isArray(value)) raw[key] = value.filter((entry) => typeof entry === "string").slice(0, 24);
  }
  return raw;
}

function recordsFromPayload(payload: unknown) {
  const list = Array.isArray(payload) ? payload : payload && typeof payload === "object" ? (["items", "products", "data"]
    .map((key) => (payload as Record<string, unknown>)[key])
    .find(Array.isArray) as unknown[] | undefined) : undefined;
  return (list ?? []).filter((record): record is Record<string, unknown> => Boolean(record) && typeof record === "object" && !Array.isArray(record));
}

function fieldSource(source: SourceRow, review: RightsReviewRow, capturedAt: string): SourceAttribution {
  return {
    layer: "manufacturer",
    sourceKind: source.source_kind as SourceKind,
    sourceName: source.name,
    sourceUrl: source.base_url ?? review.terms_url ?? undefined,
    capturedAt,
    confidence: "verified",
    verifiedAt: review.reviewed_at,
  };
}

function buildNormalizer(source: SourceRow, review: RightsReviewRow) {
  return async (candidate: IngestionCandidate): Promise<NormalizedCandidate> => {
    const raw = candidate.raw;
    const capturedAt = candidate.observedAt;
    const attribution = fieldSource(source, review, capturedAt);
    const rawMaterial = asStringArray(raw.material) ?? [];
    const brand = asString(raw.brand) ?? source.name;
    const name = asString(raw.name) ?? asString(raw.title) ?? "Unlabelled product";
    const shared: Record<string, unknown> = {
      brand,
      name,
      material: rawMaterial,
      sizeRange: asString(raw.sizeRange) ?? asString(raw.sizes) ?? "",
      updatedAt: asString(raw.updatedAt) ?? capturedAt,
    };
    const price = asNumber(raw.price);
    if (price !== undefined) shared.price = { amount: price, currency: asString(raw.currency) ?? "USD", observedAt: capturedAt, priceType: "list" };
    const category = candidate.category ?? "bra";
    const product = category === "bra"
      ? { ...shared, style: asString(raw.style) ?? "other", wire: asString(raw.wire) ?? "unknown", cupConstruction: asString(raw.cupConstruction) ?? "unknown", supportLevel: asNumber(raw.supportLevel) ?? 0 }
      : category === "tights"
        ? { ...shared, style: asString(raw.style) ?? "other", denier: asNumber(raw.denier) ?? 0, opacity: asString(raw.opacity) ?? "unknown", waist: asString(raw.waist) ?? "unknown", toe: asString(raw.toe), compression: asNumber(raw.compression) }
        : {
          ...shared,
          attributes: Object.fromEntries(Object.entries({
            rise: asString(raw.rise),
            compression: asString(raw.compression),
            stretch: asString(raw.stretch),
            inseam: asString(raw.inseam),
            cut: asString(raw.cut) ?? asString(raw.fit) ?? asString(raw.style),
          }).filter(([, value]) => value !== undefined)),
        };
    const fieldSources = Object.fromEntries(Object.entries(product).filter(([, value]) => value !== undefined && value !== "").map(([key]) => [key, attribution]));
    return { candidate, product, fieldSources };
  };
}

function makeAdapter(source: SourceRow, review: RightsReviewRow, checkpoint: CheckpointRow | undefined): SourceAdapter | null {
  const policy = parsePolicy(source.crawl_policy);
  const allowedCategories = source.allowed_categories.filter((category): category is ProductCategory => category === "bra" || category === "tights" || category === "leggings" || category === "jeans");
  if (!policy || !allowedCategories.length) return null;
  const rights: SourceRightsPolicy = {
    termsUrl: review.terms_url ?? source.terms_url ?? undefined,
    robotsUrl: review.robots_url ?? source.robots_url ?? undefined,
    reviewedAt: review.reviewed_at,
    validUntil: review.valid_until ?? undefined,
    robotsPolicy: source.robots_policy,
    allowedFields: review.allowed_fields.length ? review.allowed_fields : source.permitted_fields,
    contentHandling: review.content_handling,
    permitsAutomatedAccess: review.automated_access_permitted && source.automated_access_permitted,
    permitsPublication: review.publication_permitted && source.publication_permitted,
    maxRequestsPerMinute: source.max_requests_per_minute ?? 1,
    userAgent: source.crawler_user_agent ?? "PerfectPairCatalogBot/1.0",
    evidenceReference: review.evidence_reference,
  };
  const adapter: SourceAdapter = {
    id: source.slug,
    name: source.name,
    kind: source.source_kind,
    legalBasis: source.legal_basis,
    enabled: source.enabled,
    allowedCategories,
    refreshIntervalHours: source.refresh_interval_hours ?? 24,
    refreshLanes: policy.refreshLanes ?? ["catalog", "price_availability"],
    accountableOwner: source.accountable_owner ?? "catalog@perfectpair.example",
    rights,
    requiresHumanReview: true,
    databaseBinding: {
      sourceRecordId: source.id,
      rightsReviewId: review.id,
      checkpointId: checkpoint?.id,
      cursor: checkpoint?.cursor,
      etag: checkpoint?.etag,
      lastModified: checkpoint?.last_modified,
      nextDueAt: checkpoint?.next_due_at,
      failureCount: checkpoint?.failure_count,
    },
    async discover(): Promise<SourceDiscoveryResult> {
      const url = safeHttpsUrl(policy.feedUrl);
      if (!url) throw new Error("Approved feed URL is not a safe HTTPS URL.");
      const headers = new Headers({ Accept: "application/json", "User-Agent": rights.userAgent });
      if (checkpoint?.etag) headers.set("If-None-Match", checkpoint.etag);
      if (checkpoint?.last_modified) headers.set("If-Modified-Since", checkpoint.last_modified);
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000), redirect: "error", cache: "no-store" });
      const etag = response.headers.get("etag") ?? undefined;
      const lastModified = response.headers.get("last-modified") ?? undefined;
      if (response.status === 304) return { candidates: [], requestCount: 1, noChange: true, etag, lastModified };
      if (!response.ok) throw new Error(`Approved feed returned HTTP ${response.status}.`);
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > 2_000_000) throw new Error("Approved feed exceeded the 2 MB safety limit.");
      const body = await response.text();
      if (body.length > 2_000_000) throw new Error("Approved feed exceeded the 2 MB safety limit.");
      const payload: unknown = JSON.parse(body);
      const observedAt = new Date().toISOString();
      const candidates = recordsFromPayload(payload).flatMap((record, index) => {
        const category = categoryFrom(record.category, policy.defaultCategory, allowedCategories);
        const canonicalUrl = asString(record.canonicalUrl) ?? asString(record.productUrl) ?? asString(record.url);
        const safeCanonicalUrl = canonicalUrl ? safeHttpsUrl(canonicalUrl)?.toString() : undefined;
        const externalId = asString(record.sku) ?? asString(record.id) ?? asString(record.handle) ?? safeCanonicalUrl ?? undefined;
        if (!category || !safeCanonicalUrl || !externalId) return [];
        return [{
          externalId: `${externalId}:${index}`,
          sourceId: source.slug,
          sourceKind: source.source_kind,
          legalBasis: source.legal_basis,
          canonicalUrl: safeCanonicalUrl,
          observedAt,
          category,
          raw: pickRawRecord(record),
        }];
      });
      return { candidates, requestCount: 1, noChange: candidates.length === 0, etag, lastModified };
    },
    normalize: buildNormalizer(source, review),
  };
  return adapter;
}

export async function loadDatabaseSources(lane: RefreshLane, now = new Date()): Promise<LoadedDatabaseSources> {
  const database = getSupabaseAdmin();
  if (!database) return { sources: [], skipped: [{ sourceId: "database", reason: "Catalog database is not configured." }] };
  const { data: sourceData, error: sourceError } = await database
    .from("ingestion_sources")
    .select("id, slug, name, source_kind, base_url, legal_basis, crawl_policy, enabled, allowed_categories, refresh_interval_hours, accountable_owner, terms_url, robots_url, robots_policy, permitted_fields, content_handling, automated_access_permitted, publication_permitted, max_requests_per_minute, crawler_user_agent")
    .eq("enabled", true);
  if (sourceError) throw new Error(`Could not load ingestion sources: ${sourceError.message}`);
  const rows = (sourceData ?? []) as SourceRow[];
  if (!rows.length) return { sources: [], skipped: [] };
  const sourceIds = rows.map((source) => source.id);
  const [reviewsResult, checkpointsResult] = await Promise.all([
    database.from("source_rights_reviews").select("id, source_id, status, legal_basis, terms_url, robots_url, allowed_fields, content_handling, automated_access_permitted, publication_permitted, evidence_reference, reviewed_at, valid_until").in("source_id", sourceIds).eq("status", "approved"),
    database.from("source_refresh_checkpoints").select("id, source_id, lane, cursor, etag, last_modified, next_due_at, failure_count").in("source_id", sourceIds).eq("lane", lane),
  ]);
  if (reviewsResult.error) throw new Error(`Could not load source rights reviews: ${reviewsResult.error.message}`);
  if (checkpointsResult.error) throw new Error(`Could not load source refresh checkpoints: ${checkpointsResult.error.message}`);
  const reviews = (reviewsResult.data ?? []) as RightsReviewRow[];
  const checkpoints = (checkpointsResult.data ?? []) as CheckpointRow[];
  const sources: SourceAdapter[] = [];
  const skipped: LoadedDatabaseSources["skipped"] = [];
  for (const row of rows) {
    const review = reviews.find((entry) => entry.source_id === row.id && (!entry.valid_until || new Date(entry.valid_until) >= now));
    if (!review) { skipped.push({ sourceId: row.slug, reason: "No current approved source-rights review is recorded." }); continue; }
    const adapter = makeAdapter(row, review, checkpoints.find((entry) => entry.source_id === row.id));
    if (!adapter) { skipped.push({ sourceId: row.slug, reason: "Source policy must use the approved json_catalog_v1 feed format." }); continue; }
    if (!adapter.refreshLanes.includes(lane)) { skipped.push({ sourceId: row.slug, reason: `Source is not approved for the ${lane} lane.` }); continue; }
    const nextDueAt = adapter.databaseBinding?.nextDueAt;
    if (nextDueAt && new Date(nextDueAt) > now) { skipped.push({ sourceId: row.slug, reason: `Next refresh is due at ${nextDueAt}.` }); continue; }
    sources.push(adapter);
  }
  return { sources, skipped };
}
