import type { Confidence, FitLabel, ProductScore, SourceAttribution } from "@/lib/types";

export type TightsStyle = "sheer" | "semi_opaque" | "opaque" | "shaping" | "thermal" | "patterned";
export type TightsOpacity = "ultra_sheer" | "sheer" | "semi_opaque" | "opaque";
export type TightsFitIssue = "waist_rolls" | "waist_digs" | "sags" | "short_inseam" | "toe_pressure" | "snags" | "too_warm" | "not_warm_enough" | "none";
export type TightsSizeSystem = "US_CA" | "UK" | "EU" | "brand_specific" | "unknown";
export type TightsMeasurementConfidence = "measured_recently" | "estimated" | "not_sure";
export type CompressionPreference = "none" | "light" | "firm" | "not_sure";

/**
 * A separate, optional preference record for hosiery. It deliberately uses only
 * information needed to make a wearable recommendation: no photo, scan, or
 * appearance evaluation belongs here.
 */
export interface TightsProfile {
  usualSize?: string;
  sizeSystem?: TightsSizeSystem;
  heightCm?: number;
  waistCm?: number;
  hipCm?: number;
  inseamCm?: number;
  preferredDenier?: "sheer" | "everyday" | "opaque" | "warm";
  preferredWaist?: "regular" | "high_waist" | "control_top" | "any";
  compressionPreference?: CompressionPreference;
  measurementConfidence?: TightsMeasurementConfidence;
  /** Lets a user refresh recommendations after a change without requiring a
   * reason, photo, body scan, or health information. */
  fitChangedRecently?: boolean;
  priorities: Array<"comfort" | "durability" | "warmth" | "sheerness" | "control" | "value">;
  avoid: TightsFitIssue[];
  profileMatchingConsent: boolean;
}

export interface TightsSnapshot {
  id: string;
  profile: TightsProfile;
  recordedAt: string;
  label?: string;
}

export interface TightsProduct {
  kind: "tights";
  id: string;
  slug: string;
  brand: string;
  name: string;
  country?: string;
  style: TightsStyle;
  denier: number;
  opacity: TightsOpacity;
  material: string[];
  features: string[];
  useCases: Array<"everyday" | "work" | "occasion" | "travel" | "cold_weather">;
  fit: FitLabel;
  fitNotes: string[];
  sizeRange: string;
  waist: "regular" | "high_waist" | "control_top" | "maternity";
  /** `not_verified` is deliberately distinct from a closed toe.  A missing
   * manufacturer fact must never become a product claim just to satisfy the
   * comparison interface. */
  toe: "reinforced" | "sheer" | "sandal" | "closed" | "not_verified";
  warmth: 1 | 2 | 3 | 4 | 5;
  compression: 0 | 1 | 2 | 3 | 4 | 5;
  price: { currency: string; amount: number; observedAt: string; priceType: "list" | "sale" };
  availability: "in_stock" | "low_stock" | "unknown" | "out_of_stock";
  score: ProductScore;
  data: SourceAttribution[];
  updatedAt: string;
  productVersion: string;
}

export interface TightsMatchResult {
  product: TightsProduct;
  score: number;
  suggestedSize: string | null;
  confidence: Confidence;
  reasons: string[];
  cautions: string[];
}

export type CatalogProduct = import("@/lib/types").BraProduct | TightsProduct;

export function isTightsProduct(product: CatalogProduct): product is TightsProduct {
  return "kind" in product && product.kind === "tights";
}

export const demoTightsProfile: TightsProfile = {
  usualSize: "M",
  heightCm: 168,
  preferredDenier: "everyday",
  preferredWaist: "regular",
  priorities: ["comfort", "durability", "sheerness"],
  avoid: ["waist_rolls", "sags"],
  profileMatchingConsent: false,
};

const observedAt = "2026-09-14T00:00:00.000Z";
const source = (sourceName: string, layer: "manufacturer" | "community", confidence: Confidence): SourceAttribution => ({
  layer,
  sourceKind: layer === "manufacturer" ? "official" : "community",
  sourceName,
  capturedAt: observedAt,
  confidence,
});

const score = (values: Partial<ProductScore> & Pick<ProductScore, "overall" | "reviewCount" | "confidence">): ProductScore => ({
  comfort: 4,
  bandComfort: 4,
  cupFit: 4,
  wireComfort: 5,
  strapComfort: 5,
  stayPut: 4,
  sideSupport: 4,
  breathability: 4,
  durability: 4,
  sizeAccuracy: 4,
  value: 4,
  ...values,
});

/** Development fixtures only. A production record is published only after its
 * official or authorised source, specific SKU, price, availability and version
 * pass the same review queue as a bra record. */
export const tightsProducts: TightsProduct[] = [
  {
    kind: "tights", id: "falke-pure-matt-50", slug: "falke-pure-matt-50", brand: "Falke", name: "Pure Matt 50", country: "Germany", style: "semi_opaque", denier: 50, opacity: "semi_opaque", material: ["polyamide", "elastane"], features: ["matte finish", "soft waistband", "reinforced toe"], useCases: ["everyday", "work", "travel"], fit: "true_to_size", fitNotes: ["Illustrative development seed: verify the current brand chart."], sizeRange: "S–XL", waist: "regular", toe: "reinforced", warmth: 3, compression: 1, price: { currency: "USD", amount: 28, observedAt, priceType: "list" }, availability: "unknown", score: score({ overall: 4.3, comfort: 4.4, bandComfort: 4.2, cupFit: 4.1, stayPut: 4.3, breathability: 3.9, durability: 4.2, sizeAccuracy: 4.1, value: 3.9, reviewCount: 142, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: observedAt, productVersion: "seed-2026.09",
  },
  {
    kind: "tights", id: "wolford-individual-10", slug: "wolford-individual-10", brand: "Wolford", name: "Individual 10", country: "Austria", style: "sheer", denier: 10, opacity: "ultra_sheer", material: ["nylon", "elastane"], features: ["ultra sheer", "sandal toe", "soft waistband"], useCases: ["occasion", "work"], fit: "varies", fitNotes: ["Illustrative development seed: check the current size guide."], sizeRange: "XS–XL", waist: "regular", toe: "sandal", warmth: 1, compression: 0, price: { currency: "USD", amount: 49, observedAt, priceType: "list" }, availability: "unknown", score: score({ overall: 4.1, comfort: 4.0, bandComfort: 4.1, cupFit: 4.0, stayPut: 4.0, breathability: 4.6, durability: 3.6, sizeAccuracy: 4.0, value: 3.2, reviewCount: 87, confidence: "emerging" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "emerging")], updatedAt: observedAt, productVersion: "seed-2026.09",
  },
  {
    kind: "tights", id: "sheertex-classic-sheer", slug: "sheertex-classic-sheer", brand: "Sheertex", name: "Classic Sheer", country: "Canada", style: "sheer", denier: 20, opacity: "sheer", material: ["nylon", "elastane"], features: ["reinforced knit", "sheer finish", "high-rise option"], useCases: ["everyday", "work", "occasion"], fit: "runs_small", fitNotes: ["Illustrative development seed: confirm current fit guidance."], sizeRange: "XS–3XL", waist: "high_waist", toe: "reinforced", warmth: 2, compression: 1, price: { currency: "USD", amount: 59, observedAt, priceType: "list" }, availability: "unknown", score: score({ overall: 4.0, comfort: 3.9, bandComfort: 3.8, cupFit: 3.9, stayPut: 4.0, breathability: 4.1, durability: 4.4, sizeAccuracy: 3.6, value: 3.7, reviewCount: 116, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: observedAt, productVersion: "seed-2026.09",
  },
  {
    kind: "tights", id: "spanx-opaque-70", slug: "spanx-opaque-70", brand: "Spanx", name: "Tight-End Opaque 70", country: "United States", style: "shaping", denier: 70, opacity: "opaque", material: ["nylon", "elastane"], features: ["control top", "opaque coverage", "smooth waistband"], useCases: ["work", "cold_weather", "travel"], fit: "true_to_size", fitNotes: ["Illustrative development seed."], sizeRange: "S–3X", waist: "control_top", toe: "closed", warmth: 4, compression: 3, price: { currency: "USD", amount: 32, observedAt, priceType: "list" }, availability: "unknown", score: score({ overall: 4.2, comfort: 4.0, bandComfort: 4.1, cupFit: 4.1, stayPut: 4.3, breathability: 3.5, durability: 4.1, sizeAccuracy: 4.0, value: 4.0, reviewCount: 179, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: observedAt, productVersion: "seed-2026.09",
  },
  {
    kind: "tights", id: "commando-ultimate-opaque", slug: "commando-ultimate-opaque", brand: "Commando", name: "Ultimate Opaque", country: "United States", style: "opaque", denier: 80, opacity: "opaque", material: ["nylon", "elastane"], features: ["opaque coverage", "wide waistband", "flat seam"], useCases: ["everyday", "work", "cold_weather"], fit: "true_to_size", fitNotes: ["Illustrative development seed."], sizeRange: "XS–XL", waist: "high_waist", toe: "reinforced", warmth: 5, compression: 2, price: { currency: "USD", amount: 38, observedAt, priceType: "list" }, availability: "unknown", score: score({ overall: 4.4, comfort: 4.3, bandComfort: 4.4, cupFit: 4.3, stayPut: 4.5, breathability: 3.4, durability: 4.2, sizeAccuracy: 4.2, value: 3.9, reviewCount: 131, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: observedAt, productVersion: "seed-2026.09",
  },
  {
    kind: "tights", id: "heist-the-eighties", slug: "heist-the-eighties", brand: "Heist", name: "The Eighty", country: "United Kingdom", style: "opaque", denier: 80, opacity: "opaque", material: ["nylon", "elastane"], features: ["no-roll waistband", "opaque knit", "seam-free brief"], useCases: ["everyday", "work", "cold_weather"], fit: "true_to_size", fitNotes: ["Illustrative development seed."], sizeRange: "A–E", waist: "high_waist", toe: "closed", warmth: 4, compression: 1, price: { currency: "USD", amount: 35, observedAt, priceType: "list" }, availability: "unknown", score: score({ overall: 4.2, comfort: 4.3, bandComfort: 4.5, cupFit: 4.2, stayPut: 4.2, breathability: 3.6, durability: 3.9, sizeAccuracy: 4.0, value: 3.8, reviewCount: 93, confidence: "emerging" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "emerging")], updatedAt: observedAt, productVersion: "seed-2026.09",
  },
];
