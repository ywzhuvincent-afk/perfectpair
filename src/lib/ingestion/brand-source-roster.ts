import { representativeBrands } from "@/lib/mock-data";
import { tightsProducts } from "@/lib/tights";
import type { ProductCategory } from "@/lib/types";
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

const braFacts = [
  "brand", "productFamily", "productName", "merchantSku", "canonicalProductUrl",
  "variantId", "style", "wire", "cupConstruction", "supportLevel", "material",
  "sizeSystem", "sizeChartVersion", "sizeRange", "bandRange", "cupRange",
  "price", "currency", "availability", "countryOrMarket", "lastUpdatedAt",
];

const tightsFacts = [
  "brand", "productFamily", "productName", "merchantSku", "canonicalProductUrl",
  "variantId", "denier", "opacity", "waist", "toe", "compression", "material",
  "sizeSystem", "sizeChartVersion", "sizeRange", "price", "currency", "availability",
  "countryOrMarket", "lastUpdatedAt",
];

const excludedWithoutWrittenLicence = [
  "product images and image URLs", "long product descriptions", "brand editorial copy",
  "logos and other creative assets", "merchant review text",
];

const initialBraBrands = new Set([
  "ThirdLove", "Panache", "Freya", "Wacoal", "Natori", "Chantelle", "Elomi",
  "Aerie", "Knix", "Harper Wilde", "Understance", "Felina",
]);

function idFor(brand: string) {
  return brand
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createTarget(brand: string, category: ProductCategory, launchWave: 1 | 2): BrandSourceTarget {
  return {
    id: `${category}-${idFor(brand)}`,
    brand,
    categories: [category],
    launchWave,
    state: "awaiting_authorized_access",
    channelOrder: [
      "brand_claim_portal",
      "retailer_or_distributor_feed",
      "pim_or_gdsn_licensed_data",
      "brand_provided_csv",
      "physical_sample_audit",
      "verified_contributor_evidence",
    ],
    requiredFacts: category === "bra" ? braFacts : tightsFacts,
    excludedWithoutWrittenLicence,
  };
}

/**
 * This is the complete brand universe currently promised by the directory.
 * It deliberately contains no guessed API endpoint, credential, or licence.
 * A target becomes an enabled SourceAdapter only after a real source review.
 */
export const brandSourceTargets: BrandSourceTarget[] = [
  ...representativeBrands.map((brand) => createTarget(brand, "bra", initialBraBrands.has(brand) ? 1 : 2)),
  ...Array.from(new Set(tightsProducts.map((product) => product.brand)))
    .sort((left, right) => left.localeCompare(right))
    .map((brand) => createTarget(brand, "tights", 1)),
];

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
            "No authorised data channel has been recorded for this brand.",
            "Commercial price and availability require a current licensed retailer, distributor, PIM/GDSN or brand source.",
            "Independent fit facts may be collected through a physical audit or consented contributor evidence, then reviewed before publication.",
          ],
    };
  });
}

export function getBrandSourceRosterSummary() {
  const readiness = getBrandSourceReadiness();
  return {
    totalBrands: readiness.length,
    braBrands: readiness.filter((target) => target.categories.includes("bra")).length,
    tightsBrands: readiness.filter((target) => target.categories.includes("tights")).length,
    launchWaveOne: readiness.filter((target) => target.launchWave === 1).length,
    activeSources: readiness.filter((target) => target.linkedSourceIds.length > 0).length,
    status: "No live brand source is enabled until its access, field scope and publication rights are documented.",
  };
}
