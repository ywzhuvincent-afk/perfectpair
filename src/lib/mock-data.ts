import type { BraProduct, BraProfile, Confidence, DataLayer, ProductScore, SourceAttribution } from "@/lib/types";

const now = "2026-09-14T00:00:00.000Z";

export const demoProfile: BraProfile = {
  heightCm: 168,
  weightKg: 61,
  underbustSnugCm: 79,
  underbustLooseCm: 82,
  bustStandingCm: 96,
  currentBandSize: 34,
  currentCupSize: "D",
  knownWorkingBra: "A 34D smooth T-shirt bra",
  rootWidth: "average",
  projection: "average",
  preferredWire: "any",
  commonUseCases: ["everyday", "work"],
  fitPriorities: ["comfort", "band", "cup", "straps"],
  avoid: ["band_digs", "straps_slip"],
  profileMatchingConsent: false,
};

const source = (sourceName: string, layer: DataLayer, confidence: Confidence): SourceAttribution => ({
  layer,
  sourceKind: layer === "manufacturer" ? "official" : layer === "community" ? "community" : "lab",
  sourceName,
  capturedAt: now,
  confidence,
});

const score = (values: Partial<ProductScore> & Pick<ProductScore, "overall" | "reviewCount" | "confidence">): ProductScore => ({
  comfort: 4,
  bandComfort: 4,
  cupFit: 4,
  wireComfort: 4,
  strapComfort: 4,
  stayPut: 4,
  sideSupport: 4,
  breathability: 4,
  durability: 4,
  sizeAccuracy: 4,
  value: 4,
  ...values,
});

/**
 * Development-only, representative records. They make the product shape and
 * matching UI runnable; a live record may publish only after its official or
 * authorized source, variant and version are reviewed.
 */
export const products: BraProduct[] = [
  {
    id: "thirdlove-classic-tshirt", slug: "thirdlove-classic-tshirt", brand: "ThirdLove", name: "Classic T-Shirt Bra", family: "Everyday", country: "United States",
    style: "t_shirt", wire: "underwire", cupConstruction: "moulded", supportLevel: 3, material: ["nylon", "elastane"], features: ["smooth cups", "adjustable straps", "hook-and-eye closure"], useCases: ["everyday", "work", "travel"], fit: "true_to_size", fitNotes: ["Illustrative seed: verify individual colour/size availability."], sizeSystem: "US_CA", sizeRange: "30–44 A–H", bandRange: [30, 44], cupRange: ["A", "H"], construction: { goreHeight: "medium", wingHeight: "medium", strapPlacement: "centered", closureRows: 3, bandStretch: "medium", wireWidth: "average", cupDepth: "average" }, price: { currency: "USD", amount: 72, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.2, comfort: 4.3, bandComfort: 4.2, cupFit: 4.1, wireComfort: 4.0, strapComfort: 4.1, stayPut: 4.2, breathability: 4.0, durability: 3.9, sizeAccuracy: 4.0, value: 3.7, reviewCount: 184, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "panache-envy-balconette", slug: "panache-envy-balconette", brand: "Panache", name: "Envy Balconette", family: "Envy", country: "United Kingdom",
    style: "balconette", wire: "underwire", cupConstruction: "seamed", supportLevel: 5, material: ["polyamide", "elastane"], features: ["three-part cup", "side support", "firm band"], useCases: ["everyday", "work", "occasion"], fit: "varies", fitNotes: ["Illustrative seed: fit varies by cup volume and construction."], sizeSystem: "UK", sizeRange: "28–40 D–J", bandRange: [28, 40], cupRange: ["D", "J"], construction: { goreHeight: "high", wingHeight: "high", strapPlacement: "wide_set", closureRows: 3, bandStretch: "low", wireWidth: "wide", cupDepth: "projected" }, price: { currency: "USD", amount: 76, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.5, comfort: 4.2, bandComfort: 4.0, cupFit: 4.4, wireComfort: 4.0, strapComfort: 4.0, stayPut: 4.5, sideSupport: 4.7, durability: 4.3, sizeAccuracy: 3.8, value: 4.0, reviewCount: 267, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "freya-offbeat-side-support", slug: "freya-offbeat-side-support", brand: "Freya", name: "Offbeat Side Support", family: "Offbeat", country: "United Kingdom",
    style: "plunge", wire: "underwire", cupConstruction: "seamed", supportLevel: 4, material: ["polyamide", "elastane"], features: ["side-support panel", "low center front", "adjustable straps"], useCases: ["everyday", "occasion"], fit: "true_to_size", fitNotes: ["Illustrative seed."], sizeSystem: "UK", sizeRange: "28–38 D–J", bandRange: [28, 38], cupRange: ["D", "J"], construction: { goreHeight: "low", wingHeight: "medium", strapPlacement: "centered", closureRows: 3, bandStretch: "medium", wireWidth: "average", cupDepth: "projected" }, price: { currency: "USD", amount: 72, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.3, comfort: 4.1, bandComfort: 4.1, cupFit: 4.3, wireComfort: 4.1, strapComfort: 4.0, stayPut: 4.3, sideSupport: 4.5, breathability: 4.2, durability: 4.0, sizeAccuracy: 4.1, value: 4.0, reviewCount: 152, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "wacoal-basic-beauty", slug: "wacoal-basic-beauty", brand: "Wacoal", name: "Basic Beauty Full Figure", family: "Basic Beauty", country: "United States",
    style: "full_coverage", wire: "underwire", cupConstruction: "moulded", supportLevel: 5, material: ["nylon", "spandex"], features: ["full coverage", "wide wings", "supportive frame"], useCases: ["everyday", "work", "travel"], fit: "true_to_size", fitNotes: ["Illustrative seed."], sizeSystem: "US_CA", sizeRange: "32–44 C–H", bandRange: [32, 44], cupRange: ["C", "H"], construction: { goreHeight: "high", wingHeight: "high", strapPlacement: "wide_set", closureRows: 4, bandStretch: "medium", wireWidth: "wide", cupDepth: "average" }, price: { currency: "USD", amount: 68, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.4, comfort: 4.4, bandComfort: 4.4, cupFit: 4.3, wireComfort: 4.2, strapComfort: 4.2, stayPut: 4.5, sideSupport: 4.6, breathability: 3.9, durability: 4.2, sizeAccuracy: 4.3, value: 4.0, reviewCount: 221, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "natori-feathers-plunge", slug: "natori-feathers-plunge", brand: "Natori", name: "Feathers Plunge", family: "Feathers", country: "United States",
    style: "plunge", wire: "underwire", cupConstruction: "padded", supportLevel: 3, material: ["nylon", "elastane"], features: ["low plunge", "light padding", "convertible straps"], useCases: ["occasion", "work"], fit: "runs_small", fitNotes: ["Illustrative seed: check the brand chart before purchase."], sizeSystem: "US_CA", sizeRange: "30–38 A–G", bandRange: [30, 38], cupRange: ["A", "G"], construction: { goreHeight: "low", wingHeight: "low", strapPlacement: "convertible", closureRows: 2, bandStretch: "medium", wireWidth: "narrow", cupDepth: "shallow" }, price: { currency: "USD", amount: 74, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.0, comfort: 3.9, bandComfort: 3.8, cupFit: 4.0, wireComfort: 3.8, strapComfort: 4.1, stayPut: 4.0, sideSupport: 3.6, breathability: 4.1, durability: 3.8, sizeAccuracy: 3.6, value: 3.6, reviewCount: 139, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "chantelle-c-comfort-wirefree", slug: "chantelle-c-comfort-wirefree", brand: "Chantelle", name: "Comfort Wirefree", family: "Comfort", country: "France",
    style: "wireless", wire: "wireless", cupConstruction: "soft_cup", supportLevel: 2, material: ["polyamide", "elastane"], features: ["wire-free", "smooth knit", "wide underband"], useCases: ["lounge", "everyday", "travel"], fit: "true_to_size", fitNotes: ["Illustrative seed."], sizeSystem: "EU", sizeRange: "XS–2XL", construction: { wingHeight: "medium", strapPlacement: "centered", bandStretch: "high" }, price: { currency: "USD", amount: 68, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.2, comfort: 4.5, bandComfort: 4.4, cupFit: 4.0, wireComfort: 5, strapComfort: 4.3, stayPut: 3.9, sideSupport: 3.5, breathability: 4.2, durability: 3.9, sizeAccuracy: 4.0, value: 3.7, reviewCount: 102, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "elomi-matilda-plunge", slug: "elomi-matilda-plunge", brand: "Elomi", name: "Matilda Plunge", family: "Matilda", country: "United Kingdom",
    style: "plunge", wire: "underwire", cupConstruction: "unlined", supportLevel: 5, material: ["polyamide", "elastane"], features: ["three-piece cup", "side support", "adjustable straps"], useCases: ["everyday", "work", "occasion"], fit: "true_to_size", fitNotes: ["Illustrative seed."], sizeSystem: "UK", sizeRange: "34–48 DD–K", bandRange: [34, 48], cupRange: ["DD", "K"], construction: { goreHeight: "low", wingHeight: "high", strapPlacement: "centered", closureRows: 4, bandStretch: "low", wireWidth: "wide", cupDepth: "projected" }, price: { currency: "USD", amount: 72, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.6, comfort: 4.3, bandComfort: 4.2, cupFit: 4.5, wireComfort: 4.2, strapComfort: 4.1, stayPut: 4.5, sideSupport: 4.8, breathability: 4.4, durability: 4.3, sizeAccuracy: 4.2, value: 4.1, reviewCount: 244, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "aerie-smoothez-bralette", slug: "aerie-smoothez-bralette", brand: "Aerie", name: "SMOOTHEZ Bralette", family: "SMOOTHEZ", country: "United States",
    style: "bralette", wire: "wireless", cupConstruction: "soft_cup", supportLevel: 1, material: ["nylon", "elastane"], features: ["seam-free", "wire-free", "light support"], useCases: ["lounge", "travel", "everyday"], fit: "true_to_size", fitNotes: ["Illustrative seed."], sizeSystem: "US_CA", sizeRange: "XXS–XXL", construction: { wingHeight: "low", strapPlacement: "centered", bandStretch: "high" }, price: { currency: "USD", amount: 35, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.1, comfort: 4.6, bandComfort: 4.4, cupFit: 3.8, wireComfort: 5, strapComfort: 4.2, stayPut: 3.7, sideSupport: 3.2, breathability: 4.3, durability: 3.7, sizeAccuracy: 4.1, value: 4.3, reviewCount: 198, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "knix-evolution-bra", slug: "knix-evolution-bra", brand: "Knix", name: "Evolution Bra", family: "Evolution", country: "Canada",
    style: "wireless", wire: "wireless", cupConstruction: "moulded", supportLevel: 3, material: ["nylon", "elastane"], features: ["removable pads", "wire-free", "adjustable straps"], useCases: ["everyday", "travel", "lounge"], fit: "varies", fitNotes: ["Illustrative seed: cup fit should be verified by size."], sizeSystem: "US_CA", sizeRange: "XS+–3XL+", construction: { wingHeight: "medium", strapPlacement: "convertible", closureRows: 3, bandStretch: "high" }, price: { currency: "CAD", amount: 65, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.2, comfort: 4.4, bandComfort: 4.3, cupFit: 3.9, wireComfort: 5, strapComfort: 4.2, stayPut: 4.0, sideSupport: 3.7, breathability: 4.1, durability: 4.0, sizeAccuracy: 3.9, value: 3.8, reviewCount: 167, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "harper-wilde-bliss", slug: "harper-wilde-bliss", brand: "Harper Wilde", name: "Bliss Bralette", family: "Bliss", country: "United States",
    style: "bralette", wire: "wireless", cupConstruction: "soft_cup", supportLevel: 2, material: ["nylon", "elastane"], features: ["seam-free", "wire-free", "pull-on"], useCases: ["lounge", "travel", "everyday"], fit: "true_to_size", fitNotes: ["Illustrative seed."], sizeSystem: "US_CA", sizeRange: "XS–4XL", construction: { wingHeight: "medium", strapPlacement: "centered", bandStretch: "high" }, price: { currency: "USD", amount: 45, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.0, comfort: 4.5, bandComfort: 4.3, cupFit: 3.7, wireComfort: 5, strapComfort: 4.1, stayPut: 3.6, sideSupport: 3.1, breathability: 4.2, durability: 3.8, sizeAccuracy: 4.0, value: 4.0, reviewCount: 144, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "understance-yara-flexwire", slug: "understance-yara-flexwire", brand: "Understance", name: "Yara FlexWire", family: "Yara", country: "Canada",
    style: "full_coverage", wire: "flex_wire", cupConstruction: "seamed", supportLevel: 4, material: ["polyamide", "elastane"], features: ["flex wire", "full coverage", "adjustable straps"], useCases: ["everyday", "work"], fit: "true_to_size", fitNotes: ["Illustrative seed."], sizeSystem: "US_CA", sizeRange: "30–44 B–J", bandRange: [30, 44], cupRange: ["B", "J"], construction: { goreHeight: "medium", wingHeight: "high", strapPlacement: "centered", closureRows: 4, bandStretch: "medium", wireWidth: "average", cupDepth: "average" }, price: { currency: "CAD", amount: 69, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.3, comfort: 4.3, bandComfort: 4.2, cupFit: 4.2, wireComfort: 4.4, strapComfort: 4.1, stayPut: 4.3, sideSupport: 4.3, breathability: 4.0, durability: 4.0, sizeAccuracy: 4.1, value: 4.2, reviewCount: 118, confidence: "developing" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "developing")], updatedAt: now, productVersion: "seed-2026.09",
  },
  {
    id: "felina-amelie-unlined", slug: "felina-amelie-unlined", brand: "Felina", name: "Amelie Unlined", family: "Amelie", country: "United States",
    style: "full_coverage", wire: "underwire", cupConstruction: "unlined", supportLevel: 4, material: ["nylon", "elastane"], features: ["unlined cup", "side support", "breathable mesh"], useCases: ["everyday", "work", "travel"], fit: "varies", fitNotes: ["Illustrative seed."], sizeSystem: "US_CA", sizeRange: "32–42 C–H", bandRange: [32, 42], cupRange: ["C", "H"], construction: { goreHeight: "high", wingHeight: "high", strapPlacement: "wide_set", closureRows: 3, bandStretch: "medium", wireWidth: "wide", cupDepth: "projected" }, price: { currency: "USD", amount: 58, observedAt: now, priceType: "list" }, availability: "unknown", score: score({ overall: 4.1, comfort: 4.2, bandComfort: 4.1, cupFit: 4.0, wireComfort: 3.9, strapComfort: 4.0, stayPut: 4.2, sideSupport: 4.3, breathability: 4.5, durability: 4.0, sizeAccuracy: 3.9, value: 4.1, reviewCount: 91, confidence: "emerging" }), data: [source("Development manufacturer mapping", "manufacturer", "developing"), source("PerfectPair structured review seed", "community", "emerging")], updatedAt: now, productVersion: "seed-2026.09",
  },
];

/** 26 brands represented in the directory before their catalogues are approved for publication. */
export const representativeBrands = [
  "Aerie", "Anita", "Bravissimo", "Chantelle", "Curvy Kate", "Elomi", "Evelyn & Bobbie", "Felina", "Fantasie", "Freya", "Glamorise", "Harper Wilde", "Knix", "Le Mystère", "Natori", "Panache", "Parfait", "PrimaDonna", "Savage X Fenty", "Soma", "ThirdLove", "Understance", "Wacoal", "Warner's", "Victoria's Secret", "Empreinte",
];

export const scoreLabels = ["overall", "comfort", "bandComfort", "cupFit", "wireComfort", "strapComfort", "stayPut", "sideSupport", "breathability", "durability", "sizeAccuracy", "value"] as const;
