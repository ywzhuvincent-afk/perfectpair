import type { ProductCategory } from "@/lib/types";
import { CATALOG_BRAND_GOAL, catalogCoverageTargets, type CatalogCoverageTarget } from "./catalog-100-targets";
import { sourceRegistry } from "./sources";

export type AcquisitionChannel =
  | "brand_claim_portal"
  | "retailer_or_distributor_feed"
  | "pim_or_gdsn_licensed_data"
  | "brand_provided_csv"
  | "physical_sample_audit"
  | "verified_contributor_evidence";

export type AcquisitionState =
  | "awaiting_authorized_access"
  | "evidence_collection"
  | "rights_review"
  | "feed_validation"
  | "ready_for_review"
  | "active"
  | "paused";

export interface BrandSourceTarget {
  id: string;
  brand: string;
  categories: ProductCategory[];
  launchWave: 1 | 2;
  state: AcquisitionState;
  channelOrder: AcquisitionChannel[];
  requiredFacts: string[];
  excludedWithoutWrittenLicence: string[];
}

export interface BrandSourceReadiness extends BrandSourceTarget {
  linkedSourceIds: string[];
  blockers: string[];
}

const requiredFactsByCategory: Record<ProductCategory, string[]> = {
  bra: [
    "brand", "productFamily", "productName", "canonicalProductUrl", "style", "wire", "cupConstruction",
    "supportLevel", "material", "sizeSystem", "sizeChartVersion", "sizeRange", "bandRange", "cupRange", "lastUpdatedAt",
  ],
  tights: [
    "brand", "productFamily", "productName", "canonicalProductUrl", "denier", "opacity", "waist", "toe",
    "compression", "material", "sizeSystem", "sizeChartVersion", "sizeRange", "lastUpdatedAt",
  ],
  leggings: [
    "brand", "productFamily", "productName", "canonicalProductUrl", "rise", "inseam", "compression", "stretch",
    "material", "sizeSystem", "sizeRange", "lastUpdatedAt",
  ],
  jeans: [
    "brand", "productFamily", "productName", "canonicalProductUrl", "rise", "leg", "thighFit", "stretch",
    "material", "sizeSystem", "sizeRange", "lastUpdatedAt",
  ],
};

const excludedWithoutWrittenLicence = [
  "product images and image URLs", "long product descriptions", "brand editorial copy",
  "logos and other creative assets", "merchant review text",
];

function idFor(brand: string) {
  return brand
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createTarget(target: CatalogCoverageTarget): BrandSourceTarget {
  return {
    id: `${target.category}-${idFor(target.brand)}`,
    brand: target.brand,
    categories: [target.category],
    launchWave: target.launchWave,
    state: "awaiting_authorized_access",
    channelOrder: [
      "brand_claim_portal",
      "retailer_or_distributor_feed",
      "pim_or_gdsn_licensed_data",
      "brand_provided_csv",
      "physical_sample_audit",
      "verified_contributor_evidence",
    ],
    requiredFacts: requiredFactsByCategory[target.category],
    excludedWithoutWrittenLicence,
  };
}

/**
 * The 100-brand growth queue is a coverage backlog, not a claim that those
 * brands are already searchable or that PerfectPair has their image rights.
 */
export const brandSourceTargets: BrandSourceTarget[] = catalogCoverageTargets.map(createTarget);

export function getBrandSourceReadiness(): BrandSourceReadiness[] {
  return brandSourceTargets.map((target) => {
    const linkedSourceIds = sourceRegistry
      .filter((source) => source.brandTargetIds?.includes(target.id))
      .map((source) => source.id);

    return {
      ...target,
      linkedSourceIds,
      blockers: linkedSourceIds.length
        ? []
        : [
            "No authorised or verified fact source has been recorded for this brand.",
            "Images, long descriptions, retailer reviews, price and stock stay excluded unless a current written licence explicitly permits them.",
            "A public product record needs a source URL, at least the category's required fit facts, field-level provenance and a version record.",
          ],
    };
  });
}

export function getBrandSourceRosterSummary() {
  const readiness = getBrandSourceReadiness();
  return {
    targetBrands: CATALOG_BRAND_GOAL,
    totalBrands: readiness.length,
    braBrands: readiness.filter((target) => target.categories.includes("bra")).length,
    tightsBrands: readiness.filter((target) => target.categories.includes("tights")).length,
    leggingsBrands: readiness.filter((target) => target.categories.includes("leggings")).length,
    jeansBrands: readiness.filter((target) => target.categories.includes("jeans")).length,
    launchWaveOne: readiness.filter((target) => target.launchWave === 1).length,
    activeSources: readiness.filter((target) => target.linkedSourceIds.length > 0).length,
    status: "A 100-brand coverage queue is active. A target becomes searchable only after source, fields, rights and provenance pass review.",
  };
}
