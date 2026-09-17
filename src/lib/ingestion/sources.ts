import type { NormalizedCandidate, SourceAttribution } from "@/lib/types";
import type { SourceAdapter } from "./types";

const observedAt = "2026-09-14T00:00:00.000Z";
const provenance: SourceAttribution = { layer: "manufacturer", sourceKind: "affiliate_feed", sourceName: "Demo Authorized Feed", capturedAt: observedAt, confidence: "verified" };

/**
 * Safe fixture only. Real adapters must be activated only after the source's
 * terms, robots policy, rate limit, scope, and an accountable owner are saved
 * in ingestion_sources. A successful run creates a review candidate, never a
 * public product automatically.
 */
export const demoAuthorizedFeed: SourceAdapter = {
  id: "demo-authorized-feed",
  name: "Demo Authorized Feed",
  kind: "affiliate_feed",
  legalBasis: "partner_authorized",
  enabled: true,
  allowedCategories: ["bra"],
  refreshIntervalHours: 24,
  refreshLanes: ["catalog", "price_availability"],
  accountableOwner: "catalog@perfectpair.example",
  rights: {
    termsUrl: "https://example.invalid/terms",
    robotsUrl: "https://example.invalid/robots.txt",
    reviewedAt: "2026-09-14T00:00:00.000Z",
    robotsPolicy: "honor",
    allowedFields: ["brand", "name", "style", "wire", "cupConstruction", "supportLevel", "material", "sizeRange", "price", "updatedAt", "availability", "officialUrl"],
    contentHandling: "licensed_full_content",
    permitsAutomatedAccess: true,
    permitsPublication: true,
    maxRequestsPerMinute: 30,
    userAgent: "PerfectPairCatalogBot/1.0 (+https://perfectpair.example/data-policy)",
    evidenceReference: "Development fixture: replace with a signed feed agreement before production activation.",
  },
  requiresHumanReview: true,
  async discover() {
    return { candidates: [{ externalId: "demo-bra-001", sourceId: "demo-authorized-feed", sourceKind: "affiliate_feed", legalBasis: "partner_authorized", canonicalUrl: "https://example.invalid/catalog/demo-bra-001", observedAt, category: "bra", raw: { brand: "Example Atelier", name: "Everyday Smooth Bra", style: "t_shirt", wire: "underwire", cupConstruction: "moulded", price: 64, currency: "USD", sizes: "30–42 B–H", material: ["nylon", "elastane"], supportLevel: 3 } }], requestCount: 0, noChange: false };
  },
  async normalize(candidate): Promise<NormalizedCandidate> {
    const raw = candidate.raw;
    return { candidate, product: { brand: String(raw.brand), name: String(raw.name), style: raw.style as "t_shirt", wire: raw.wire as "underwire", cupConstruction: raw.cupConstruction as "moulded", supportLevel: Number(raw.supportLevel) as 1 | 2 | 3 | 4 | 5, material: raw.material as string[], sizeRange: String(raw.sizes), price: { amount: Number(raw.price), currency: String(raw.currency), observedAt: candidate.observedAt, priceType: "list" }, updatedAt: candidate.observedAt }, fieldSources: { brand: provenance, name: provenance, style: provenance, wire: provenance, cupConstruction: provenance, material: provenance, sizeRange: provenance, price: provenance } };
  },
};

/** Separate fixture demonstrates that new hosiery follows exactly the same
 * discover → normalize → quality → human review path, without direct publish. */
export const demoAuthorizedTightsFeed: SourceAdapter = {
  id: "demo-authorized-tights-feed",
  name: "Demo Authorized Tights Feed",
  kind: "affiliate_feed",
  legalBasis: "partner_authorized",
  enabled: true,
  allowedCategories: ["tights"],
  refreshIntervalHours: 24,
  refreshLanes: ["catalog", "price_availability"],
  accountableOwner: "catalog@perfectpair.example",
  rights: {
    termsUrl: "https://example.invalid/terms",
    robotsUrl: "https://example.invalid/robots.txt",
    reviewedAt: "2026-09-14T00:00:00.000Z",
    robotsPolicy: "honor",
    allowedFields: ["brand", "name", "style", "denier", "waist", "material", "sizeRange", "price", "updatedAt", "availability", "officialUrl"],
    contentHandling: "licensed_full_content",
    permitsAutomatedAccess: true,
    permitsPublication: true,
    maxRequestsPerMinute: 30,
    userAgent: "PerfectPairCatalogBot/1.0 (+https://perfectpair.example/data-policy)",
    evidenceReference: "Development fixture: replace with a signed feed agreement before production activation.",
  },
  requiresHumanReview: true,
  async discover() {
    return { candidates: [{ externalId: "demo-tights-001", sourceId: "demo-authorized-tights-feed", sourceKind: "affiliate_feed", legalBasis: "partner_authorized", canonicalUrl: "https://example.invalid/catalog/demo-tights-001", observedAt, category: "tights", raw: { brand: "Example Atelier", name: "Everyday Matte 50", style: "semi_opaque", denier: 50, waist: "regular", price: 24, currency: "USD", sizes: "S–XL", material: ["polyamide", "elastane"] } }], requestCount: 0, noChange: false };
  },
  async normalize(candidate): Promise<NormalizedCandidate> {
    const raw = candidate.raw;
    return { candidate, product: { brand: String(raw.brand), name: String(raw.name), style: String(raw.style), denier: Number(raw.denier), waist: String(raw.waist), material: raw.material as string[], sizeRange: String(raw.sizes), price: { amount: Number(raw.price), currency: String(raw.currency), observedAt: candidate.observedAt, priceType: "list" } }, fieldSources: { brand: provenance, name: provenance, style: provenance, denier: provenance, waist: provenance, material: provenance, sizeRange: provenance, price: provenance } };
  },
};

export const sourceRegistry: SourceAdapter[] = [demoAuthorizedFeed, demoAuthorizedTightsFeed];

export function findSource(sourceId: string) { return sourceRegistry.find((source) => source.id === sourceId); }
